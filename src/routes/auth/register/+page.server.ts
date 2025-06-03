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
	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			return redirect(302, '/auth/verify-email');
		}
		return redirect(302, '/');
	}
	return {};
};

export const actions = {
	default: async (event) => {
		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
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
			return fail(400, {
				message: 'Invalid or missing fields',
				email: '',
				username: ''
			});
		}
		if (email === '' || password === '' || apartment === '') {
			return fail(400, {
				message: 'Please enter your username, email, and password',
				email: '',
				username: ''
			});
		}
		if (!verifyEmailInput(email)) {
			return fail(400, {
				message: 'Invalid email',
				email,
				apartment
			});
		}
		const emailAvailable = checkEmailAvailability(email);
		if (!emailAvailable) {
			return fail(400, {
				message: 'Email is already used',
				email,
				apartment
			});
		}
		if (!verifyApartmentInput(apartment)) {
			return fail(400, {
				message: 'Invalid apartment name',
				email,
				apartment
			});
		}
		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			return fail(400, {
				message: 'Weak password',
				email,
				apartment
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			return fail(429, {
				message: 'Too many requests',
				email,
				apartment
			});
		}
		const user = await createUser(email, apartment, password);
		const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
		sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		throw redirect(302, '/auth/verify-email');
	}
};
