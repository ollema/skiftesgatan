import { fail, redirect } from '@sveltejs/kit';
import { checkEmailAvailability, verifyEmailInput } from '$lib/server/auth/email';
import { createUser, verifyApartmentInput } from '$lib/server/auth/user';
import { RefillingTokenBucket } from '$lib/server/auth/rate-limit';
import { verifyPasswordStrength } from '$lib/server/auth/password';
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from '$lib/server/auth/email-verification';

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export const load = (event) => {
	console.log('[auth] Sign up page load function triggered');

	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			console.log(
				'[auth] User is logged in but email is not verified, redirecting to /auth/verify-email'
			);
			return redirect(302, '/auth/verify-email');
		}
		console.log('[auth] User is already logged in, redirecting to /');
		return redirect(302, '/');
	}
	return {};
};

export const actions = {
	default: async (event) => {
		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log('[auth] Too many requests from IP:', clientIP);
			return fail(429, {
				message: 'Too many requests',
				email: '',
				username: ''
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email');
		const apartment = formData.get('apartment');
		const password = formData.get('password');

		if (
			typeof email !== 'string' ||
			typeof apartment !== 'string' ||
			typeof password !== 'string'
		) {
			console.log('[auth] Invalid or missing fields');
			return fail(400, {
				message: 'Invalid or missing fields',
				email: '',
				username: ''
			});
		}
		if (email === '' || password === '' || apartment === '') {
			console.log('[auth] Email, apartment, or password is empty');
			return fail(400, {
				message: 'Please enter your username, email, and password',
				email: '',
				username: ''
			});
		}
		if (!verifyEmailInput(email)) {
			console.log('[auth] Invalid email:', email);
			return fail(400, {
				message: 'Invalid email',
				email,
				apartment
			});
		}
		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log('[auth] Email is already used:', email);
			return fail(400, {
				message: 'Email is already used',
				email,
				apartment
			});
		}
		if (!verifyApartmentInput(apartment)) {
			console.log('[auth] Invalid apartment name:', apartment);
			return fail(400, {
				message: 'Invalid apartment name',
				email,
				apartment
			});
		}
		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			console.log('[auth] Weak password for email:', email);
			return fail(400, {
				message: 'Weak password',
				email,
				apartment
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log('[auth] Too many requests from IP:', clientIP);
			return fail(429, {
				message: 'Too many requests',
				email,
				apartment
			});
		}
		const user = await createUser(apartment, email, password);
		const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
		sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log('[auth] Registration successful, redirecting to /auth/verify-email');
		throw redirect(302, '/auth/verify-email');
	}
};
