import { describe, expect, it, vi } from 'vitest';
import {
	deletePasswordResetSessionTokenCookie,
	passwordResetSessionCookieName,
	setPasswordResetSessionTokenCookie
} from '$lib/server/auth/password-reset';

const createMockEvent = () =>
	({
		cookies: {
			set: vi.fn()
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}) as any;

describe('setPasswordResetSessionTokenCookie', () => {
	it('should set cookie with correct options', () => {
		const mockEvent = createMockEvent();
		const token = 'test-token-123';
		const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

		setPasswordResetSessionTokenCookie(mockEvent, token, expiresAt);

		expect(mockEvent.cookies.set).toHaveBeenCalledWith(passwordResetSessionCookieName, token, {
			expires: expiresAt,
			sameSite: 'lax',
			httpOnly: true,
			path: '/',
			secure: false
		});
	});

	it('should handle different expiration times', () => {
		const mockEvent = createMockEvent();
		const token = 'test-token';
		const shortExpiry = new Date(Date.now() + 1000 * 60); // 1 minute
		const longExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

		setPasswordResetSessionTokenCookie(mockEvent, token, shortExpiry);
		expect(mockEvent.cookies.set).toHaveBeenCalledWith(
			passwordResetSessionCookieName,
			token,
			expect.objectContaining({ expires: shortExpiry })
		);

		setPasswordResetSessionTokenCookie(mockEvent, token, longExpiry);
		expect(mockEvent.cookies.set).toHaveBeenCalledWith(
			passwordResetSessionCookieName,
			token,
			expect.objectContaining({ expires: longExpiry })
		);
	});

	it('should handle empty token', () => {
		const mockEvent = createMockEvent();
		const expiresAt = new Date();

		setPasswordResetSessionTokenCookie(mockEvent, '', expiresAt);

		expect(mockEvent.cookies.set).toHaveBeenCalledWith(passwordResetSessionCookieName, '', {
			expires: expiresAt,
			sameSite: 'lax',
			httpOnly: true,
			path: '/',
			secure: false
		});
	});

	it('should handle special characters in token', () => {
		const mockEvent = createMockEvent();
		const tokenWithSpecialChars = 'token-with-!@#$%^&*()_+{}|:"<>?';
		const expiresAt = new Date();

		setPasswordResetSessionTokenCookie(mockEvent, tokenWithSpecialChars, expiresAt);

		expect(mockEvent.cookies.set).toHaveBeenCalledWith(
			passwordResetSessionCookieName,
			tokenWithSpecialChars,
			expect.objectContaining({})
		);
	});
});

describe('deletePasswordResetSessionTokenCookie', () => {
	it('should delete cookie with correct options', () => {
		const mockEvent = createMockEvent();

		deletePasswordResetSessionTokenCookie(mockEvent);

		expect(mockEvent.cookies.set).toHaveBeenCalledWith(passwordResetSessionCookieName, '', {
			maxAge: 0,
			sameSite: 'lax',
			httpOnly: true,
			path: '/',
			secure: false
		});
	});

	it('should use maxAge 0 to delete cookie', () => {
		const mockEvent = createMockEvent();

		deletePasswordResetSessionTokenCookie(mockEvent);

		expect(mockEvent.cookies.set).toHaveBeenCalledWith(
			passwordResetSessionCookieName,
			'',
			expect.objectContaining({ maxAge: 0 })
		);
	});

	it('should maintain same security settings as set cookie', () => {
		const mockEvent = createMockEvent();

		deletePasswordResetSessionTokenCookie(mockEvent);

		expect(mockEvent.cookies.set).toHaveBeenCalledWith(
			passwordResetSessionCookieName,
			'',
			expect.objectContaining({
				sameSite: 'lax',
				httpOnly: true,
				path: '/',
				secure: false
			})
		);
	});
});
