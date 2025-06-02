import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';

export function verifyEmailInput(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z0-9]{2,}$/;
	return emailRegex.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
	const result = await db
		.select({ count: count() })
		.from(table.user)
		.where(eq(table.user.email, email));
	return result[0].count === 0;
}
