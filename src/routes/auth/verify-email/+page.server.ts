import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { resendFormSchema, verifyFormSchema } from './schema';
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from '$lib/server/auth/email-verification';
import { invalidateUserPasswordResetSessions } from '$lib/server/auth/password-reset';
import { updateUserEmailAndSetEmailAsVerified } from '$lib/server/auth/user';
import { ExpiringTokenBucket } from '$lib/server/auth/rate-limit';
import { route } from '$lib/routes';

export const load = async (event) => {
	console.log('[auth] Verify email page load function triggered');

	if (event.locals.user === null) {
		console.log('[auth] No user found, redirecting to /auth/sign-in');
		return redirect(302, route('/auth/sign-in'));
	}
	let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null || Date.now() >= verificationRequest.expiresAt.getTime()) {
		if (event.locals.user.emailVerified) {
			console.log('[auth] User email is already verified, redirecting to /');
			return redirect(302, route('/'));
		}
		// note: we don't need rate limiting since it takes time before requests expire
		verificationRequest = createEmailVerificationRequest(
			event.locals.user.id,
			event.locals.user.email
		);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
	}

	const verifyForm = await superValidate(zod(verifyFormSchema));
	const resendForm = await superValidate(zod(resendFormSchema));

	return {
		email: verificationRequest.email,
		verifyForm,
		resendForm
	};
};

const bucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const actions = {
	verify: async (event) => {
		const clientIP = event.request.headers.get('X-Forwarded-For');
		console.log('[auth] Verify email form action triggered', { ip: clientIP });

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, redirecting to /auth/sign-in');
			setFlash(
				{
					type: 'error',
					message: 'Logga in för att verifiera din e-postadress'
				},
				event
			);
			redirect(302, route('/auth/sign-in'));
		}

		const verifyForm = await superValidate(event, zod(verifyFormSchema));
		if (!verifyForm.valid) {
			console.log('[auth] Invalid verify form submission:', verifyForm.errors);
			return fail(400, {
				verifyForm: verifyForm
			});
		}

		if (!bucket.check(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				verifyForm
			});
		}

		let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
		if (verificationRequest === null) {
			console.log('[auth] No email verification request found, returning 401');
			setFlash(
				{
					type: 'error',
					message: 'Inte autentiserad'
				},
				event
			);
			return fail(401, {
				verifyForm
			});
		}

		const { code } = verifyForm.data;

		if (!bucket.consume(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				verifyForm
			});
		}

		if (Date.now() >= verificationRequest.expiresAt.getTime()) {
			verificationRequest = createEmailVerificationRequest(
				verificationRequest.userId,
				verificationRequest.email
			);
			sendVerificationEmail(verificationRequest.email, verificationRequest.code);
			setEmailVerificationRequestCookie(event, verificationRequest);
			console.log('[auth] Verification code expired, new code sent');
			setFlash(
				{
					type: 'success',
					message: 'Verifieringskoden har gått ut. Vi skickade en ny kod till din inkorg.'
				},
				event
			);
			return { verifyForm };
		}

		if (verificationRequest.code !== code) {
			console.log('[auth] Incorrect code provided');
			setError(verifyForm, 'code', 'Felaktig kod');
			return fail(400, {
				verifyForm
			});
		}

		deleteUserEmailVerificationRequest(event.locals.user.id);
		invalidateUserPasswordResetSessions(event.locals.user.id);
		updateUserEmailAndSetEmailAsVerified(event.locals.user.id, verificationRequest.email);
		deleteEmailVerificationRequestCookie(event);

		console.log('[auth] Email verified successfully, redirecting to /');
		return redirect(302, route('/'));
	},
	resend: async (event) => {
		console.log('[auth] Resend verification email form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, redirecting to /auth/sign-in');
			setFlash(
				{
					type: 'error',
					message: 'Logga in för att skicka kod igen'
				},
				event
			);
			redirect(302, route('/auth/sign-in'));
		}

		const resendForm = await superValidate(event, zod(resendFormSchema));
		if (!resendForm.valid) {
			console.log('[auth] Invalid resend form submission:', resendForm.errors);
			return fail(400, {
				resendForm: resendForm
			});
		}

		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				resendForm
			});
		}

		let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
		if (verificationRequest === null) {
			if (event.locals.user.emailVerified) {
				console.log('[auth] User email is already verified');
				setFlash(
					{
						type: 'error',
						message: 'E-postadressen är redan verifierad'
					},
					event
				);
				return fail(403, {
					resendForm
				});
			}
			if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
				console.log('[auth] Too many requests for user:', event.locals.user.id);
				setFlash(
					{
						type: 'error',
						message: 'För många förfrågningar'
					},
					event
				);
				return fail(429, {
					resendForm
				});
			}
			verificationRequest = createEmailVerificationRequest(
				event.locals.user.id,
				event.locals.user.email
			);
		} else {
			if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
				console.log('[auth] Too many requests for user:', event.locals.user.id);
				setFlash(
					{
						type: 'error',
						message: 'För många förfrågningar'
					},
					event
				);
				return fail(429, {
					resendForm
				});
			}
			verificationRequest = createEmailVerificationRequest(
				event.locals.user.id,
				verificationRequest.email
			);
		}
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);

		console.log("[auth] New verification code sent to user's email");
		setFlash(
			{
				type: 'success',
				message: 'En ny kod skickades till din inkorg.'
			},
			event
		);
		return { resendForm };
	}
};
