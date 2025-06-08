import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailVerificationRequest } from '$lib/server/auth/email-verification';
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	emailVerificationRequestCookieName,
	getUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from '$lib/server/auth/email-verification';
import { createUser } from '$lib/server/auth/user';
import { db } from '$lib/server/db';

const testUser = {
	apartment: 'A1001',
	email: 'emailtest@test.com',
	password: 'password123'
};
beforeEach(() => {
	// Clean up before each test
	db.run('DELETE FROM email_verification_request');
	db.run('DELETE FROM user_preferences');
	db.run('DELETE FROM session');
	db.run('DELETE FROM user');
	// Reset rate limiter
	sendVerificationEmailBucket.reset('test-beforeEach');
});

afterEach(() => {
	// Clean up after each test
	db.run('DELETE FROM email_verification_request');
	db.run('DELETE FROM user_preferences');
	db.run('DELETE FROM session');
	db.run('DELETE FROM user');
	// Reset rate limiter
	sendVerificationEmailBucket.reset('test-afterEach');
});
const createMockEvent = (overrides: Record<string, unknown> = {}) =>
	({
		cookies: {
			set: vi.fn(),
			get: vi.fn()
		},
		locals: {
			user: null,
			session: null
		},
		...overrides
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}) as any;

const createMockRequest = (
	overrides: Partial<EmailVerificationRequest> = {}
): EmailVerificationRequest => ({
	id: 'test-id-123',
	userId: 'user-456',
	code: '123456',
	email: 'test@example.com',
	expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes from now
	...overrides
});

describe('cookie management', () => {
	describe('setEmailVerificationRequestCookie', () => {
		it('should set cookie with correct options', () => {
			const mockEvent = createMockEvent();
			const request = createMockRequest();

			setEmailVerificationRequestCookie(mockEvent, request);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				emailVerificationRequestCookieName,
				request.id,
				{
					httpOnly: true,
					path: '/',
					secure: false,
					sameSite: 'lax',
					expires: request.expiresAt
				}
			);
		});

		it('should handle different expiration times', () => {
			const mockEvent = createMockEvent();
			const shortExpiry = new Date(Date.now() + 1000 * 60); // 1 minute
			const longExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

			const shortRequest = createMockRequest({ expiresAt: shortExpiry });
			const longRequest = createMockRequest({ expiresAt: longExpiry });

			setEmailVerificationRequestCookie(mockEvent, shortRequest);
			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				emailVerificationRequestCookieName,
				shortRequest.id,
				expect.objectContaining({ expires: shortExpiry })
			);

			setEmailVerificationRequestCookie(mockEvent, longRequest);
			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				emailVerificationRequestCookieName,
				longRequest.id,
				expect.objectContaining({ expires: longExpiry })
			);
		});

		it('should handle empty request id', () => {
			const mockEvent = createMockEvent();
			const request = createMockRequest({ id: '' });

			setEmailVerificationRequestCookie(mockEvent, request);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(emailVerificationRequestCookieName, '', {
				httpOnly: true,
				path: '/',
				secure: false,
				sameSite: 'lax',
				expires: request.expiresAt
			});
		});

		it('should handle special characters in request id', () => {
			const mockEvent = createMockEvent();
			const specialId = 'request-with-!@#$%^&*()_+{}|:"<>?';
			const request = createMockRequest({ id: specialId });

			setEmailVerificationRequestCookie(mockEvent, request);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				emailVerificationRequestCookieName,
				specialId,
				expect.objectContaining({
					httpOnly: true,
					path: '/',
					secure: false,
					sameSite: 'lax'
				})
			);
		});

		it('should handle different request ids', () => {
			const mockEvent = createMockEvent();
			const requestIds = [
				'short-id',
				'very-long-request-id-with-many-characters-and-dashes',
				'id_with_underscores',
				'id.with.dots',
				'123456789'
			];

			requestIds.forEach((id) => {
				const request = createMockRequest({ id });
				setEmailVerificationRequestCookie(mockEvent, request);
				expect(mockEvent.cookies.set).toHaveBeenCalledWith(
					emailVerificationRequestCookieName,
					id,
					expect.objectContaining({})
				);
			});
		});
	});

	describe('deleteEmailVerificationRequestCookie', () => {
		it('should delete cookie with correct options', () => {
			const mockEvent = createMockEvent();

			deleteEmailVerificationRequestCookie(mockEvent);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(emailVerificationRequestCookieName, '', {
				httpOnly: true,
				path: '/',
				secure: false,
				sameSite: 'lax',
				maxAge: 0
			});
		});

		it('should use maxAge 0 to delete cookie', () => {
			const mockEvent = createMockEvent();

			deleteEmailVerificationRequestCookie(mockEvent);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				emailVerificationRequestCookieName,
				'',
				expect.objectContaining({ maxAge: 0 })
			);
		});

		it('should maintain same security settings as set cookie', () => {
			const mockEvent = createMockEvent();

			deleteEmailVerificationRequestCookie(mockEvent);

			expect(mockEvent.cookies.set).toHaveBeenCalledWith(
				emailVerificationRequestCookieName,
				'',
				expect.objectContaining({
					httpOnly: true,
					path: '/',
					secure: false,
					sameSite: 'lax'
				})
			);
		});
	});

	describe('cookie name consistency', () => {
		it('should use same cookie name for set and delete operations', () => {
			const mockEvent = createMockEvent();
			const request = createMockRequest();

			// set cookie
			setEmailVerificationRequestCookie(mockEvent, request);
			const setCookieCall = mockEvent.cookies.set.mock.calls[0];

			// delete cookie
			deleteEmailVerificationRequestCookie(mockEvent);
			const deleteCookieCall = mockEvent.cookies.set.mock.calls[1];

			// both should use same cookie name
			expect(setCookieCall[0]).toBe(emailVerificationRequestCookieName);
			expect(deleteCookieCall[0]).toBe(emailVerificationRequestCookieName);
		});

		it('should maintain consistent security settings between set and delete', () => {
			const mockEvent = createMockEvent();
			const request = createMockRequest();

			// set cookie
			setEmailVerificationRequestCookie(mockEvent, request);
			const setOptions = mockEvent.cookies.set.mock.calls[0][2];

			// delete cookie
			deleteEmailVerificationRequestCookie(mockEvent);
			const deleteOptions = mockEvent.cookies.set.mock.calls[1][2];

			// security settings should match (excluding expires vs maxAge difference)
			expect(setOptions.httpOnly).toBe(deleteOptions.httpOnly);
			expect(setOptions.path).toBe(deleteOptions.path);
			expect(setOptions.secure).toBe(deleteOptions.secure);
			expect(setOptions.sameSite).toBe(deleteOptions.sameSite);
		});
	});
});

describe('database operations', () => {
	describe('createEmailVerificationRequest', () => {
		it('should create verification request successfully', async () => {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);
			const newEmail = 'newemail@test.com';

			const request = createEmailVerificationRequest(user.id, newEmail);

			expect(request).toBeDefined();
			expect(request.id).toBeDefined();
			expect(request.userId).toBe(user.id);
			expect(request.email).toBe(newEmail);
			expect(request.code).toBeDefined();
			expect(request.code).toMatch(/^[A-Z0-9]{8}$/); // 8-character OTP
			expect(request.expiresAt).toBeInstanceOf(Date);
			expect(request.expiresAt.getTime()).toBeGreaterThan(Date.now());
		});

		it('should create request with 10-minute expiration', async () => {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);
			const beforeCreate = Date.now();

			const request = createEmailVerificationRequest(user.id, 'test@test.com');

			const expectedExpiry = beforeCreate + 10 * 60 * 1000; // 10 minutes
			const actualExpiry = request.expiresAt.getTime();

			// Allow for small timing differences (within 1 second)
			expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
		});

		it('should delete existing request before creating new one', async () => {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);

			// Create first request
			const request1 = createEmailVerificationRequest(user.id, 'email1@test.com');
			expect(getUserEmailVerificationRequest(user.id, request1.id)).toBeDefined();

			// Create second request (should delete first)
			const request2 = createEmailVerificationRequest(user.id, 'email2@test.com');

			// First request should be gone
			expect(getUserEmailVerificationRequest(user.id, request1.id)).toBeNull();
			// Second request should exist
			expect(getUserEmailVerificationRequest(user.id, request2.id)).toBeDefined();
		});

		it('should generate unique IDs and codes', async () => {
			const user1 = await createUser('A1001', 'user1@test.com', 'password');
			const user2 = await createUser('B1002', 'user2@test.com', 'password');

			const request1 = createEmailVerificationRequest(user1.id, 'email1@test.com');
			const request2 = createEmailVerificationRequest(user2.id, 'email2@test.com');

			expect(request1.id).not.toBe(request2.id);
			expect(request1.code).not.toBe(request2.code);
		});
	});

	describe('getUserEmailVerificationRequest', () => {
		it('should return request when it exists', async () => {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);
			const email = 'verify@test.com';
			const createdRequest = createEmailVerificationRequest(user.id, email);

			const foundRequest = getUserEmailVerificationRequest(user.id, createdRequest.id);

			expect(foundRequest).toBeDefined();
			expect(foundRequest!.id).toBe(createdRequest.id);
			expect(foundRequest!.userId).toBe(user.id);
			expect(foundRequest!.email).toBe(email);
			expect(foundRequest!.code).toBe(createdRequest.code);
		});

		it('should return null for non-existent request', async () => {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);

			const foundRequest = getUserEmailVerificationRequest(user.id, 'non-existent-id');

			expect(foundRequest).toBeNull();
		});

		it('should return null when user ID does not match', async () => {
			const user1 = await createUser('A1001', 'user1@test.com', 'password');
			const user2 = await createUser('B1002', 'user2@test.com', 'password');
			const request = createEmailVerificationRequest(user1.id, 'email@test.com');

			// Try to get request with wrong user ID
			const foundRequest = getUserEmailVerificationRequest(user2.id, request.id);

			expect(foundRequest).toBeNull();
		});
	});

	describe('deleteUserEmailVerificationRequest', () => {
		it('should delete existing request', async () => {
			const user = await createUser(testUser.apartment, testUser.email, testUser.password);
			const request = createEmailVerificationRequest(user.id, 'email@test.com');

			// Verify request exists
			expect(getUserEmailVerificationRequest(user.id, request.id)).toBeDefined();

			deleteUserEmailVerificationRequest(user.id);

			// Verify request is deleted
			expect(getUserEmailVerificationRequest(user.id, request.id)).toBeNull();
		});

		it('should not affect other users requests', async () => {
			const user1 = await createUser('A1001', 'user1@test.com', 'password');
			const user2 = await createUser('B1002', 'user2@test.com', 'password');
			const request1 = createEmailVerificationRequest(user1.id, 'email1@test.com');
			const request2 = createEmailVerificationRequest(user2.id, 'email2@test.com');

			deleteUserEmailVerificationRequest(user1.id);

			// User1's request should be deleted
			expect(getUserEmailVerificationRequest(user1.id, request1.id)).toBeNull();
			// User2's request should remain
			expect(getUserEmailVerificationRequest(user2.id, request2.id)).toBeDefined();
		});

		it('should handle deleting non-existent requests gracefully', () => {
			// Should not throw
			expect(() => deleteUserEmailVerificationRequest('non-existent-user-id')).not.toThrow();
		});
	});
});

describe('sendVerificationEmail', () => {
	it('should log verification email to console', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const email = 'test@example.com';
		const code = '12345678';

		sendVerificationEmail(email, code);

		expect(consoleSpy).toHaveBeenCalledWith(`To ${email}: Your verification code is ${code}`);
		consoleSpy.mockRestore();
	});

	it('should handle different email formats', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const emails = ['user@domain.com', 'test.email+tag@example.org', 'user@subdomain.domain.co.uk'];
		const code = '87654321';

		emails.forEach((email) => {
			sendVerificationEmail(email, code);
			expect(consoleSpy).toHaveBeenCalledWith(`To ${email}: Your verification code is ${code}`);
		});

		consoleSpy.mockRestore();
	});
});

describe('getUserEmailVerificationRequestFromRequest', () => {
	it('should return request when user is logged in and cookie exists', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const request = createEmailVerificationRequest(user.id, 'email@test.com');

		const mockEvent = createMockEvent({
			locals: { user, session: null },
			cookies: {
				get: vi.fn().mockReturnValue(request.id),
				set: vi.fn()
			}
		});

		const foundRequest = getUserEmailVerificationRequestFromRequest(mockEvent);

		expect(foundRequest).toBeDefined();
		expect(foundRequest!.id).toBe(request.id);
		expect(foundRequest!.userId).toBe(user.id);
	});

	it('should return null when user is not logged in', () => {
		const mockEvent = createMockEvent({
			locals: { user: null, session: null }
		});

		const foundRequest = getUserEmailVerificationRequestFromRequest(mockEvent);

		expect(foundRequest).toBeNull();
	});

	it('should return null when no cookie exists', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);

		const mockEvent = createMockEvent({
			locals: { user, session: null },
			cookies: {
				get: vi.fn().mockReturnValue(null),
				set: vi.fn()
			}
		});

		const foundRequest = getUserEmailVerificationRequestFromRequest(mockEvent);

		expect(foundRequest).toBeNull();
	});

	it('should delete cookie and return null when request does not exist', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);

		const mockEvent = createMockEvent({
			locals: { user, session: null },
			cookies: {
				get: vi.fn().mockReturnValue('non-existent-request-id'),
				set: vi.fn()
			}
		});

		const foundRequest = getUserEmailVerificationRequestFromRequest(mockEvent);

		expect(foundRequest).toBeNull();
		expect(mockEvent.cookies.set).toHaveBeenCalledWith(
			emailVerificationRequestCookieName,
			'',
			expect.objectContaining({ maxAge: 0 })
		);
	});
});

describe('rate limiting', () => {
	it('should have rate limiter for verification emails', () => {
		expect(sendVerificationEmailBucket).toBeDefined();
	});

	it('should limit to 3 emails per 10 minutes per identifier', () => {
		const identifier = 'test@example.com';

		// Should allow first 3 requests
		expect(sendVerificationEmailBucket.consume(identifier, 1)).toBe(true);
		expect(sendVerificationEmailBucket.consume(identifier, 1)).toBe(true);
		expect(sendVerificationEmailBucket.consume(identifier, 1)).toBe(true);

		// Should reject 4th request
		expect(sendVerificationEmailBucket.consume(identifier, 1)).toBe(false);
	});

	it('should allow different identifiers independently', () => {
		const identifier1 = 'user1@example.com';
		const identifier2 = 'user2@example.com';

		// Exhaust bucket for identifier1
		expect(sendVerificationEmailBucket.consume(identifier1, 3)).toBe(true);
		expect(sendVerificationEmailBucket.consume(identifier1, 1)).toBe(false);

		// identifier2 should still work
		expect(sendVerificationEmailBucket.consume(identifier2, 1)).toBe(true);
		expect(sendVerificationEmailBucket.consume(identifier2, 1)).toBe(true);
		expect(sendVerificationEmailBucket.consume(identifier2, 1)).toBe(true);
	});
});

describe('integration tests', () => {
	it('should handle complete email verification lifecycle', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const newEmail = 'newemail@test.com';

		// Create verification request
		const request = createEmailVerificationRequest(user.id, newEmail);
		expect(request).toBeDefined();

		// Should be able to retrieve request
		const foundRequest = getUserEmailVerificationRequest(user.id, request.id);
		expect(foundRequest).toBeDefined();
		expect(foundRequest!.email).toBe(newEmail);

		// Should be able to send verification email
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		sendVerificationEmail(request.email, request.code);
		expect(consoleSpy).toHaveBeenCalledWith(
			`To ${newEmail}: Your verification code is ${request.code}`
		);
		consoleSpy.mockRestore();

		// Should be able to delete request
		deleteUserEmailVerificationRequest(user.id);
		expect(getUserEmailVerificationRequest(user.id, request.id)).toBeNull();
	});

	it('should handle multiple users with verification requests', async () => {
		const user1 = await createUser('A1001', 'user1@test.com', 'password1');
		const user2 = await createUser('B1002', 'user2@test.com', 'password2');
		const user3 = await createUser('C1003', 'user3@test.com', 'password3');

		const request1 = createEmailVerificationRequest(user1.id, 'new1@test.com');
		const request2 = createEmailVerificationRequest(user2.id, 'new2@test.com');
		const request3 = createEmailVerificationRequest(user3.id, 'new3@test.com');

		// All requests should exist independently
		expect(getUserEmailVerificationRequest(user1.id, request1.id)).toBeDefined();
		expect(getUserEmailVerificationRequest(user2.id, request2.id)).toBeDefined();
		expect(getUserEmailVerificationRequest(user3.id, request3.id)).toBeDefined();

		// Users shouldn't be able to access each other's requests
		expect(getUserEmailVerificationRequest(user1.id, request2.id)).toBeNull();
		expect(getUserEmailVerificationRequest(user2.id, request3.id)).toBeNull();
		expect(getUserEmailVerificationRequest(user3.id, request1.id)).toBeNull();

		// Deleting one user's request shouldn't affect others
		deleteUserEmailVerificationRequest(user2.id);
		expect(getUserEmailVerificationRequest(user1.id, request1.id)).toBeDefined();
		expect(getUserEmailVerificationRequest(user2.id, request2.id)).toBeNull();
		expect(getUserEmailVerificationRequest(user3.id, request3.id)).toBeDefined();
	});

	it('should handle cookie-based request retrieval', async () => {
		const user = await createUser(testUser.apartment, testUser.email, testUser.password);
		const request = createEmailVerificationRequest(user.id, 'cookie@test.com');

		// Mock event with cookie
		const mockEventWithCookie = createMockEvent({
			locals: { user, session: null },
			cookies: {
				get: vi.fn().mockReturnValue(request.id),
				set: vi.fn()
			}
		});

		// Should retrieve request from cookie
		const foundFromCookie = getUserEmailVerificationRequestFromRequest(mockEventWithCookie);
		expect(foundFromCookie).toBeDefined();
		expect(foundFromCookie!.id).toBe(request.id);

		// Mock event with invalid cookie
		const mockEventWithInvalidCookie = createMockEvent({
			locals: { user, session: null },
			cookies: {
				get: vi.fn().mockReturnValue('invalid-request-id'),
				set: vi.fn()
			}
		});

		// Should return null and delete cookie
		const foundFromInvalidCookie = getUserEmailVerificationRequestFromRequest(
			mockEventWithInvalidCookie
		);
		expect(foundFromInvalidCookie).toBeNull();
		expect(mockEventWithInvalidCookie.cookies.set).toHaveBeenCalledWith(
			emailVerificationRequestCookieName,
			'',
			expect.objectContaining({ maxAge: 0 })
		);
	});
});
