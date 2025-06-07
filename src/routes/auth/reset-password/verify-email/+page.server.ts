import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
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

	const { session } = validatePasswordResetSessionRequest(event);
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

	const form = await superValidate(zod(formSchema));
	return {
		email: session.email,
		form
	};
};

export const actions = {
	default: async (event) => {
		const clientIP = event.request.headers.get('X-Forwarded-For');
		console.log('[auth] Verify email form action triggered', { ip: clientIP });

		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			console.log('[auth] Invalid form submission:', form.errors);
			return fail(400, { form });
		}

		const { session } = validatePasswordResetSessionRequest(event);
		if (session === null) {
			console.log('[auth] No password reset session found, returning 401');
			return fail(401, { form });
		}
		if (session.emailVerified) {
			console.log(
				'[auth] Password reset session found but email is already verified, returning 403'
			);
			return fail(403, { form });
		}

		if (!bucket.check(session.userId, 1)) {
			console.log('[auth] Too many requests for user:', session.userId);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		const { code } = form.data;

		if (!bucket.consume(session.userId, 1)) {
			console.log('[auth] Too many requests for user:', session.userId);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		if (code !== session.code) {
			console.log('[auth] Incorrect code provided');
			setError(form, 'code', 'Felaktig kod');
			return fail(400, { form });
		}

		bucket.reset(session.userId);
		setPasswordResetSessionAsEmailVerified(session.id);
		const emailMatches = setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
		if (!emailMatches) {
			console.log('[auth] Email does not match user email, returning 400');
			setError(form, 'code', 'Vänligen starta om processen');
			return fail(400, { form });
		}

		console.log('[auth] Email verified successfully, redirecting to /auth/reset-password');
		return redirect(302, route('/auth/reset-password'));
	}
};
