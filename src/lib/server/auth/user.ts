import { encodeBase32LowerCase } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';
import type { user } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';

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

	const user = db
		.insert(table.user)
		.values({
			id: userId,
			apartment,
			email,
			passwordHash
		})
		.returning()
		.all();

	return user[0];
}

export async function updateUserPassword(userId: string, password: string): Promise<void> {
	const passwordHash = await hashPassword(password);
	db.update(table.user).set({ passwordHash }).where(eq(table.user.id, userId)).run();
}

export function updateUserEmailAndSetEmailAsVerified(userId: string, email: string): void {
	db.update(table.user).set({ email, emailVerified: true }).where(eq(table.user.id, userId)).run();
}

export function setUserAsEmailVerifiedIfEmailMatches(userId: string, email: string): boolean {
	const result = db
		.update(table.user)
		.set({ emailVerified: true })
		.where(and(eq(table.user.id, userId), eq(table.user.email, email)))
		.run();

	return result.changes > 0;
}

export function getUserPasswordHash(userId: string): string {
	const [user] = db
		.select({ passwordHash: table.user.passwordHash })
		.from(table.user)
		.where(eq(table.user.id, userId))
		.all();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!user) {
		throw new Error('Invalid user ID');
	}

	return user.passwordHash;
}

export function getUserFromEmail(email: string): User | null {
	const [user] = db.select().from(table.user).where(eq(table.user.email, email)).all();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return user || null;
}

export function getUserFromApartment(apartment: string): User | null {
	const [user] = db.select().from(table.user).where(eq(table.user.apartment, apartment)).all();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return user || null;
}
