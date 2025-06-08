import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import {
	createSession,
	deleteSessionTokenCookie,
	generateSessionToken,
	invalidateSession,
	invalidateUserSessions,
	sessionCookieName,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/auth/session';
import { createUser } from '$lib/server/auth/user';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

describe('generateSessionToken', () => {
	it('should generate a token as a string', () => {
		const token = generateSessionToken();
		expect(typeof token).toBe('string');
	});

	it('should generate tokens of consistent length', () => {
		const token1 = generateSessionToken();
		const token2 = generateSessionToken();

		// base64url encoding of 18 bytes should result in 24 characters
		expect(token1).toHaveLength(24);
		expect(token2).toHaveLength(24);
	});

	it('should generate unique tokens', () => {
		const tokens = new Set();
		const iterations = 1000;

		for (let i = 0; i < iterations; i++) {
			tokens.add(generateSessionToken());
		}

		// all generated tokens should be unique
		expect(tokens.size).toBe(iterations);
	});

	it('should generate tokens containing only base64url characters', () => {
		const token = generateSessionToken();

		// base64url uses: A-Z, a-z, 0-9, -, _
		const base64urlRegex = /^[A-Za-z0-9_-]+$/;
		expect(token).toMatch(base64urlRegex);
	});

	it('should handle crypto.getRandomValues being called', () => {
		const spy = vi.spyOn(crypto, 'getRandomValues');

		generateSessionToken();

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith(expect.any(Uint8Array));

		spy.mockRestore();
	});

	it('should not contain padding characters', () => {
		// Base64url shouldn't have padding in this case since 18 bytes
		// encodes to exactly 24 characters without padding
		const token = generateSessionToken();
		expect(token).not.toContain('=');
	});
});

describe('constants', () => {
	it('should export correct session cookie name', () => {
		expect(sessionCookieName).toBe('auth_session');
	});
});

// Test data helpers
const testUser = {
	apartment: 'A1001',
	email: 'sessiontest@test.com',
	password: 'password123'
};

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

describe('createSession', () => {
	it('should create a session successfully', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();

		const session = createSession(token, user.id);

		expect(session).toBeDefined();
		expect(session.id).toBeDefined();
		expect(session.userId).toBe(user.id);
		expect(session.expiresAt).toBeInstanceOf(Date);
		expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
	});

	it('should create session with 30-day expiration', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const beforeCreate = Date.now();

		const session = createSession(token, user.id);

		const expectedExpiry = beforeCreate + (30 * 24 * 60 * 60 * 1000); // 30 days
		const actualExpiry = session.expiresAt.getTime();
		
		// Allow for small timing differences (within 1 second)
		expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
	});

	it('should generate deterministic session ID from token', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();

		const session1 = createSession(token, user.id);
		
		// Clean up first session
		invalidateSession(session1.id);
		
		const session2 = createSession(token, user.id);

		// Same token should generate same session ID
		expect(session1.id).toBe(session2.id);
	});

	it('should allow multiple sessions for same user', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token1 = generateSessionToken();
		const token2 = generateSessionToken();

		const session1 = createSession(token1, user.id);
		const session2 = createSession(token2, user.id);

		expect(session1.id).not.toBe(session2.id);
		expect(session1.userId).toBe(user.id);
		expect(session2.userId).toBe(user.id);
	});
});

describe('validateSessionToken', () => {
	it('should validate valid session', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		const result = validateSessionToken(token);

		expect(result.session).toBeDefined();
		expect(result.user).toBeDefined();
		expect(result.session!.id).toBe(session.id);
		expect(result.user!.id).toBe(user.id);
		expect(result.user!.apartment).toBe(testUser.apartment);
		expect(result.user!.email).toBe(testUser.email);
	});

	it('should return null for invalid token', () => {
		const invalidToken = 'invalid-token-123';

		const result = validateSessionToken(invalidToken);

		expect(result.session).toBeNull();
		expect(result.user).toBeNull();
	});

	it('should return null for expired session', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		// Manually set session as expired
		const pastDate = new Date(Date.now() - 1000); // 1 second ago
		db.update(table.session)
			.set({ expiresAt: pastDate })
			.where(eq(table.session.id, session.id))
			.run();

		const result = validateSessionToken(token);

		expect(result.session).toBeNull();
		expect(result.user).toBeNull();
	});

	it('should extend session expiration for fresh sessions', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		// Set session to expire in 14 days (should be extended)
		const nearExpiry = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000));
		db.update(table.session)
			.set({ expiresAt: nearExpiry })
			.where(eq(table.session.id, session.id))
			.run();

		const result = validateSessionToken(token);

		expect(result.session).toBeDefined();
		expect(result.session!.expiresAt.getTime()).toBeGreaterThan(nearExpiry.getTime());
	});

	it('should not extend session expiration for sessions expiring far in future', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		// Set session to expire in 20 days from now (should not be extended)
		// Renewal condition: Date.now() >= expiresAt - 15 days
		// With 20 days: Date.now() >= (Date.now() + 20 days) - 15 days = Date.now() + 5 days (false)
		const farFutureExpiry = new Date(Date.now() + (20 * 24 * 60 * 60 * 1000));
		db.update(table.session)
			.set({ expiresAt: farFutureExpiry })
			.where(eq(table.session.id, session.id))
			.run();

		const result = validateSessionToken(token);

		expect(result.session).toBeDefined();
		// The timestamp differences suggest it's always being renewed
		// Let's check if the renewal condition is working correctly
		const timeDiff = Math.abs(result.session!.expiresAt.getTime() - farFutureExpiry.getTime());
		expect(timeDiff).toBeLessThan(1000); // Allow small timing differences
	});
});

describe('invalidateSession', () => {
	it('should invalidate existing session', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		// Verify session exists
		const beforeInvalidate = validateSessionToken(token);
		expect(beforeInvalidate.session).toBeDefined();

		invalidateSession(session.id);

		// Verify session no longer exists
		const afterInvalidate = validateSessionToken(token);
		expect(afterInvalidate.session).toBeNull();
	});

	it('should handle invalidating non-existent session gracefully', () => {
		// Should not throw
		expect(() => invalidateSession('non-existent-session-id')).not.toThrow();
	});
});

describe('invalidateSession (alias for deleteSession)', () => {
	it('should delete existing session', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		invalidateSession(session.id);

		// Verify session no longer exists
		const result = validateSessionToken(token);
		expect(result.session).toBeNull();
	});

	it('should handle deleting non-existent session gracefully', () => {
		// Should not throw
		expect(() => invalidateSession('non-existent-session-id')).not.toThrow();
	});
});

describe('invalidateUserSessions', () => {
	it('should delete all sessions for a user', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token1 = generateSessionToken();
		const token2 = generateSessionToken();
		const token3 = generateSessionToken();

		createSession(token1, user.id);
		createSession(token2, user.id);
		createSession(token3, user.id);

		// Verify all sessions exist
		expect(validateSessionToken(token1).session).toBeDefined();
		expect(validateSessionToken(token2).session).toBeDefined();
		expect(validateSessionToken(token3).session).toBeDefined();

		invalidateUserSessions(user.id);

		// Verify all sessions are deleted
		expect(validateSessionToken(token1).session).toBeNull();
		expect(validateSessionToken(token2).session).toBeNull();
		expect(validateSessionToken(token3).session).toBeNull();
	});

	it('should not affect other users sessions', async () => {
		const user1 = await createUser('A1001', 'user1@test.com', 'password123');
		const user2 = await createUser('B1002', 'user2@test.com', 'password456');
		
		const token1 = generateSessionToken();
		const token2 = generateSessionToken();

		createSession(token1, user1.id);
		createSession(token2, user2.id);

		invalidateUserSessions(user1.id);

		// User1's session should be deleted
		expect(validateSessionToken(token1).session).toBeNull();
		// User2's session should remain
		expect(validateSessionToken(token2).session).toBeDefined();
	});

	it('should handle deleting sessions for non-existent user gracefully', () => {
		// Should not throw
		expect(() => invalidateUserSessions('non-existent-user-id')).not.toThrow();
	});
});

describe('cookie management', () => {
	const createMockEvent = () => ({
		cookies: {
			set: vi.fn(),
			delete: vi.fn()
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}) as any;

	describe('setSessionTokenCookie', () => {
		it('should set cookie with correct options', () => {
			const mockEvent = createMockEvent();
			const token = 'test-token-123';
			const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

			setSessionTokenCookie(mockEvent, token, expiresAt);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(sessionCookieName, token, {
				expires: expiresAt,
				path: '/'
			});
		});

		it('should handle different expiration times', () => {
			const mockEvent = createMockEvent();
			const token = 'test-token';
			const shortExpiry = new Date(Date.now() + 1000 * 60);
			const longExpiry = new Date(Date.now() + 1000 * 60 * 60);

			setSessionTokenCookie(mockEvent, token, shortExpiry);
			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				sessionCookieName,
				token,
				expect.objectContaining({ expires: shortExpiry })
			);

			setSessionTokenCookie(mockEvent, token, longExpiry);
			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				sessionCookieName,
				token,
				expect.objectContaining({ expires: longExpiry })
			);
		});
	});

	describe('deleteSessionTokenCookie', () => {
		it('should delete cookie with correct options', () => {
			const mockEvent = createMockEvent();

			deleteSessionTokenCookie(mockEvent);

			expect(mockEvent.cookies.delete).toHaveBeenCalledWith(sessionCookieName, {
				path: '/'
			});
		});

		it('should call cookies.delete method', () => {
			const mockEvent = createMockEvent();

			deleteSessionTokenCookie(mockEvent);

			expect(mockEvent.cookies.delete).toHaveBeenCalledWith(
				sessionCookieName,
				expect.objectContaining({ path: '/' })
			);
		});
	});
});

describe('integration tests', () => {
	it('should handle complete session lifecycle', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();

		// Create session
		const session = createSession(token, user.id);
		expect(session).toBeDefined();

		// Validate session
		const validation = validateSessionToken(token);
		expect(validation.session).toBeDefined();
		expect(validation.user).toBeDefined();
		expect(validation.user!.id).toBe(user.id);

		// Invalidate session
		invalidateSession(session.id);

		// Verify session is invalid
		const afterInvalidation = validateSessionToken(token);
		expect(afterInvalidation.session).toBeNull();
		expect(afterInvalidation.user).toBeNull();
	});

	it('should handle multiple concurrent sessions', async () => {
		const user1 = await createUser('A1001', 'user1@test.com', 'password123');
		const user2 = await createUser('B1002', 'user2@test.com', 'password456');

		const tokens = {
			user1Session1: generateSessionToken(),
			user1Session2: generateSessionToken(),
			user2Session1: generateSessionToken()
		};

		// Create multiple sessions
		createSession(tokens.user1Session1, user1.id);
		createSession(tokens.user1Session2, user1.id);
		createSession(tokens.user2Session1, user2.id);

		// Validate all sessions work
		Object.values(tokens).forEach((token) => {
			const validation = validateSessionToken(token);
			expect(validation.session).toBeDefined();
			expect(validation.user).toBeDefined();
		});

		// Delete all sessions for user1
		invalidateUserSessions(user1.id);

		// User1 sessions should be invalid
		expect(validateSessionToken(tokens.user1Session1).session).toBeNull();
		expect(validateSessionToken(tokens.user1Session2).session).toBeNull();

		// User2 session should still be valid
		expect(validateSessionToken(tokens.user2Session1).session).toBeDefined();
	});

	it('should handle session expiration correctly', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const token = generateSessionToken();
		const session = createSession(token, user.id);

		// Session should be valid initially
		const initialValidation = validateSessionToken(token);
		expect(initialValidation.session).toBeDefined();

		// Manually expire the session
		const expiredDate = new Date(Date.now() - 1000);
		db.update(table.session)
			.set({ expiresAt: expiredDate })
			.where(eq(table.session.id, session.id))
			.run();

		// Session should now be invalid
		const expiredValidation = validateSessionToken(token);
		expect(expiredValidation.session).toBeNull();
		expect(expiredValidation.user).toBeNull();
	});
});

describe('session token properties', () => {
	it('should generate tokens with sufficient entropy', () => {
		// 18 bytes = 144 bits of entropy, which is very strong
		const token = generateSessionToken();

		// verify the decoded length would be 18 bytes
		// base64url: 4 chars = 3 bytes, so 24 chars = 18 bytes
		expect((token.length * 3) / 4).toBe(18);
	});

	it('should generate tokens suitable for URL usage', () => {
		const token = generateSessionToken();

		// should not contain characters that need URL encoding
		expect(token).not.toContain('+');
		expect(token).not.toContain('/');
		expect(token).not.toContain('=');
	});
});
