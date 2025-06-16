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
				`[auth][${event.locals.user.apartment}] User is logged in but email is not verified, redirecting to /auth/verify-email`
			);
			redirect(302, route('/auth/verify-email'));
		}
		console.log(
			`[auth][${event.locals.user.apartment}] User is already logged in, redirecting to /`
		);
		redirect(302, route('/'));
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
			console.log('[auth] Invalid form submission');
			return fail(400, { form });
		}

		const clientIP = event.request.headers.get('X-Forwarded-For');

		// TODO: assumes X-Forwarded-For is always included.
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log(`[auth] IP rate limit exceeded during sign-in check from ${clientIP}`);
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
			console.log(`[auth][${apartment}] Invalid apartment format during sign-in`);
			setError(form, 'apartment', 'Ogiltigt lägenhetsnummer');
			return { form };
		}

		const user = getUserFromApartment(apartment);
		if (user === null) {
			console.log(`[auth][${apartment}] Account does not exist during sign-in`);
			setError(form, 'apartment', 'Kontot finns inte');
			return { form };
		}

		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log(
				`[auth][${apartment}] IP rate limit exceeded during sign-in consume from ${clientIP}`
			);
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
			console.log(`[auth][${apartment}] User rate limit exceeded during sign-in (user ${user.id})`);
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
			console.log(`[auth][${apartment}] Invalid password during sign-in`);
			setError(form, 'password', 'Felaktigt lösenord');
			return { form };
		}

		throttler.reset(user.id);
		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		if (!user.emailVerified) {
			console.log(
				`[auth][${apartment}] User email not verified after sign-in, redirecting to /auth/verify-email`
			);
			redirect(302, route('/auth/verify-email'));
		}

		console.log(`[auth][${apartment}] User logged in successfully, redirecting to /`);
		redirect(302, route('/'));
	}
};
