import { describe, it, expect, vi } from 'vitest';
import {
	setEmailVerificationRequestCookie,
	deleteEmailVerificationRequestCookie,
	type EmailVerificationRequest,
	emailVerificationRequestCookieName
} from '$lib/server/auth/email-verification';

const createMockEvent = () =>
	({
		cookies: {
			set: vi.fn()
		}
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
