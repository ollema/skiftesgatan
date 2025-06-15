import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	validatePasswordResetSessionRequest
} from '$lib/server/auth/password-reset';
import { verifyPasswordStrength } from '$lib/server/auth/password';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import { updateUserPassword } from '$lib/server/auth/user';
import { route } from '$lib/routes';

export const load = async (event) => {
	console.log('[auth] Reset password page load function triggered');

	const { session } = validatePasswordResetSessionRequest(event);
	if (session === null) {
		console.log('[auth] No password reset session found, redirecting to /auth/forgot-password');
		redirect(302, route('/auth/forgot-password'));
	}
	if (!session.emailVerified) {
		console.log(
			'[auth] Password reset session found but email is not verified, redirecting to /auth/reset-password/verify-email'
		);
		redirect(302, route('/auth/reset-password/verify-email'));
	}

	const form = await superValidate(zod(formSchema));
	return { form };
};

export const actions = {
	default: async (event) => {
		console.log('[auth] Reset password form action triggered');

		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			console.log('[auth] Invalid form submission');
			return fail(400, { form });
		}

		const { session: passwordResetSession, user } = validatePasswordResetSessionRequest(event);
		if (passwordResetSession === null) {
			console.log('[auth] No password reset session found, returning 401');
			return fail(401, { form });
		}
		if (!passwordResetSession.emailVerified) {
			console.log('[auth] Password reset session found but email is not verified, returning 403');
			return fail(403, { form });
		}

		const { password } = form.data;

		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			console.log('[auth] Weak password provided during reset');
			setError(form, 'password', 'Svagt lösenord');
			return fail(400, { form });
		}

		invalidateUserPasswordResetSessions(passwordResetSession.userId);
		invalidateUserSessions(passwordResetSession.userId);
		await updateUserPassword(passwordResetSession.userId, password);

		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		deletePasswordResetSessionTokenCookie(event);

		console.log(`[auth][${user.apartment}] Password reset successful, redirecting to /`);
		redirect(
			302,
			route('/'),
			{
				type: 'success',
				message: 'Lösenordet återställt framgångsrikt'
			},
			event
		);
	}
};
