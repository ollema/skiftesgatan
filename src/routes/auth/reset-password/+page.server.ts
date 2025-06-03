import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	validatePasswordResetSessionRequest
} from '$lib/server/auth/password-reset';
import { fail, redirect } from '@sveltejs/kit';
import { verifyPasswordStrength } from '$lib/server/auth/password';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import { updateUserPassword } from '$lib/server/auth/user';

export const load = async (event) => {
	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		return redirect(302, '/auth/forgot-password');
	}
	if (!session.emailVerified) {
		return redirect(302, '/auth/reset-password/verify-email');
	}
	return {};
};

export const actions = {
	default: async (event) => {
		const { session: passwordResetSession, user } =
			await validatePasswordResetSessionRequest(event);
		if (passwordResetSession === null) {
			return fail(401, {
				message: 'Not authenticated'
			});
		}
		if (!passwordResetSession.emailVerified) {
			return fail(403, {
				message: 'Forbidden'
			});
		}

		const formData = await event.request.formData();
		const password = formData.get('password');

		if (typeof password !== 'string') {
			return fail(400, {
				message: 'Invalid or missing fields'
			});
		}

		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			return fail(400, {
				message: 'Weak password'
			});
		}
		invalidateUserPasswordResetSessions(passwordResetSession.userId);
		invalidateUserSessions(passwordResetSession.userId);
		await updateUserPassword(passwordResetSession.userId, password);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		deletePasswordResetSessionTokenCookie(event);
		return redirect(302, '/');
	}
};
