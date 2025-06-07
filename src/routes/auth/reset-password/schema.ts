import { z } from 'zod';

export const formSchema = z.object({
	password: z.string().min(8, 'Lösenordet måste vara minst 8 tecken')
});

export type FormSchema = typeof formSchema;
