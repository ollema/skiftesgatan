import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from '$lib/server/auth/email-verification';
import { fail, redirect } from '@sveltejs/kit';
import { checkEmailAvailability, verifyEmailInput } from '$lib/server/auth/email';
import { verifyPasswordHash, verifyPasswordStrength } from '$lib/server/auth/password';
import { getUserPasswordHash, updateUserPassword } from '$lib/server/auth/user';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import { ExpiringTokenBucket } from '$lib/server/auth/rate-limit';

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const load = async (event) => {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}
	return {
		user: event.locals.user
	};
};

export const actions = {
	password: async (event) => {
		if (event.locals.session === null || event.locals.user === null) {
			return fail(401, {
				password: {
					message: 'Not authenticated'
				}
			});
		}
		if (!passwordUpdateBucket.check(event.locals.session.id, 1)) {
			return fail(429, {
				password: {
					message: 'Too many requests'
				}
			});
		}

		const formData = await event.request.formData();
		const password = formData.get('password');
		const newPassword = formData.get('new_password');

		if (typeof password !== 'string' || typeof newPassword !== 'string') {
			return fail(400, {
				password: {
					message: 'Invalid or missing fields'
				}
			});
		}
		const strongPassword = await verifyPasswordStrength(newPassword);
		if (!strongPassword) {
			return fail(400, {
				password: {
					message: 'Weak password'
				}
			});
		}

		if (!passwordUpdateBucket.consume(event.locals.session.id, 1)) {
			return fail(429, {
				password: {
					message: 'Too many requests'
				}
			});
		}

		const passwordHash = await getUserPasswordHash(event.locals.user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			return fail(400, {
				password: {
					message: 'Incorrect password'
				}
			});
		}
		passwordUpdateBucket.reset(event.locals.session.id);
		invalidateUserSessions(event.locals.user.id);
		await updateUserPassword(event.locals.user.id, newPassword);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, event.locals.user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return {
			password: {
				message: 'Updated password'
			}
		};
	},
	email: async (event) => {
		if (event.locals.session === null || event.locals.user === null) {
			return fail(401, {
				email: {
					message: 'Not authenticated'
				}
			});
		}
		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			return fail(429, {
				email: {
					message: 'Too many requests'
				}
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email');
		if (typeof email !== 'string') {
			return fail(400, {
				email: {
					message: 'Invalid or missing fields'
				}
			});
		}
		if (email === '') {
			return fail(400, {
				email: {
					message: 'Please enter your email'
				}
			});
		}
		if (!verifyEmailInput(email)) {
			return fail(400, {
				email: {
					message: 'Please enter a valid email'
				}
			});
		}
		const emailAvailable = checkEmailAvailability(email);
		if (!emailAvailable) {
			return fail(400, {
				email: {
					message: 'This email is already used'
				}
			});
		}
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			return fail(429, {
				email: {
					message: 'Too many requests'
				}
			});
		}
		const verificationRequest = await createEmailVerificationRequest(event.locals.user.id, email);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
		return redirect(302, '/auth/verify-email');
	}
};
