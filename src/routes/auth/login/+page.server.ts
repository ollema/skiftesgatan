import { fail, redirect } from '@sveltejs/kit';
import { verifyEmailInput } from '$lib/server/auth/email';
import { getUserFromEmail, getUserPasswordHash } from '$lib/server/auth/user';
import { RefillingTokenBucket, Throttler } from '$lib/server/auth/rate-limit';
import { verifyPasswordHash } from '$lib/server/auth/password';
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '$lib/server/auth/session';

export const load = (event) => {
	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			return redirect(302, '/auth/verify-email');
		}
		return redirect(302, '/');
	}
	return {};
};

const throttler = new Throttler<string>([0, 1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export const actions = {
	default: async (event) => {
		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			return fail(429, {
				message: 'Too many requests',
				email: ''
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, {
				message: 'Invalid or missing fields',
				email: ''
			});
		}
		if (email === '' || password === '') {
			return fail(400, {
				message: 'Please enter your email and password.',
				email
			});
		}
		if (!verifyEmailInput(email)) {
			return fail(400, {
				message: 'Invalid email',
				email
			});
		}
		const user = await getUserFromEmail(email);
		if (user === null) {
			return fail(400, {
				message: 'Account does not exist',
				email
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			return fail(429, {
				message: 'Too many requests',
				email: ''
			});
		}
		if (!throttler.consume(user.id)) {
			return fail(429, {
				message: 'Too many requests',
				email: ''
			});
		}
		const passwordHash = await getUserPasswordHash(user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			return fail(400, {
				message: 'Invalid password',
				email
			});
		}
		throttler.reset(user.id);
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		if (!user.emailVerified) {
			return redirect(302, '/auth/verify-email');
		}
		return redirect(302, '/');
	}
};
