import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { user } from '$lib/server/db/schema';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';

export type User = typeof user.$inferSelect;

export function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

export function verifyApartmentInput(apartment: string): boolean {
	if (typeof apartment !== 'string') {
		return false;
	}

	const apartmentRegex = /^[A-D]1[0-3]0[1-2]$/;
	return apartmentRegex.test(apartment.trim());
}

export async function createUser(
	apartment: string,
	email: string,
	password: string
): Promise<User> {
	const userId = generateUserId();
	const passwordHash = await hashPassword(password);

	const user = await db
		.insert(table.user)
		.values({
			id: userId,
			apartment,
			email,
			passwordHash
		})
		.returning();

	return user[0];
}

export async function updateUserPassword(userId: string, password: string): Promise<void> {
	const passwordHash = await hashPassword(password);
	await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(
	userId: string,
	email: string
): Promise<void> {
	await db.update(table.user).set({ email, emailVerified: true }).where(eq(table.user.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(
	userId: string,
	email: string
): Promise<boolean> {
	const result = await db
		.update(table.user)
		.set({ emailVerified: true })
		.where(and(eq(table.user.id, userId), eq(table.user.email, email)));

	return result.changes > 0;
}

export async function getUserPasswordHash(userId: string): Promise<string> {
	const [user] = await db
		.select({ passwordHash: table.user.passwordHash })
		.from(table.user)
		.where(eq(table.user.id, userId));

	if (!user) {
		throw new Error('Invalid user ID');
	}

	return user.passwordHash;
}

export async function getUserFromEmail(email: string): Promise<User | null> {
	const [user] = await db.select().from(table.user).where(eq(table.user.email, email));

	return user || null;
}
