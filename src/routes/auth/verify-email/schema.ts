import { z } from 'zod';

export const verifyFormSchema = z.object({
	code: z.string().length(8, 'Koden måste vara exakt 8 tecken')
});

export const resendFormSchema = z.object({
	// No fields needed for resend action
});

export type VerifyFormSchema = typeof verifyFormSchema;
export type ResendFormSchema = typeof resendFormSchema;
