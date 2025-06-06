import { and, eq } from 'drizzle-orm';
import type { user, userPreferences } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { generateId } from '$lib/server/auth/utils';

export type User = typeof user.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type BookingType = 'laundry' | 'bbq';
export type NotificationTiming = '1_hour' | '1_day' | '1_week';

export interface PreferencesUpdate {
	laundryNotificationsEnabled: boolean;
	laundryNotificationTiming: NotificationTiming;
	bbqNotificationsEnabled: boolean;
	bbqNotificationTiming: NotificationTiming;
}

function createDefaultUserPreferences(userId: string): void {
	const preferences = {
		id: generateId(),
		userId,
		laundryNotificationsEnabled: true,
		laundryNotificationTiming: '1_hour' as const,
		bbqNotificationsEnabled: true,
		bbqNotificationTiming: '1_week' as const
	};

	db.insert(table.userPreferences).values(preferences).run();
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
	const userId = generateId();
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

	createDefaultUserPreferences(userId);

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
	const user = db
		.select({ passwordHash: table.user.passwordHash })
		.from(table.user)
		.where(eq(table.user.id, userId))
		.get();

	if (!user) {
		throw new Error('Invalid user ID');
	}

	return user.passwordHash;
}

export function getUserFromEmail(email: string): User | null {
	const user = db.select().from(table.user).where(eq(table.user.email, email)).get();

	return user || null;
}

export function getUserFromApartment(apartment: string): User | null {
	const user = db.select().from(table.user).where(eq(table.user.apartment, apartment)).get();

	return user || null;
}

export function getUserPreferences(userId: string): UserPreferences | null {
	const preferences = db
		.select()
		.from(table.userPreferences)
		.where(eq(table.userPreferences.userId, userId))
		.get();

	return preferences || null;
}

export function updateUserPreferences(userId: string, preferences: PreferencesUpdate): boolean {
	const result = db
		.update(table.userPreferences)
		.set(preferences)
		.where(eq(table.userPreferences.userId, userId))
		.run();

	return result.changes > 0;
}
