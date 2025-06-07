import { z } from 'zod';

export const formSchema = z.object({
	apartment: z.string().min(1, 'Ange ditt lägenhetsnummer'),
	password: z.string().min(1, 'Ange ditt lösenord')
});

export type FormSchema = typeof formSchema;
