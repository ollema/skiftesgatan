import { z } from 'zod';

export const formSchema = z.object({
	code: z.string().length(8, 'Koden måste vara exakt 8 tecken')
});

export type FormSchema = typeof formSchema;
