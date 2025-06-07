import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import {
	getUserFromApartment,
	getUserPasswordHash,
	verifyApartmentInput
} from '$lib/server/auth/user';
import { RefillingTokenBucket, Throttler } from '$lib/server/auth/rate-limit';
import { verifyPasswordHash } from '$lib/server/auth/password';
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import { route } from '$lib/routes';

export const load = async (event) => {
	console.log('[auth] Sign in page load function triggered');

	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			console.log(
				'[auth] User is logged in but email is not verified, redirecting to /auth/verify-email',
				{ apartment: event.locals.user.apartment }
			);
			return redirect(302, route('/auth/verify-email'));
		}
		console.log('[auth] User is already logged in, redirecting to /', {
			apartment: event.locals.user.apartment
		});
		return redirect(302, route('/'));
	}

	const form = await superValidate(zod(formSchema));
	return { form };
};

const throttler = new Throttler<string>([0, 1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export const actions = {
	default: async (event) => {
		console.log('[auth] Sign in form action triggered');

		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			console.log('[auth] Invalid form submission:', form.errors);
			return fail(400, { form });
		}

		const clientIP = event.request.headers.get('X-Forwarded-For');

		// TODO: assumes X-Forwarded-For is always included.
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during sign-in check', { ip: clientIP });
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		const { apartment, password } = form.data;

		if (!verifyApartmentInput(apartment)) {
			console.log('[auth] Invalid apartment format during sign-in', { apartment });
			setError(form, 'apartment', 'Ogiltigt lägenhetsnummer');
			return fail(400, { form });
		}

		const user = getUserFromApartment(apartment);
		if (user === null) {
			console.log('[auth] Account does not exist during sign-in', { apartment });
			setError(form, 'apartment', 'Kontot finns inte');
			return fail(400, { form });
		}

		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during sign-in consume', {
				ip: clientIP,
				apartment
			});
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		if (!throttler.consume(user.id)) {
			console.log('[auth] User rate limit exceeded during sign-in', { apartment, userId: user.id });
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		const passwordHash = getUserPasswordHash(user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			console.log('[auth] Invalid password during sign-in', { apartment });
			setError(form, 'password', 'Felaktigt lösenord');
			return fail(400, { form });
		}

		throttler.reset(user.id);
		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		if (!user.emailVerified) {
			console.log(
				'[auth] User email not verified after sign-in, redirecting to /auth/verify-email',
				{ apartment, email: user.email }
			);
			return redirect(302, route('/auth/verify-email'));
		}

		console.log('[auth] User logged in successfully, redirecting to /', {
			apartment,
			email: user.email
		});
		return redirect(302, route('/'));
	}
};
