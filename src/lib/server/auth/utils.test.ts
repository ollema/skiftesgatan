import { describe, expect, it, vi } from 'vitest';
import { generateId, generateRandomOTP } from '$lib/server/auth/utils';

describe('generateId', () => {
	it('should generate IDs of consistent length', () => {
		const id1 = generateId();
		const id2 = generateId();

		expect(id1).toHaveLength(24);
		expect(id2).toHaveLength(24);
	});

	it('should generate unique IDs', () => {
		const ids = new Set();
		const iterations = 1000;

		for (let i = 0; i < iterations; i++) {
			ids.add(generateId());
		}

		expect(ids.size).toBe(iterations);
	});

	it('should generate IDs containing only lowercase base32 characters', () => {
		const id = generateId();
		const base32Regex = /^[a-z2-7]+$/;
		expect(id).toMatch(base32Regex);
	});

	it('should generate IDs that are strings', () => {
		const id = generateId();
		expect(typeof id).toBe('string');
	});

	it('should handle crypto.getRandomValues being called', () => {
		const spy = vi.spyOn(crypto, 'getRandomValues');

		generateId();

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith(expect.any(Uint8Array));

		spy.mockRestore();
	});
});

describe('generateRandomOTP', () => {
	it('should generate OTPs of consistent length', () => {
		const otp1 = generateRandomOTP();
		const otp2 = generateRandomOTP();

		expect(otp1).toHaveLength(8);
		expect(otp2).toHaveLength(8);
	});

	it('should generate unique OTPs', () => {
		const otps = new Set();
		const iterations = 1000;

		for (let i = 0; i < iterations; i++) {
			otps.add(generateRandomOTP());
		}

		expect(otps.size).toBe(iterations);
	});

	it('should generate OTPs containing only uppercase base32 characters', () => {
		const otp = generateRandomOTP();
		const base32Regex = /^[A-Z2-7]+$/;
		expect(otp).toMatch(base32Regex);
	});

	it('should generate OTPs that are strings', () => {
		const otp = generateRandomOTP();
		expect(typeof otp).toBe('string');
	});
});
