import { z } from 'zod';

export const formSchema = z.object({
	start: z.string().datetime(),
	end: z.string().datetime()
});

export type FormSchema = typeof formSchema;
