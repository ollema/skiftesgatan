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
				'[auth] User is logged in but email is not verified, redirecting to /auth/verify-email',
				{ apartment: event.locals.user.apartment }
			);
			redirect(302, route('/auth/verify-email'));
		}
		console.log('[auth] User is already logged in, redirecting to /', {
			apartment: event.locals.user.apartment
		});
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
			console.log('[auth] Invalid form submission:', form.errors);
			return fail(400, { form });
		}

		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');

		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during sign-up check', { ip: clientIP });
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
			console.log('[auth] Invalid email format during sign-up', { email });
			setError(form, 'email', 'Ange en giltig e-postadress');
			return fail(400, { form });
		}

		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log('[auth] Email is already used during sign-up', { email });
			setError(form, 'email', 'E-postadressen används redan');
			return fail(400, { form });
		}

		if (!verifyApartmentInput(apartment)) {
			console.log('[auth] Invalid apartment format during sign-up', { apartment, email });
			setError(form, 'apartment', 'Ogiltigt lägenhetsnummer');
			return fail(400, { form });
		}

		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			console.log('[auth] Weak password during sign-up', { email, apartment });
			setError(form, 'password', 'Svagt lösenord');
			return fail(400, { form });
		}

		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during sign-up consume', {
				ip: clientIP,
				email,
				apartment
			});
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
		sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log('[auth] Registration successful, redirecting to /auth/verify-email', {
			apartment,
			email
		});
		redirect(302, route('/auth/verify-email'));
	}
};
