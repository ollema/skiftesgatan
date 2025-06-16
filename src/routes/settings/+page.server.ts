import { fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	debugEmailFormSchema,
	emailFormSchema,
	passwordFormSchema,
	preferencesFormSchema
} from './schema';
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
import { recalculateUserNotifications } from '$lib/server/notifications';
import { sendBookingNotification } from '$lib/server/resend';

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const load = async (event) => {
	console.log('[auth] Settings page load function triggered');

	if (event.locals.session === null || event.locals.user === null) {
		console.log('[auth] No session or user found, redirecting to /auth/sign-in');
		redirect(302, route('/auth/sign-in'));
	}

	const preferences = getUserPreferences(event.locals.user.id);

	const preferencesForm = await superValidate(preferences, zod(preferencesFormSchema));
	const emailForm = await superValidate(zod(emailFormSchema));
	const passwordForm = await superValidate(zod(passwordFormSchema));
	const debugEmailForm = await superValidate(zod(debugEmailFormSchema), { id: 'debugEmailForm' });

	return {
		user: event.locals.user,
		preferencesForm,
		emailForm,
		passwordForm,
		debugEmailForm
	};
};

export const actions = {
	preferences: async (event) => {
		console.log(
			`[auth][${event.locals.user?.apartment || 'unknown'}] Update preferences form action triggered`
		);

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
			console.log(`[auth][${event.locals.user.apartment}] Invalid preferences form submission`);
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
			await recalculateUserNotifications(event.locals.user.id);
		} catch {
			console.log(
				`[auth][${event.locals.user.apartment}] Failed to update preferences for user ${event.locals.user.id}`
			);
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

		console.log(
			`[auth][${event.locals.user.apartment}] Preferences updated successfully for user ${event.locals.user.id}`
		);
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
		console.log(
			`[auth][${event.locals.user?.apartment || 'unknown'}] Update email form action triggered`
		);

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, redirecting to /auth/sign-in');
			setFlash(
				{
					type: 'error',
					message: 'Logga in för att uppdatera din emailadress'
				},
				event
			);
			redirect(302, route('/auth/sign-in'));
		}

		const emailForm = await superValidate(event, zod(emailFormSchema));
		if (!emailForm.valid) {
			console.log(`[auth][${event.locals.user.apartment}] Invalid email form submission`);
			return fail(400, {
				emailForm: emailForm
			});
		}

		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			console.log(
				`[auth][${event.locals.user.apartment}] Too many requests for user ${event.locals.user.id}`
			);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				emailForm
			});
		}

		const email = emailForm.data.email;

		if (!verifyEmailInput(email)) {
			console.log(`[auth][${event.locals.user.apartment}] Invalid email format`);
			setError(emailForm, 'email', 'Ange en giltig emailadress');
			return fail(400, {
				emailForm
			});
		}

		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log(`[auth][${event.locals.user.apartment}] Email is already in use`);
			setError(emailForm, 'email', 'Denna emailadress används redan');
			return fail(400, {
				emailForm
			});
		}

		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			console.log(
				`[auth][${event.locals.user.apartment}] Too many requests for user ${event.locals.user.id}`
			);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				emailForm
			});
		}

		const verificationRequest = createEmailVerificationRequest(event.locals.user.id, email);
		await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);

		redirect(
			302,
			route('/auth/verify-email'),
			{
				type: 'success',
				message:
					'Ett email har skickats för att verifiera din nya emailadress. Följ instruktionerna i meddelandet.'
			},
			event
		);
	},
	password: async (event) => {
		console.log(
			`[auth][${event.locals.user?.apartment || 'unknown'}] Update password form action triggered`
		);

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[auth] No session or user found, redirecting to /auth/sign-in');
			setFlash(
				{
					type: 'error',
					message: 'Logga in för att uppdatera ditt lösenord'
				},
				event
			);
			redirect(302, route('/auth/sign-in'));
		}

		const passwordForm = await superValidate(event, zod(passwordFormSchema));
		if (!passwordForm.valid) {
			console.log(`[auth][${event.locals.user.apartment}] Invalid password form submission`);
			return fail(400, {
				passwordForm: passwordForm
			});
		}

		if (!passwordUpdateBucket.check(event.locals.session.id, 1)) {
			console.log(
				`[auth][${event.locals.user.apartment}] Too many requests for user ${event.locals.user.id}`
			);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				passwordForm
			});
		}

		const { currentPassword, newPassword } = passwordForm.data;

		const strongPassword = await verifyPasswordStrength(newPassword);
		if (!strongPassword) {
			console.log(`[auth][${event.locals.user.apartment}] Weak password provided`);
			setError(passwordForm, 'newPassword', 'Svagt lösenord');
			return fail(400, {
				passwordForm
			});
		}

		if (!passwordUpdateBucket.consume(event.locals.session.id, 1)) {
			console.log(
				`[auth][${event.locals.user.apartment}] Too many requests for session ${event.locals.session.id}`
			);
			setFlash(
				{
					type: 'error',
					message: 'För många förfrågningar'
				},
				event
			);
			return fail(429, {
				passwordForm
			});
		}

		const passwordHash = getUserPasswordHash(event.locals.user.id);
		const validPassword = await verifyPasswordHash(passwordHash, currentPassword);
		if (!validPassword) {
			console.log(
				`[auth][${event.locals.user.apartment}] Incorrect password for user ${event.locals.user.id}`
			);
			setError(passwordForm, 'currentPassword', 'Felaktigt lösenord');
			return fail(400, {
				passwordForm
			});
		}

		passwordUpdateBucket.reset(event.locals.session.id);
		invalidateUserSessions(event.locals.user.id);
		await updateUserPassword(event.locals.user.id, newPassword);

		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, event.locals.user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log(
			`[auth][${event.locals.user.apartment}] Password updated successfully for user ${event.locals.user.id}`
		);
		setFlash(
			{
				type: 'success',
				message: 'Lösenordet uppdaterat'
			},
			event
		);
		return { passwordForm };
	},
	debugEmail: async (event) => {
		console.log('[debug] Debug email form action triggered');

		if (event.locals.session === null || event.locals.user === null) {
			console.log('[debug] No session or user found, redirecting to /auth/sign-in');
			setFlash(
				{
					type: 'error',
					message: 'Logga in för att skicka test-email'
				},
				event
			);
			redirect(302, route('/auth/sign-in'));
		}

		const debugEmailForm = await superValidate(event, zod(debugEmailFormSchema));
		if (!debugEmailForm.valid) {
			console.log(`[debug][${event.locals.user.apartment}] Invalid debug email form submission`);
			return fail(400, {
				debugEmailForm
			});
		}

		try {
			const testDate = new Date();
			testDate.setHours(testDate.getHours() + 2);

			await sendBookingNotification({
				to: event.locals.user.email,
				bookingType: 'laundry',
				bookingStart: testDate,
				bookingEnd: new Date(testDate.getTime() + 4 * 60 * 60 * 1000),
				apartment: event.locals.user.apartment,
				scheduledAt: new Date(Date.now() + 5000),
				idempotencyKey: `debug-${Date.now()}`
			});

			console.log('[debug] Test email scheduled successfully');
			setFlash(
				{
					type: 'success',
					message: 'Test-email skickat! Kolla din inkorg.'
				},
				event
			);
		} catch (error) {
			console.error('[debug] Failed to send test email:', error);
			setFlash(
				{
					type: 'error',
					message: 'Kunde inte skicka test-email'
				},
				event
			);
			return fail(500, {
				debugEmailForm
			});
		}

		return { debugEmailForm };
	}
};
