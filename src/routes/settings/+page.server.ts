import { fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { emailFormSchema, passwordFormSchema, preferencesFormSchema } from './schema';
import type { PreferencesUpdate } from '$lib/server/auth/user';
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from '$lib/server/auth/email-verification';
import { checkEmailAvailability, verifyEmailInput } from '$lib/server/auth/email';
import { verifyPasswordHash, verifyPasswordStrength } from '$lib/server/auth/password';
import {
	getUserPasswordHash,
	getUserPreferences,
	updateUserPassword,
	updateUserPreferences
} from '$lib/server/auth/user';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import { ExpiringTokenBucket } from '$lib/server/auth/rate-limit';
import { route } from '$lib/routes';

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const load = async (event) => {
	console.log('[auth] Settings page load function triggered');

	if (event.locals.session === null || event.locals.user === null) {
		console.log('[auth] No session or user found, redirecting to /auth/sign-in');
		return redirect(302, route('/auth/sign-in'));
	}

	const preferences = getUserPreferences(event.locals.user.id);

	const preferencesForm = await superValidate(preferences, zod(preferencesFormSchema));
	const emailForm = await superValidate(zod(emailFormSchema));
	const passwordForm = await superValidate(zod(passwordFormSchema));

	return {
		user: event.locals.user,
		preferencesForm,
		emailForm,
		passwordForm
	};
};

export const actions = {
	preferences: async (event) => {
		console.log('[auth] Update preferences form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, redirecting to /auth/sign-in');
			setFlash(
				{
					type: 'error',
					message: 'Logga in för att uppdatera dina inställningar'
				},
				event
			);
			redirect(302, route('/auth/sign-in'));
		}

		const preferencesForm = await superValidate(event, zod(preferencesFormSchema));
		if (!preferencesForm.valid) {
			console.log('[auth] Invalid preferences form submission:', preferencesForm.errors);
			return fail(400, {
				preferencesForm: preferencesForm
			});
		}

		const preferencesUpdate: PreferencesUpdate = {
			laundryNotificationsEnabled: preferencesForm.data.laundryNotificationsEnabled,
			laundryNotificationTiming: preferencesForm.data.laundryNotificationTiming,
			bbqNotificationsEnabled: preferencesForm.data.bbqNotificationsEnabled,
			bbqNotificationTiming: preferencesForm.data.bbqNotificationTiming
		};

		try {
			updateUserPreferences(event.locals.user.id, preferencesUpdate);
		} catch {
			console.log('[auth] Failed to update preferences for user:', event.locals.user.id);
			setFlash(
				{
					type: 'error',
					message: 'Misslyckades med att uppdatera inställningarna'
				},
				event
			);
			return fail(500, {
				preferencesForm
			});
		}

		console.log('[auth] Preferences updated successfully for user:', event.locals.user.id);
		setFlash(
			{
				type: 'success',
				message: 'Inställningar uppdaterade'
			},
			event
		);
		return { preferencesForm };
	},
	email: async (event) => {
		console.log('[auth] Update email form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, returning 401');
			return fail(401, {
				email: {
					message: 'Inte autentiserad'
				}
			});
		}
		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(429, {
				email: {
					message: 'För många förfrågningar'
				}
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email');

		if (typeof email !== 'string') {
			console.log('[auth] Invalid or missing email field');
			return fail(400, {
				email: {
					message: 'Ogiltiga eller saknade fält'
				}
			});
		}
		if (email === '') {
			console.log('[auth] Email is empty');
			return fail(400, {
				email: {
					message: 'Ange din e-postadress'
				}
			});
		}
		if (!verifyEmailInput(email)) {
			console.log('[auth] Invalid email:', email);
			return fail(400, {
				email: {
					message: 'Ange en giltig e-postadress'
				}
			});
		}
		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log('[auth] Email is already used:', email);
			return fail(400, {
				email: {
					message: 'Denna e-postadress används redan'
				}
			});
		}
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(429, {
				email: {
					message: 'För många förfrågningar'
				}
			});
		}
		const verificationRequest = createEmailVerificationRequest(event.locals.user.id, email);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);

		return redirect(
			302,
			route('/auth/verify-email'),
			{
				type: 'success',
				message:
					'Ett e-postmeddelande har skickats för att verifiera din nya e-postadress. Följ instruktionerna i meddelandet.'
			},
			event
		);
	},
	password: async (event) => {
		console.log('[auth] Update password form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, returning 401');
			return fail(401, {
				password: {
					message: 'Inte autentiserad'
				}
			});
		}
		if (!passwordUpdateBucket.check(event.locals.session.id, 1)) {
			console.log('[auth] Too many requests for user:', event.locals.user.id);
			return fail(429, {
				password: {
					message: 'För många förfrågningar'
				}
			});
		}

		const formData = await event.request.formData();
		const password = formData.get('password');
		const newPassword = formData.get('new_password');

		if (typeof password !== 'string' || typeof newPassword !== 'string') {
			console.log('[auth] Invalid or missing fields');
			return fail(400, {
				password: {
					message: 'Ogiltiga eller saknade fält'
				}
			});
		}
		const strongPassword = await verifyPasswordStrength(newPassword);
		if (!strongPassword) {
			console.log('[auth] Weak password provided');
			return fail(400, {
				password: {
					message: 'Svagt lösenord'
				}
			});
		}

		if (!passwordUpdateBucket.consume(event.locals.session.id, 1)) {
			console.log('[auth] Too many requests for session:', event.locals.session.id);
			return fail(429, {
				password: {
					message: 'För många förfrågningar'
				}
			});
		}

		const passwordHash = await getUserPasswordHash(event.locals.user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			console.log('[auth] Incorrect password for user:', event.locals.user.id);
			return fail(400, {
				password: {
					message: 'Felaktigt lösenord'
				}
			});
		}
		passwordUpdateBucket.reset(event.locals.session.id);
		invalidateUserSessions(event.locals.user.id);
		await updateUserPassword(event.locals.user.id, newPassword);

		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, event.locals.user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log('[auth] Password updated successfully for user:', event.locals.user.id);
		return {
			password: {
				message: 'Lösenordet uppdaterat'
			}
		};
	}
};
