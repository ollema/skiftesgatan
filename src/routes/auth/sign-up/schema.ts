import { z } from 'zod';

export const formSchema = z.object({
	apartment: z
		.string()
		.regex(/^[A-D]1[0-3]0[1-2]$/, 'Ogiltigt lägenhetsnummer (t.ex. A1001, B1302)'),
	email: z.string().email('Ange en giltig emailadress'),
	password: z.string().min(8, 'Lösenordet måste vara minst 8 tecken')
});

export type FormSchema = typeof formSchema;
