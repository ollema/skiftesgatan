import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
import { getUserFromApartment, verifyApartmentInput } from '$lib/server/auth/user';
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie
} from '$lib/server/auth/password-reset';
import { RefillingTokenBucket } from '$lib/server/auth/rate-limit';
import { generateSessionToken } from '$lib/server/auth/session';
import { route } from '$lib/routes';

const ipBucket = new RefillingTokenBucket<string>(3, 60);
const userBucket = new RefillingTokenBucket<string>(3, 60);

export const load = async () => {
	const form = await superValidate(zod(formSchema));
	return { form };
};

export const actions = {
	default: async (event) => {
		console.log('[auth] Forgot password form action triggered');

		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			console.log('[auth] Invalid form submission');
			return fail(400, { form });
		}

		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');

		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log(`[auth] IP rate limit exceeded during forgot-password check from ${clientIP}`);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		const { apartment } = form.data;

		if (!verifyApartmentInput(apartment)) {
			console.log(`[auth][${apartment}] Invalid apartment format during forgot-password`);
			setError(form, 'apartment', 'Ogiltigt lägenhetsnummer');
			return { form };
		}

		const user = getUserFromApartment(apartment);
		if (user === null) {
			console.log(`[auth][${apartment}] Account does not exist during forgot-password`);
			setError(form, 'apartment', 'Kontot finns inte');
			return { form };
		}

		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log(
				`[auth][${apartment}] IP rate limit exceeded during forgot-password consume from ${clientIP}`
			);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		if (!userBucket.consume(user.id, 1)) {
			console.log(
				`[auth][${apartment}] User rate limit exceeded during forgot-password (user ${user.id})`
			);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		invalidateUserPasswordResetSessions(user.id);
		const sessionToken = generateSessionToken();
		const session = createPasswordResetSession(sessionToken, user.id, user.email);
		await sendPasswordResetEmail(session.email, session.code);
		setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log(`[auth][${apartment}] Password reset email sent successfully`);
		console.log(`[auth][${apartment}] Redirecting to /auth/reset-password/verify-email`);
		redirect(302, route('/auth/reset-password/verify-email'));
	}
};
