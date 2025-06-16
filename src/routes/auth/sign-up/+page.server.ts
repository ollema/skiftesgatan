import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';
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
import { route } from '$lib/routes';

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export const load = async (event) => {
	console.log('[auth] Sign up page load function triggered');

	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			console.log(
				`[auth][${event.locals.user.apartment}] User is logged in but email is not verified, redirecting to /auth/verify-email`
			);
			redirect(302, route('/auth/verify-email'));
		}
		console.log(
			`[auth][${event.locals.user.apartment}] User is already logged in, redirecting to /`
		);
		redirect(302, route('/'));
	}

	const form = await superValidate(zod(formSchema));
	return { form };
};

export const actions = {
	default: async (event) => {
		console.log('[auth] Sign up form action triggered');

		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			console.log('[auth] Invalid form submission');
			return fail(400, { form });
		}

		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');

		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log(`[auth] IP rate limit exceeded during sign-up check from ${clientIP}`);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, { form });
		}

		const { apartment, email, password } = form.data;

		if (!verifyEmailInput(email)) {
			console.log('[auth] Invalid email format during sign-up');
			setError(form, 'email', 'Ange en giltig emailadress');
			return { form };
		}

		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log('[auth] Email is already used during sign-up');
			setError(form, 'email', 'Emailadressen används redan');
			return { form };
		}

		if (!verifyApartmentInput(apartment)) {
			console.log(`[auth][${apartment}] Invalid apartment format during sign-up`);
			setError(form, 'apartment', 'Ogiltigt lägenhetsnummer');
			return { form };
		}

		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			console.log(`[auth][${apartment}] Weak password during sign-up`);
			setError(form, 'password', 'Svagt lösenord');
			return { form };
		}

		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log(
				`[auth][${apartment}] IP rate limit exceeded during sign-up consume from ${clientIP}`
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

		const user = await createUser(apartment, email, password);
		const emailVerificationRequest = createEmailVerificationRequest(user.id, user.email);
		await sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log(`[auth][${apartment}] Registration successful, redirecting to /auth/verify-email`);
		redirect(302, route('/auth/verify-email'));
	}
};
