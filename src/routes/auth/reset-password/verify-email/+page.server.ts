import { fail, redirect } from '@sveltejs/kit';
import {
	setPasswordResetSessionAsEmailVerified,
	validatePasswordResetSessionRequest
} from '$lib/server/auth/password-reset';
import { ExpiringTokenBucket } from '$lib/server/auth/rate-limit';
import { setUserAsEmailVerifiedIfEmailMatches } from '$lib/server/auth/user';
import { route } from '$lib/routes';

const bucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const load = async (event) => {
	console.log('[auth] Verify email page load function triggered');

	const { session } = await validatePasswordResetSessionRequest(event);
	if (session === null) {
		console.log('[auth] No password reset session found, redirecting to /auth/forgot-password');
		return redirect(302, route('/auth/forgot-password'));
	}
	if (session.emailVerified) {
		console.log(
			'[auth] Password reset session found but email is already verified, redirecting to /auth/reset-password'
		);
		return redirect(302, route('/auth/reset-password'));
	}
	return {
		email: session.email
	};
};

export const actions = {
	default: async (event) => {
		console.log('[auth] Verify email form action triggered');

		const { session } = await validatePasswordResetSessionRequest(event);
		if (session === null) {
			console.log('[auth] No password reset session found, returning 401');
			return fail(401, {
				message: 'Inte autentiserad'
			});
		}
		if (session.emailVerified) {
			console.log(
				'[auth] Password reset session found but email is already verified, returning 403'
			);
			return fail(403, {
				message: 'Förbjuden'
			});
		}
		if (!bucket.check(session.userId, 1)) {
			console.log('[auth] Too many requests for user:', session.userId);
			return fail(429, {
				message: 'För många förfrågningar'
			});
		}

		const formData = await event.request.formData();
		const code = formData.get('code');
		if (typeof code !== 'string') {
			console.log('[auth] Invalid or missing code field');
			return fail(400, {
				message: 'Ogiltiga eller saknade fält'
			});
		}
		if (code === '') {
			console.log('[auth] Code is empty');
			return fail(400, {
				message: 'Ange din kod'
			});
		}
		if (!bucket.consume(session.userId, 1)) {
			console.log('[auth] Too many requests for user:', session.userId);
			return fail(429, { message: 'För många förfrågningar' });
		}
		if (code !== session.code) {
			console.log('[auth] Incorrect code provided');
			return fail(400, {
				message: 'Felaktig kod'
			});
		}
		bucket.reset(session.userId);
		await setPasswordResetSessionAsEmailVerified(session.id);
		const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
		if (!emailMatches) {
			console.log('[auth] Email does not match user email, returning 400');
			return fail(400, {
				message: 'Vänligen starta om processen'
			});
		}

		console.log('[auth] Email verified successfully, redirecting to /auth/reset-password');
		return redirect(302, route('/auth/reset-password'));
	}
};
