import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	hashPassword,
	verifyPasswordHash,
	verifyPasswordStrength
} from '$lib/server/auth/password';

describe('hashPassword', () => {
	it('should return a string hash', async () => {
		const hash = await hashPassword('testpassword123');
		expect(typeof hash).toBe('string');
		expect(hash.length).toBeGreaterThan(0);
	});

	it('should produce different hashes for the same password (due to salt)', async () => {
		const password = 'testpassword123';
		const hash1 = await hashPassword(password);
		const hash2 = await hashPassword(password);

		expect(hash1).not.toBe(hash2);
	});

	it('should handle various password lengths', async () => {
		const passwords = [
			'short',
			'medium_length_password',
			'very_long_password_with_lots_of_characters_that_goes_on_and_on',
			'a'.repeat(255) // max reasonable length
		];

		for (const password of passwords) {
			const hash = await hashPassword(password);
			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(0);
		}
	});

	it('should handle special characters and unicode', async () => {
		const passwords = ['password!@#$%^&*()', 'pässwörd', '密码123', '🔐secure🔑password'];

		for (const password of passwords) {
			const hash = await hashPassword(password);
			expect(typeof hash).toBe('string');
			expect(hash.length).toBeGreaterThan(0);
		}
	});

	it('should handle empty string', async () => {
		const hash = await hashPassword('');
		expect(typeof hash).toBe('string');
		expect(hash.length).toBeGreaterThan(0);
	});
});

describe('verifyPasswordHash', () => {
	it('should verify correct password against its hash', async () => {
		const password = 'testpassword123';
		const hash = await hashPassword(password);

		const isValid = await verifyPasswordHash(hash, password);
		expect(isValid).toBe(true);
	});

	it('should reject incorrect password against hash', async () => {
		const password = 'testpassword123';
		const wrongPassword = 'wrongpassword123';
		const hash = await hashPassword(password);

		const isValid = await verifyPasswordHash(hash, wrongPassword);
		expect(isValid).toBe(false);
	});

	it('should handle case sensitivity', async () => {
		const password = 'TestPassword123';
		const hash = await hashPassword(password);

		const isValidCorrect = await verifyPasswordHash(hash, 'TestPassword123');
		const isValidWrong = await verifyPasswordHash(hash, 'testpassword123');

		expect(isValidCorrect).toBe(true);
		expect(isValidWrong).toBe(false);
	});

	it('should handle special characters', async () => {
		const password = 'test!@#$%^&*()_+{}|:"<>?';
		const hash = await hashPassword(password);

		const isValid = await verifyPasswordHash(hash, password);
		expect(isValid).toBe(true);
	});

	it('should reject empty password against valid hash', async () => {
		const password = 'testpassword123';
		const hash = await hashPassword(password);

		const isValid = await verifyPasswordHash(hash, '');
		expect(isValid).toBe(false);
	});

	it('should handle malformed hash gracefully', async () => {
		const password = 'testpassword123';
		const malformedHash = 'not-a-valid-hash';

		// argon2 throws an error for malformed hashes rather than returning false
		await expect(verifyPasswordHash(malformedHash, password)).rejects.toThrow();
	});
});

describe('verifyPasswordStrength', () => {
	beforeEach(() => {
		// Mock fetch globally for these tests
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('length validation', () => {
		it('should reject passwords shorter than 8 characters', async () => {
			const shortPasswords = ['', 'a', 'abc', '1234567'];

			for (const password of shortPasswords) {
				const isStrong = await verifyPasswordStrength(password);
				expect(isStrong).toBe(false);
			}
		});

		it('should reject passwords longer than 255 characters', async () => {
			const longPassword = 'a'.repeat(256);
			const isStrong = await verifyPasswordStrength(longPassword);
			expect(isStrong).toBe(false);
		});

		it('should accept passwords of valid length (8-255 chars)', async () => {
			// Mock API response for non-pwned password
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('00000:1\n11111:2\n22222:3')
			} as Response);

			const validPasswords = [
				'a'.repeat(8), // exactly 8
				'a'.repeat(50), // medium
				'a'.repeat(255) // exactly 255
			];

			for (const password of validPasswords) {
				const isStrong = await verifyPasswordStrength(password);
				expect(isStrong).toBe(true);
			}
		});
	});

	describe('pwned password checking', () => {
		it('should reject known pwned passwords', async () => {
			// Import the same utilities used in the function to create a proper test
			const { sha1 } = await import('@oslojs/crypto/sha1');
			const { encodeHexLowerCase } = await import('@oslojs/encoding');

			const password = 'password123';

			// Compute the actual hash that the function will compute
			const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
			const hashPrefix = hash.slice(0, 5);
			const hashSuffix = hash.slice(5);

			// Mock API response that contains this hash suffix (indicating it's pwned)
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve(`${hashSuffix.toUpperCase()}:123\nother:1`)
			} as Response);

			const isStrong = await verifyPasswordStrength(password);
			expect(isStrong).toBe(false);

			// Verify the correct API endpoint was called
			expect(fetch).toHaveBeenCalledWith(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
		});

		it('should accept non-pwned passwords', async () => {
			// Mock API response that doesn't contain our password hash
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('00000:1\n11111:2\n22222:3')
			} as Response);

			const isStrong = await verifyPasswordStrength('MySecurePassword123!');
			expect(isStrong).toBe(true);
		});

		it('should make correct API call format', async () => {
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('00000:1')
			} as Response);

			await verifyPasswordStrength('testpassword123');

			expect(fetch).toHaveBeenCalledWith(
				expect.stringMatching(/^https:\/\/api\.pwnedpasswords\.com\/range\/[a-f0-9]{5}$/)
			);
		});

		it('should handle network failures gracefully', async () => {
			vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

			// Should probably return false on network error for security
			await expect(verifyPasswordStrength('testpassword123')).rejects.toThrow('Network error');
		});

		it('should handle malformed API responses', async () => {
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('malformed-response-without-proper-format')
			} as Response);

			const isStrong = await verifyPasswordStrength('testpassword123');
			expect(isStrong).toBe(true);
		});

		it('should handle empty API responses', async () => {
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('')
			} as Response);

			const isStrong = await verifyPasswordStrength('testpassword123');
			expect(isStrong).toBe(true);
		});
	});

	describe('integration scenarios', () => {
		it('should handle edge case with exactly 8 character non-pwned password', async () => {
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('00000:1\n11111:2')
			} as Response);

			const isStrong = await verifyPasswordStrength('abcd1234');
			expect(isStrong).toBe(true);
		});

		it('should handle unicode characters in password', async () => {
			vi.mocked(fetch).mockResolvedValue({
				text: () => Promise.resolve('00000:1\n11111:2')
			} as Response);

			const isStrong = await verifyPasswordStrength('pässwörd123');
			expect(isStrong).toBe(true);
		});
	});
});
