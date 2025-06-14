import { describe, expect, it, vi } from 'vitest';
import { dateToString, now } from './datetime';

describe('datetime utilities', () => {
	describe('now', () => {
		it('should return current time in Stockholm timezone as ISO string', () => {
			// Set a specific time for testing
			vi.setSystemTime(new Date('2024-06-15T10:30:45.123Z'));

			const result = now();

			// Should be in YYYY-MM-DDTHH:MM:SS format (no milliseconds or timezone)
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);

			// In summer, Stockholm is UTC+2, so 10:30 UTC should be 12:30 local
			expect(result).toBe('2024-06-15T12:30:45');
		});

		it('should handle winter time correctly', () => {
			// Set a winter date (Stockholm is UTC+1 in winter)
			vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'));

			const result = now();

			// In winter, Stockholm is UTC+1, so 10:30 UTC should be 11:30 local
			expect(result).toBe('2024-01-15T11:30:45');
		});
	});

	describe('dateToString', () => {
		it('should convert Date object to Stockholm timezone ISO string', () => {
			const date = new Date('2024-06-15T10:30:45.123Z');

			const result = dateToString(date);

			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
			expect(result).toBe('2024-06-15T12:30:45');
		});

		it('should handle winter dates correctly', () => {
			const date = new Date('2024-01-15T10:30:45.123Z');

			const result = dateToString(date);

			expect(result).toBe('2024-01-15T11:30:45');
		});

		it('should handle dates created from local time', () => {
			// Create a date object using local constructor (this will be in system timezone)
			const date = new Date(2024, 5, 15, 14, 30, 45); // June 15, 2024, 14:30:45 local time

			const result = dateToString(date);

			// Should be formatted correctly regardless of system timezone
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
			// The exact time will depend on the system timezone, but format should be consistent
		});
	});

	describe('format consistency', () => {
		it('should always return same format across different dates', () => {
			const dates = [
				new Date('2024-01-01T00:00:00Z'),
				new Date('2024-06-15T12:30:45Z'),
				new Date('2024-12-31T23:59:59Z')
			];

			for (const date of dates) {
				const result = dateToString(date);
				expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
				expect(result).not.toContain('.');
				expect(result).not.toContain('Z');
				expect(result).not.toContain('+');
			}
		});
	});
});
