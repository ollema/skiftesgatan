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
	console.log('[auth] Settings page load function triggered');

	if (event.locals.session === null || event.locals.user === null) {
		console.log('[auth] No session or user found, redirecting to /auth/login');
		return redirect(302, '/auth/login');
	}
	return {
		user: event.locals.user
	};
};

export const actions = {
	password: async (event) => {
		console.log('[auth] Update password form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, returning 401');
			return fail(401, {
				password: {
					message: 'Not authenticated'
				}
			});
		}
		if (!passwordUpdateBucket.check(event.locals.session.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
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
			console.log('[auth] Invalid or missing fields');
			return fail(400, {
				password: {
					message: 'Invalid or missing fields'
				}
			});
		}
		const strongPassword = await verifyPasswordStrength(newPassword);
		if (!strongPassword) {
			console.log('[auth] Weak password provided');
			return fail(400, {
				password: {
					message: 'Weak password'
				}
			});
		}

		if (!passwordUpdateBucket.consume(event.locals.session.id, 1)) {
			console.log('[auth] Too many requests for session:', event.locals.session.id);
			return fail(429, {
				password: {
					message: 'Too many requests'
				}
			});
		}

		const passwordHash = await getUserPasswordHash(event.locals.user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			console.log('[auth] Incorrect password for user:', event.locals.user.id);
			return fail(400, {
				password: {
					message: 'Incorrect password'
				}
			});
		}
		passwordUpdateBucket.reset(event.locals.session.id);
		await invalidateUserSessions(event.locals.user.id);
		await updateUserPassword(event.locals.user.id, newPassword);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, event.locals.user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log('[auth] Password updated successfully for user:', event.locals.user.id);
		return {
			password: {
				message: 'Updated password'
			}
		};
	},
	email: async (event) => {
		console.log('[auth] Update email form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, returning 401');
			return fail(401, {
				email: {
					message: 'Not authenticated'
				}
			});
		}
		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(429, {
				email: {
					message: 'Too many requests'
				}
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email');

		if (typeof email !== 'string') {
			console.log('[auth] Invalid or missing email field');
			return fail(400, {
				email: {
					message: 'Invalid or missing fields'
				}
			});
		}
		if (email === '') {
			console.log('[auth] Email is empty');
			return fail(400, {
				email: {
					message: 'Please enter your email'
				}
			});
		}
		if (!verifyEmailInput(email)) {
			console.log('[auth] Invalid email:', email);
			return fail(400, {
				email: {
					message: 'Please enter a valid email'
				}
			});
		}
		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log('[auth] Email is already used:', email);
			return fail(400, {
				email: {
					message: 'This email is already used'
				}
			});
		}
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
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
