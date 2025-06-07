import { z } from 'zod';

export const formSchema = z.object({
	apartment: z
		.string()
		.min(4, 'Lägenhetsnummer måste vara minst 4 tecken')
		.max(31, 'Lägenhetsnummer kan inte vara längre än 31 tecken'),
	email: z.string().email('Ange en giltig e-postadress'),
	password: z.string().min(8, 'Lösenordet måste vara minst 8 tecken')
});

export type FormSchema = typeof formSchema;
