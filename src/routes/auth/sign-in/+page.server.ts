import { fail, redirect } from '@sveltejs/kit';
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

export const load = (event) => {
	console.log('[auth] Sign in page load function triggered');

	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			console.log(
				'[auth] User is logged in but email is not verified, redirecting to /auth/verify-email'
			);
			return redirect(302, route('/auth/verify-email'));
		}
		console.log('[auth] User is already logged in, redirecting to /');
		return redirect(302, route('/'));
	}
	return {};
};

const throttler = new Throttler<string>([0, 1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export const actions = {
	default: async (event) => {
		console.log('[auth] Sign in form action triggered');

		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log('[auth] Too many requests from IP:', clientIP);
			return fail(429, {
				message: 'För många förfrågningar',
				apartment: ''
			});
		}

		const formData = await event.request.formData();
		const apartment = formData.get('apartment');
		const password = formData.get('password');

		if (typeof apartment !== 'string' || typeof password !== 'string') {
			console.log('[auth] Invalid or missing fields');
			return fail(400, {
				message: 'Ogiltiga eller saknade fält',
				apartment: ''
			});
		}
		if (apartment === '' || password === '') {
			console.log('[auth] Apartment or password is empty');
			return fail(400, {
				message: 'Ange ditt lägenhetsnummer och lösenord.',
				apartment
			});
		}
		if (!verifyApartmentInput(apartment)) {
			console.log('[auth] Invalid apartment:', apartment);
			return fail(400, {
				message: 'Ogiltigt lägenhetsnummer',
				apartment
			});
		}
		const user = await getUserFromApartment(apartment);
		if (user === null) {
			console.log('[auth] Account does not exist for apartment:', apartment);
			return fail(400, {
				message: 'Kontot finns inte',
				apartment
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log('[auth] Too many requests from IP:', clientIP);
			return fail(429, {
				message: 'För många förfrågningar',
				apartment: ''
			});
		}
		if (!throttler.consume(user.id)) {
			console.log('[auth] Too many requests for user:', user.id);
			return fail(429, {
				message: 'För många förfrågningar',
				apartment: ''
			});
		}
		const passwordHash = await getUserPasswordHash(user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			console.log('[auth] Invalid password for user:', user.id);
			return fail(400, {
				message: 'Felaktigt lösenord',
				apartment
			});
		}
		throttler.reset(user.id);
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		if (!user.emailVerified) {
			console.log('[auth] User email not verified, redirecting to /auth/verify-email');
			return redirect(302, route('/auth/verify-email'));
		}

		console.log('[auth] User logged in successfully, redirecting to /');
		return redirect(302, route('/'));
	}
};
