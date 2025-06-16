import { z } from 'zod';

export const preferencesFormSchema = z.object({
	laundryNotificationsEnabled: z.boolean(),
	laundryNotificationTiming: z.enum(['1_hour', '1_day', '1_week']),
	bbqNotificationsEnabled: z.boolean(),
	bbqNotificationTiming: z.enum(['1_hour', '1_day', '1_week'])
});

export const emailFormSchema = z.object({
	email: z.string().email('Ogiltig emailadress')
});

export const passwordFormSchema = z
	.object({
		currentPassword: z.string().min(8, 'Lösenordet måste vara minst 8 tecken'),
		newPassword: z.string().min(8, 'Nytt lösenord måste vara minst 8 tecken')
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: 'Nytt lösenord kan inte vara samma som nuvarande lösenord'
	});

export const debugEmailFormSchema = z.object({
	// no fields needed for debug email, but we need a schema for consistency
});

export type PreferencesFormSchema = typeof preferencesFormSchema;
export type EmailFormSchema = typeof emailFormSchema;
export type PasswordFormSchema = typeof passwordFormSchema;
export type DebugEmailFormSchema = typeof debugEmailFormSchema;
