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
	console.log('[auth] Reset password page load function triggered');

	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		console.log('[auth] No password reset session found, redirecting to /auth/forgot-password');
		return redirect(302, '/auth/forgot-password');
	}
	if (!session.emailVerified) {
		console.log(
			'[auth] Password reset session found but email is not verified, redirecting to /auth/reset-password/verify-email'
		);
		return redirect(302, '/auth/reset-password/verify-email');
	}
	return {};
};

export const actions = {
	default: async (event) => {
		console.log('[auth] Reset password form action triggered');

		const { session: passwordResetSession, user } =
			await validatePasswordResetSessionRequest(event);
		if (passwordResetSession === null) {
			console.log('[auth] No password reset session found, returning 401');
			return fail(401, {
				message: 'Not authenticated'
			});
		}
		if (!passwordResetSession.emailVerified) {
			console.log('[auth] Password reset session found but email is not verified, returning 403');
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
			console.log('[auth] Weak password provided');
			return fail(400, {
				message: 'Weak password'
			});
		}
		await invalidateUserPasswordResetSessions(passwordResetSession.userId);
		await invalidateUserSessions(passwordResetSession.userId);
		await updateUserPassword(passwordResetSession.userId, password);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		deletePasswordResetSessionTokenCookie(event);

		console.log('[auth] Password reset successful, redirecting to /');
		return redirect(302, '/');
	}
};
