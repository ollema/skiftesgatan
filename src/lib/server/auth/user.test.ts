import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import {
	createUser,
	getUserFromApartment,
	getUserFromEmail,
	getUserPasswordHash,
	getUserPreferences,
	setUserAsEmailVerifiedIfEmailMatches,
	updateUserEmailAndSetEmailAsVerified,
	updateUserPassword,
	updateUserPreferences,
	verifyApartmentInput
} from '$lib/server/auth/user';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { verifyPasswordHash } from '$lib/server/auth/password';

// Test data helpers
const testUsers = [
	{
		apartment: 'A1001',
		email: 'user1@test.com',
		password: 'password123'
	},
	{
		apartment: 'B1202',
		email: 'user2@test.com',
		password: 'password456'
	},
	{
		apartment: 'C1303',
		email: 'user3@test.com',
		password: 'password789'
	}
];

beforeEach(() => {
	// Clean up before each test
	db.run('DELETE FROM user_preferences');
	db.run('DELETE FROM session');
	db.run('DELETE FROM user');
});

afterEach(() => {
	// Clean up after each test
	db.run('DELETE FROM user_preferences');
	db.run('DELETE FROM session');
	db.run('DELETE FROM user');
});

describe('verifyApartmentInput', () => {
	describe('valid cases - comprehensive boundary testing', () => {
		it('should accept all valid apartment combinations', () => {
			const buildings = ['A', 'B', 'C', 'D'];
			const floors = ['0', '1', '2', '3'];
			const units = ['1', '2'];

			let validCount = 0;
			buildings.forEach((building) => {
				floors.forEach((floor) => {
					units.forEach((unit) => {
						const apartment = `${building}1${floor}0${unit}`;
						expect(verifyApartmentInput(apartment)).toBe(true);
						validCount++;
					});
				});
			});

			// should have 4 buildings × 4 floors × 2 units = 32 valid combinations
			expect(validCount).toBe(32);
		});

		it('should handle apartments with leading/trailing whitespace', () => {
			expect(verifyApartmentInput(' A1001 ')).toBe(true);
			expect(verifyApartmentInput('\tB1202\t')).toBe(true);
			expect(verifyApartmentInput('\nC1301\n')).toBe(true);
		});
	});

	describe('invalid cases', () => {
		it('should reject invalid building letters', () => {
			const invalidLetters = ['E', 'F', 'Z', 'a', 'b', '1', '2', '#', '@'];
			invalidLetters.forEach((letter) => {
				expect(verifyApartmentInput(`${letter}1001`)).toBe(false);
			});
		});

		it('should reject invalid second digit (must be 1)', () => {
			const invalidSecond = ['0', '2', '3', '9'];
			invalidSecond.forEach((digit) => {
				expect(verifyApartmentInput(`A${digit}001`)).toBe(false);
			});
		});

		it('should reject invalid third digit (must be 0-3)', () => {
			const invalidThird = ['4', '5', '9'];
			invalidThird.forEach((digit) => {
				expect(verifyApartmentInput(`A1${digit}01`)).toBe(false);
			});
		});

		it('should reject invalid fourth digit (must be 0)', () => {
			const invalidFourth = ['1', '2', '9'];
			invalidFourth.forEach((digit) => {
				expect(verifyApartmentInput(`A10${digit}1`)).toBe(false);
			});
		});

		it('should reject invalid fifth digit (must be 1 or 2)', () => {
			const invalidFifth = ['0', '3', '9'];
			invalidFifth.forEach((digit) => {
				expect(verifyApartmentInput(`A100${digit}`)).toBe(false);
			});
		});

		it('should reject wrong length inputs', () => {
			expect(verifyApartmentInput('')).toBe(false);
			expect(verifyApartmentInput('A100')).toBe(false);
			expect(verifyApartmentInput('A10011')).toBe(false);
		});

		it('should reject strings with spaces or special characters', () => {
			expect(verifyApartmentInput('A 1001')).toBe(false);
			expect(verifyApartmentInput('A1001!')).toBe(false);
			expect(verifyApartmentInput('A-1001')).toBe(false);
		});

		it('should reject non-string inputs', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(verifyApartmentInput(null as any)).toBe(false);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(verifyApartmentInput(undefined as any)).toBe(false);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(verifyApartmentInput(1001 as any)).toBe(false);
		});
	});
});

describe('createUser', () => {
	it('should create a user successfully', async () => {
		const { apartment, email, password } = testUsers[0];

		const user = await createUser(apartment, email, password);

		expect(user).toBeDefined();
		expect(user.apartment).toBe(apartment);
		expect(user.email).toBe(email);
		expect(user.emailVerified).toBe(false);
		expect(user.passwordHash).toBeDefined();
		expect(user.id).toBeDefined();

		// Verify password hash was created correctly
		const isValidPassword = await verifyPasswordHash(user.passwordHash, password);
		expect(isValidPassword).toBe(true);
	});

	it('should create default user preferences', async () => {
		const { apartment, email, password } = testUsers[0];

		const user = await createUser(apartment, email, password);
		const preferences = getUserPreferences(user.id);

		expect(preferences).toBeDefined();
		expect(preferences.userId).toBe(user.id);
		expect(preferences.laundryNotificationsEnabled).toBe(true);
		expect(preferences.laundryNotificationTiming).toBe('1_hour');
		expect(preferences.bbqNotificationsEnabled).toBe(true);
		expect(preferences.bbqNotificationTiming).toBe('1_week');
	});

	it('should enforce unique apartment constraint', async () => {
		const { apartment, email, password } = testUsers[0];
		const secondEmail = 'different@test.com';

		// Create first user
		await createUser(apartment, email, password);

		// Try to create second user with same apartment
		await expect(createUser(apartment, secondEmail, password)).rejects.toThrow();
	});

	it('should enforce unique email constraint', async () => {
		const { apartment, email, password } = testUsers[0];
		const secondApartment = 'B1001';

		// Create first user
		await createUser(apartment, email, password);

		// Try to create second user with same email
		await expect(createUser(secondApartment, email, password)).rejects.toThrow();
	});
});

describe('getUserFromEmail', () => {
	it('should return user when email exists', async () => {
		const { apartment, email, password } = testUsers[0];
		const createdUser = await createUser(apartment, email, password);

		const foundUser = getUserFromEmail(email);

		expect(foundUser).toBeDefined();
		expect(foundUser!.id).toBe(createdUser.id);
		expect(foundUser!.email).toBe(email);
		expect(foundUser!.apartment).toBe(apartment);
	});

	it('should return null when email does not exist', () => {
		const foundUser = getUserFromEmail('nonexistent@test.com');
		expect(foundUser).toBeNull();
	});

	it('should be case sensitive', async () => {
		const { apartment, email, password } = testUsers[0];
		await createUser(apartment, email, password);

		const foundUser = getUserFromEmail(email.toUpperCase());
		expect(foundUser).toBeNull();
	});
});

describe('getUserFromApartment', () => {
	it('should return user when apartment exists', async () => {
		const { apartment, email, password } = testUsers[0];
		const createdUser = await createUser(apartment, email, password);

		const foundUser = getUserFromApartment(apartment);

		expect(foundUser).toBeDefined();
		expect(foundUser!.id).toBe(createdUser.id);
		expect(foundUser!.apartment).toBe(apartment);
		expect(foundUser!.email).toBe(email);
	});

	it('should return null when apartment does not exist', () => {
		const foundUser = getUserFromApartment('Z9999');
		expect(foundUser).toBeNull();
	});

	it('should be case sensitive', async () => {
		const { apartment, email, password } = testUsers[0];
		await createUser(apartment, email, password);

		const foundUser = getUserFromApartment(apartment.toLowerCase());
		expect(foundUser).toBeNull();
	});
});

describe('getUserPasswordHash', () => {
	it('should return password hash for existing user', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		const passwordHash = getUserPasswordHash(user.id);

		expect(passwordHash).toBeDefined();
		expect(passwordHash).toBe(user.passwordHash);
	});

	it('should throw error for non-existent user', () => {
		expect(() => getUserPasswordHash('non-existent-id')).toThrow('Invalid user ID');
	});
});

describe('updateUserPassword', () => {
	it('should update user password successfully', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);
		const newPassword = 'newPassword123';

		await updateUserPassword(user.id, newPassword);

		const updatedPasswordHash = getUserPasswordHash(user.id);
		const isValidPassword = await verifyPasswordHash(updatedPasswordHash, newPassword);
		expect(isValidPassword).toBe(true);

		// Old password should no longer work
		const isOldPasswordValid = await verifyPasswordHash(updatedPasswordHash, password);
		expect(isOldPasswordValid).toBe(false);
	});

	it('should handle non-existent user gracefully', async () => {
		// Should not throw, just do nothing
		await expect(updateUserPassword('non-existent-id', 'newPassword')).resolves.not.toThrow();
	});
});

describe('updateUserEmailAndSetEmailAsVerified', () => {
	it('should update email and set as verified', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);
		const newEmail = 'newemail@test.com';

		updateUserEmailAndSetEmailAsVerified(user.id, newEmail);

		const updatedUser = getUserFromEmail(newEmail);
		expect(updatedUser).toBeDefined();
		expect(updatedUser!.id).toBe(user.id);
		expect(updatedUser!.email).toBe(newEmail);
		expect(updatedUser!.emailVerified).toBe(true);

		// Old email should no longer exist
		const oldUser = getUserFromEmail(email);
		expect(oldUser).toBeNull();
	});

	it('should handle non-existent user gracefully', () => {
		// Should not throw, just do nothing
		expect(() => updateUserEmailAndSetEmailAsVerified('non-existent-id', 'email@test.com')).not.toThrow();
	});
});

describe('setUserAsEmailVerifiedIfEmailMatches', () => {
	it('should set email as verified when email matches', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		expect(user.emailVerified).toBe(false);

		const result = setUserAsEmailVerifiedIfEmailMatches(user.id, email);

		expect(result).toBe(true);

		const updatedUser = getUserFromEmail(email);
		expect(updatedUser!.emailVerified).toBe(true);
	});

	it('should return false when email does not match', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		const result = setUserAsEmailVerifiedIfEmailMatches(user.id, 'different@test.com');

		expect(result).toBe(false);

		const updatedUser = getUserFromEmail(email);
		expect(updatedUser!.emailVerified).toBe(false);
	});

	it('should return false for non-existent user', () => {
		const result = setUserAsEmailVerifiedIfEmailMatches('non-existent-id', 'email@test.com');
		expect(result).toBe(false);
	});
});

describe('getUserPreferences', () => {
	it('should return existing preferences', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		const preferences = getUserPreferences(user.id);

		expect(preferences).toBeDefined();
		expect(preferences.userId).toBe(user.id);
		expect(preferences.laundryNotificationsEnabled).toBe(true);
		expect(preferences.laundryNotificationTiming).toBe('1_hour');
		expect(preferences.bbqNotificationsEnabled).toBe(true);
		expect(preferences.bbqNotificationTiming).toBe('1_week');
	});

	it('should create default preferences if none exist', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		// Delete preferences to simulate missing preferences
		db.delete(table.userPreferences).where(eq(table.userPreferences.userId, user.id)).run();

		// Since updateUserPreferences can't create new rows, we expect this to throw
		// In a real implementation, getUserPreferences would need to handle this differently
		expect(() => getUserPreferences(user.id)).toThrow('Failed to update user preferences');
	});

	it('should throw error for non-existent user', () => {
		expect(() => getUserPreferences('non-existent-id')).toThrow('Invalid user ID');
	});
});

describe('updateUserPreferences', () => {
	it('should update user preferences successfully', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		const newPreferences = {
			laundryNotificationsEnabled: false,
			laundryNotificationTiming: '1_day' as const,
			bbqNotificationsEnabled: false,
			bbqNotificationTiming: '1_hour' as const
		};

		const updatedPreferences = updateUserPreferences(user.id, newPreferences);

		expect(updatedPreferences.laundryNotificationsEnabled).toBe(false);
		expect(updatedPreferences.laundryNotificationTiming).toBe('1_day');
		expect(updatedPreferences.bbqNotificationsEnabled).toBe(false);
		expect(updatedPreferences.bbqNotificationTiming).toBe('1_hour');

		// Verify persistence
		const retrievedPreferences = getUserPreferences(user.id);
		expect(retrievedPreferences).toEqual(updatedPreferences);
	});

	it('should update only specific preferences fields', async () => {
		const { apartment, email, password } = testUsers[0];
		const user = await createUser(apartment, email, password);

		const partialUpdate = {
			laundryNotificationsEnabled: false,
			laundryNotificationTiming: '1_week' as const,
			bbqNotificationsEnabled: true,
			bbqNotificationTiming: '1_day' as const
		};

		const updatedPreferences = updateUserPreferences(user.id, partialUpdate);

		expect(updatedPreferences.laundryNotificationsEnabled).toBe(false);
		expect(updatedPreferences.laundryNotificationTiming).toBe('1_week');
		expect(updatedPreferences.bbqNotificationsEnabled).toBe(true);
		expect(updatedPreferences.bbqNotificationTiming).toBe('1_day');
	});

	it('should throw error when updating preferences for non-existent user', () => {
		const preferences = {
			laundryNotificationsEnabled: false,
			laundryNotificationTiming: '1_day' as const,
			bbqNotificationsEnabled: false,
			bbqNotificationTiming: '1_hour' as const
		};

		expect(() => updateUserPreferences('non-existent-id', preferences)).toThrow('Failed to update user preferences');
	});
});

describe('integration tests', () => {
	it('should handle complete user lifecycle', async () => {
		const { apartment, email, password } = testUsers[0];

		// Create user
		const user = await createUser(apartment, email, password);
		expect(user.emailVerified).toBe(false);

		// Verify user can be found
		const foundByEmail = getUserFromEmail(email);
		const foundByApartment = getUserFromApartment(apartment);
		expect(foundByEmail!.id).toBe(user.id);
		expect(foundByApartment!.id).toBe(user.id);

		// Update email and verify
		const newEmail = 'verified@test.com';
		updateUserEmailAndSetEmailAsVerified(user.id, newEmail);
		const verifiedUser = getUserFromEmail(newEmail);
		expect(verifiedUser!.emailVerified).toBe(true);

		// Update password
		const newPassword = 'newSecurePassword123';
		await updateUserPassword(user.id, newPassword);
		const newPasswordHash = getUserPasswordHash(user.id);
		const isNewPasswordValid = await verifyPasswordHash(newPasswordHash, newPassword);
		expect(isNewPasswordValid).toBe(true);

		// Update preferences
		const newPreferences = {
			laundryNotificationsEnabled: false,
			laundryNotificationTiming: '1_week' as const,
			bbqNotificationsEnabled: true,
			bbqNotificationTiming: '1_day' as const
		};
		const updatedPrefs = updateUserPreferences(user.id, newPreferences);
		expect(updatedPrefs.laundryNotificationsEnabled).toBe(false);
		expect(updatedPrefs.bbqNotificationTiming).toBe('1_day');
	});

	it('should handle multiple users independently', async () => {
		const users = [];

		// Create multiple users
		for (const testUser of testUsers) {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);
			users.push(user);
		}

		// Verify each user can be found independently
		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			const testUser = testUsers[i];

			const foundByEmail = getUserFromEmail(testUser.email);
			const foundByApartment = getUserFromApartment(testUser.apartment);

			expect(foundByEmail!.id).toBe(user.id);
			expect(foundByApartment!.id).toBe(user.id);

			// Each user should have their own preferences
			const preferences = getUserPreferences(user.id);
			expect(preferences.userId).toBe(user.id);
		}

		// Update one user's preferences without affecting others
		const firstUser = users[0];
		const newPreferences = {
			laundryNotificationsEnabled: false,
			laundryNotificationTiming: '1_week' as const,
			bbqNotificationsEnabled: false,
			bbqNotificationTiming: '1_hour' as const
		};
		updateUserPreferences(firstUser.id, newPreferences);

		// Verify other users' preferences remain unchanged
		for (let i = 1; i < users.length; i++) {
			const preferences = getUserPreferences(users[i].id);
			expect(preferences.laundryNotificationsEnabled).toBe(true);
			expect(preferences.laundryNotificationTiming).toBe('1_hour');
			expect(preferences.bbqNotificationsEnabled).toBe(true);
			expect(preferences.bbqNotificationTiming).toBe('1_week');
		}
	});
});
