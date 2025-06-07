import { z } from 'zod';

export const formSchema = z.object({
	apartment: z.string().min(1, 'Ange ditt lägenhetsnummer')
});

export type FormSchema = typeof formSchema;
