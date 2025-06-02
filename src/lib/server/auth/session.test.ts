import { describe, it, expect, vi } from 'vitest';
import { generateSessionToken, sessionCookieName } from '$lib/server/auth/session';

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
		expect(sessionCookieName).toBe('auth-session');
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
