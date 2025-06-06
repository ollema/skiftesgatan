import { fail, redirect } from '@sveltejs/kit';
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

export const load = (event) => {
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
	return {
		email: verificationRequest.email
	};
};

const bucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const actions = {
	verify: async (event) => {
		const clientIP = event.request.headers.get('X-Forwarded-For');
		console.log('[auth] Verify email form action triggered', { ip: clientIP });

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, returning 401');
			return fail(401, {
				verify: {
					message: 'Inte autentiserad'
				}
			});
		}
		if (!bucket.check(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(429, {
				verify: {
					message: 'För många förfrågningar'
				}
			});
		}

		let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
		if (verificationRequest === null) {
			console.log('[auth] No email verification request found, returning 401');
			return fail(401, {
				verify: {
					message: 'Not authenticated'
				}
			});
		}
		const formData = await event.request.formData();
		const code = formData.get('code');

		if (typeof code !== 'string') {
			console.log('[auth] Invalid or missing code field');
			return fail(400, {
				verify: {
					message: 'Ogiltiga eller saknade fält'
				}
			});
		}
		if (code === '') {
			console.log('[auth] Code field is empty');
			return fail(400, {
				verify: {
					message: 'Ange din kod'
				}
			});
		}
		if (!bucket.consume(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(400, {
				verify: {
					message: 'Too many requests'
				}
			});
		}
		if (Date.now() >= verificationRequest.expiresAt.getTime()) {
			verificationRequest = createEmailVerificationRequest(
				verificationRequest.userId,
				verificationRequest.email
			);
			sendVerificationEmail(verificationRequest.email, verificationRequest.code);
			console.log('[auth] Verification code expired, new code sent');
			return {
				verify: {
					message: 'Verifieringskoden har gått ut. Vi skickade en ny kod till din inkorg.'
				}
			};
		}
		if (verificationRequest.code !== code) {
			console.log('[auth] Incorrect code provided');
			return fail(400, {
				verify: {
					message: 'Felaktig kod.'
				}
			});
		}
		deleteUserEmailVerificationRequest(event.locals.user.id);
		invalidateUserPasswordResetSessions(event.locals.user.id);
		updateUserEmailAndSetEmailAsVerified(event.locals.user.id, verificationRequest.email);
		deleteEmailVerificationRequestCookie(event);

		console.log('[auth] Email verified successfully, redirecting to /');
		return redirect(302, route('/'));
	},
	resend: (event) => {
		console.log('[auth] Resend verification email form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, returning 401');
			return fail(401, {
				resend: {
					message: 'Not authenticated'
				}
			});
		}
		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(429, {
				resend: {
					message: 'Too many requests'
				}
			});
		}

		let verificationRequest = getUserEmailVerificationRequestFromRequest(event);
		if (verificationRequest === null) {
			if (event.locals.user.emailVerified) {
				console.log('[auth] User email is already verified');
				return fail(403, {
					resend: {
						message: 'Förbjuden'
					}
				});
			}
			if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
				console.log('[auth] Too many requests for user:', event.locals.user.id);
				return fail(429, {
					resend: {
						message: 'Too many requests'
					}
				});
			}
			verificationRequest = createEmailVerificationRequest(
				event.locals.user.id,
				event.locals.user.email
			);
		} else {
			if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
				console.log('[auth] Too many requests for user:', event.locals.user.id);
				return fail(429, {
					resend: {
						message: 'Too many requests'
					}
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
		return {
			resend: {
				message: 'En ny kod skickades till din inkorg.'
			}
		};
	}
};
