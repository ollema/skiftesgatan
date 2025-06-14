import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarDateTime } from '@internationalized/date';
import {
	cancelBooking,
	createBooking,
	getBookingById,
	getBookings,
	getBookingsArray,
	getBookingsPerUser,
	getFutureBookingsPerUser
} from '$lib/server/bookings';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { now } from '$lib/datetime';

const testUser1 = {
	id: 'user1' as const,
	apartment: 'A1101' as const,
	email: 'user1@test.com' as const,
	emailVerified: true as const,
	passwordHash: 'hashed-password' as const
};
const testUser2 = {
	id: 'user2' as const,
	apartment: 'B1202' as const,
	email: 'user2@test.com' as const,
	emailVerified: true as const,
	passwordHash: 'hashed-password' as const
};
const testUser3 = {
	id: 'user3' as const,
	apartment: 'C1303' as const,
	email: 'user3@test.com' as const,
	emailVerified: true as const,
	passwordHash: 'hashed-password' as const
};
const testUser4 = {
	id: 'user4' as const,
	apartment: 'D1304' as const,
	email: 'user4@test.com' as const,
	emailVerified: true as const,
	passwordHash: 'hashed-password' as const
};

const testUsers = [testUser1, testUser2, testUser3, testUser4];

beforeEach(() => {
	vi.useFakeTimers();

	// create all test users
	for (const user of testUsers) {
		db.run(
			`INSERT INTO user (id, apartment, email, email_verified, password_hash) VALUES ('${user.id}', '${user.apartment}', '${user.email}', ${user.emailVerified}, '${user.passwordHash}')`
		);
	}
});

afterEach(() => {
	db.run('DELETE FROM booking');
	db.run('DELETE FROM user');
	vi.useRealTimers();
});

function insertTestBooking(
	userId: string,
	bookingType: 'laundry' | 'bbq',
	startTime: string,
	endTime: string
) {
	const id = 'test-' + Math.random().toString(36).substring(2);

	db.insert(table.booking)
		.values({
			id,
			userId,
			bookingType,
			start: startTime,
			end: endTime,
			createdAt: now()
		})
		.run();

	return id;
}

describe('createBooking', () => {
	it('should create a new booking successfully', () => {
		const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

		const booking = createBooking(testUser1.id, 'laundry', startTime, endTime);

		expect(booking).toBeDefined();
		expect(booking.userId).toBe(testUser1.id);
		expect(booking.bookingType).toBe('laundry');
		expect(booking.start.compare(startTime)).toBe(0);
		expect(booking.end.compare(endTime)).toBe(0);
	});

	it('should reject booking in the past', () => {
		const startTime = new CalendarDateTime(2024, 6, 10, 7, 0, 0);
		const endTime = new CalendarDateTime(2024, 6, 10, 11, 0, 0);

		vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024

		expect(() => createBooking(testUser1.id, 'laundry', startTime, endTime)).toThrow(
			'Bokningar kan endast göras för framtida tidpunkter'
		);
	});

	it('should reject booking exactly at current time', () => {
		const now = new Date(2024, 5, 15, 7, 0);
		vi.setSystemTime(now);

		const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		expect(() => createBooking(testUser1.id, 'laundry', startTime, endTime)).toThrow(
			'Bokningar kan endast göras för framtida tidpunkter'
		);
	});

	it('should implement smart booking by cancelling existing future booking', () => {
		vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

		const firstStart = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const firstEnd = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		const firstBooking = createBooking(testUser1.id, 'laundry', firstStart, firstEnd);
		expect(firstBooking).toBeDefined();

		const secondStart = new CalendarDateTime(2024, 6, 16, 15, 0, 0);
		const secondEnd = new CalendarDateTime(2024, 6, 16, 19, 0, 0);

		const secondBooking = createBooking(testUser1.id, 'laundry', secondStart, secondEnd);

		const oldBooking = getBookingById(firstBooking.id);
		expect(oldBooking).toBeNull();

		expect(secondBooking.start.compare(secondStart)).toBe(0);
	});

	it('should allow multiple bookings of different types for same user', () => {
		vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

		const laundryStart = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const laundryEnd = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		const bbqStart = new CalendarDateTime(2024, 6, 16, 8, 0, 0);
		const bbqEnd = new CalendarDateTime(2024, 6, 16, 20, 0, 0);

		const laundryBooking = createBooking(testUser1.id, 'laundry', laundryStart, laundryEnd);
		const bbqBooking = createBooking(testUser1.id, 'bbq', bbqStart, bbqEnd);

		expect(laundryBooking).toBeDefined();
		expect(bbqBooking).toBeDefined();

		const userLaundryBookings = getBookingsPerUser(testUser1.id, 'laundry', 10);
		const userBbqBookings = getBookingsPerUser(testUser1.id, 'bbq', 10);
		expect(userLaundryBookings).toHaveLength(1);
		expect(userBbqBookings).toHaveLength(1);
	});

	it('should reject conflicting bookings from different users', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		createBooking(testUser1.id, 'laundry', startTime, endTime);

		getBookingsPerUser(testUser1.id, 'laundry', 10);

		expect(() => createBooking(testUser2.id, 'laundry', startTime, endTime)).toThrow(
			'Den valda tiden är redan bokad'
		);
	});
});

describe('booking type independence', () => {
	it('should handle different booking types independently with overlapping times', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		// bbq slot (08:00-20:00) overlaps with laundry slot (07:00-11:00) but different types
		const laundryStart = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const laundryEnd = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		const bbqStart = new CalendarDateTime(2024, 6, 15, 8, 0, 0);
		const bbqEnd = new CalendarDateTime(2024, 6, 15, 20, 0, 0);

		createBooking(testUser1.id, 'laundry', laundryStart, laundryEnd);
		createBooking(testUser2.id, 'bbq', bbqStart, bbqEnd);

		const startDate = new CalendarDateTime(2024, 6, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2024, 7, 1, 0, 0, 0);

		const laundryGrid = getBookings('laundry', startDate, endDate);
		const bbqGrid = getBookings('bbq', startDate, endDate);

		// Check that June 15th has bookings in the grids
		const june15 = '2024-06-15';
		expect(laundryGrid[june15]).toBeDefined();
		expect(bbqGrid[june15]).toBeDefined();

		// Laundry booking should be in slot 0 (7-11)
		expect(laundryGrid[june15][0]).not.toBeNull();
		expect(laundryGrid[june15][0]!.userId).toBe(testUser1.id);

		// BBQ booking should be in slot 0 (only slot)
		expect(bbqGrid[june15][0]).not.toBeNull();
		expect(bbqGrid[june15][0]!.userId).toBe(testUser2.id);
	});
});

describe('consecutive bookings', () => {
	it('should allow adjacent laundry time slots on same day', () => {
		vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

		const slot1Start = new CalendarDateTime(2024, 6, 15, 7, 0, 0); // 07:00-11:00
		const slot1End = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		const slot2Start = new CalendarDateTime(2024, 6, 15, 11, 0, 0); // 11:00-15:00
		const slot2End = new CalendarDateTime(2024, 6, 15, 15, 0, 0);

		createBooking(testUser1.id, 'laundry', slot1Start, slot1End);
		createBooking(testUser2.id, 'laundry', slot2Start, slot2End);

		const startDate = new CalendarDateTime(2024, 6, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2024, 7, 1, 0, 0, 0);
		const grid = getBookings('laundry', startDate, endDate);

		// Check that June 15th has bookings in slots 0 and 1
		const june15 = '2024-06-15';
		expect(grid[june15][0]).not.toBeNull(); // Slot 0: 7-11
		expect(grid[june15][1]).not.toBeNull(); // Slot 1: 11-15
		expect(grid[june15][0]!.userId).toBe(testUser1.id);
		expect(grid[june15][1]!.userId).toBe(testUser2.id);
	});

	it('should allow later adjacent slots (15:00-19:00 → 19:00-22:00)', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const slot3Start = new CalendarDateTime(2024, 6, 15, 15, 0, 0); // 15:00-19:00
		const slot3End = new CalendarDateTime(2024, 6, 15, 19, 0, 0);

		const slot4Start = new CalendarDateTime(2024, 6, 15, 19, 0, 0); // 19:00-22:00
		const slot4End = new CalendarDateTime(2024, 6, 15, 22, 0, 0);

		createBooking(testUser1.id, 'laundry', slot3Start, slot3End);
		createBooking(testUser2.id, 'laundry', slot4Start, slot4End);

		const startDate = new CalendarDateTime(2024, 6, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2024, 7, 1, 0, 0, 0);
		const bookings = getBookingsArray('laundry', startDate, endDate);
		expect(bookings).toHaveLength(2);

		// verify they're in chronological order
		expect(bookings[0].start.compare(bookings[1].start)).toBeLessThan(0);
		expect(bookings[0].end.compare(bookings[1].start)).toBe(0);
	});

	it('should allow all four laundry slots on same day by different users', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		// book all four laundry slots on same day
		const slot1Start = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const slot1End = new CalendarDateTime(2024, 6, 15, 11, 0, 0);
		const slot2Start = new CalendarDateTime(2024, 6, 15, 11, 0, 0);
		const slot2End = new CalendarDateTime(2024, 6, 15, 15, 0, 0);
		const slot3Start = new CalendarDateTime(2024, 6, 15, 15, 0, 0);
		const slot3End = new CalendarDateTime(2024, 6, 15, 19, 0, 0);
		const slot4Start = new CalendarDateTime(2024, 6, 15, 19, 0, 0);
		const slot4End = new CalendarDateTime(2024, 6, 15, 22, 0, 0);

		createBooking(testUser1.id, 'laundry', slot1Start, slot1End);
		createBooking(testUser2.id, 'laundry', slot2Start, slot2End);
		createBooking(testUser3.id, 'laundry', slot3Start, slot3End);
		createBooking(testUser4.id, 'laundry', slot4Start, slot4End);

		const startDate = new CalendarDateTime(2024, 6, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2024, 7, 1, 0, 0, 0);
		const bookings = getBookingsArray('laundry', startDate, endDate);
		expect(bookings).toHaveLength(4);

		// verify all users got their slots and they're consecutive
		expect(bookings[0].userId).toBe(testUser1.id);
		expect(bookings[1].userId).toBe(testUser2.id);
		expect(bookings[2].userId).toBe(testUser3.id);
		expect(bookings[3].userId).toBe(testUser4.id);

		// verify perfect continuity (each booking ends when next begins)
		expect(bookings[0].end.compare(bookings[1].start)).toBe(0);
		expect(bookings[1].end.compare(bookings[2].start)).toBe(0);
		expect(bookings[2].end.compare(bookings[3].start)).toBe(0);
	});

	it('should allow non-adjacent slots with gaps (07:00-11:00 → 15:00-19:00)', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const earlyStart = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const earlyEnd = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		const lateStart = new CalendarDateTime(2024, 6, 15, 15, 0, 0);
		const lateEnd = new CalendarDateTime(2024, 6, 15, 19, 0, 0);

		createBooking(testUser1.id, 'laundry', earlyStart, earlyEnd);
		createBooking(testUser2.id, 'laundry', lateStart, lateEnd);

		const startDate = new CalendarDateTime(2024, 6, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2024, 7, 1, 0, 0, 0);
		const bookings = getBookingsArray('laundry', startDate, endDate);
		expect(bookings).toHaveLength(2);

		// verify 4-hour gap between bookings (11:00 to 15:00)
		expect(bookings[0].end.hour).toBe(11);
		expect(bookings[1].start.hour).toBe(15);
		const gapInHours = bookings[1].start.hour - bookings[0].end.hour;
		expect(gapInHours).toBe(4);
	});
});

describe('cancelBooking', () => {
	it('should cancel an existing booking', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0);
		const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0);

		const booking = createBooking(testUser1.id, 'laundry', startTime, endTime);

		const result = cancelBooking(booking.id);
		expect(result).toBe(true);

		const cancelledBooking = getBookingById(booking.id);
		expect(cancelledBooking).toBeNull();
	});

	it('should return false for non-existent booking', () => {
		const result = cancelBooking('non-existent-id');
		expect(result).toBe(false);
	});
});

describe('query functions', () => {
	it('should return bookings for specific type and month', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const booking1Start = '2024-06-15T07:00:00';
		const booking1End = '2024-06-15T11:00:00';
		insertTestBooking(testUser1.id, 'laundry', booking1Start, booking1End);

		const booking2Start = '2024-06-20T15:00:00';
		const booking2End = '2024-06-20T19:00:00';
		insertTestBooking(testUser2.id, 'laundry', booking2Start, booking2End);

		const bbqStart = '2024-06-15T08:00:00';
		const bbqEnd = '2024-06-15T20:00:00';
		insertTestBooking(testUser1.id, 'bbq', bbqStart, bbqEnd);

		const startDate = new CalendarDateTime(2024, 6, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2024, 7, 1, 0, 0, 0);
		const bookings = getBookingsArray('laundry', startDate, endDate);
		expect(bookings).toHaveLength(2);
		expect(bookings.every((b) => b.bookingType === 'laundry')).toBe(true);
	});

	it('should return empty array for month with no bookings', () => {
		const startDate = new CalendarDateTime(2024, 12, 1, 0, 0, 0);
		const endDate = new CalendarDateTime(2025, 1, 1, 0, 0, 0);
		const bookings = getBookingsArray('laundry', startDate, endDate);
		expect(bookings).toHaveLength(0);
	});

	it('should return bookings for a specific user', () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const booking1Start = '2024-06-15T07:00:00';
		const booking1End = '2024-06-15T11:00:00';
		insertTestBooking(testUser1.id, 'laundry', booking1Start, booking1End);

		const booking2Start = '2024-06-20T08:00:00';
		const booking2End = '2024-06-20T20:00:00';
		insertTestBooking(testUser1.id, 'bbq', booking2Start, booking2End);

		const booking3Start = '2024-06-15T15:00:00';
		const booking3End = '2024-06-15T19:00:00';
		insertTestBooking(testUser2.id, 'laundry', booking3Start, booking3End);

		const laundryBookings = getBookingsPerUser(testUser1.id, 'laundry', 10);
		const bbqBookings = getBookingsPerUser(testUser1.id, 'bbq', 10);
		expect(laundryBookings).toHaveLength(1);
		expect(bbqBookings).toHaveLength(1);
		expect(laundryBookings[0].userId).toBe(testUser1.id);
		expect(bbqBookings[0].userId).toBe(testUser1.id);
	});

	it('should return empty array for non-existent user', () => {
		const bookings = getBookingsPerUser('non-existent-user', 'laundry', 10);
		expect(bookings).toHaveLength(0);
	});

	it('should return only future bookings for user', () => {
		vi.setSystemTime(new Date(2024, 5, 15, 12, 0)); // June 15, 2024, 12:00

		const pastStart = '2024-06-10T07:00:00';
		const pastEnd = '2024-06-10T11:00:00';
		insertTestBooking(testUser1.id, 'laundry', pastStart, pastEnd);

		const future1Start = new CalendarDateTime(2024, 6, 20, 7, 0, 0);
		const future1End = new CalendarDateTime(2024, 6, 20, 11, 0, 0);
		createBooking(testUser1.id, 'laundry', future1Start, future1End);

		const future2Start = new CalendarDateTime(2024, 6, 25, 8, 0, 0);
		const future2End = new CalendarDateTime(2024, 6, 25, 20, 0, 0);
		createBooking(testUser1.id, 'bbq', future2Start, future2End);

		const futureLaundryBookings = getFutureBookingsPerUser(testUser1.id, 'laundry');
		const futureBbqBookings = getFutureBookingsPerUser(testUser1.id, 'bbq');
		expect(futureLaundryBookings).toHaveLength(1);
		expect(futureBbqBookings).toHaveLength(1);
		expect(
			futureLaundryBookings![0].start.compare(new CalendarDateTime(2024, 6, 15, 12, 0, 0)) > 0
		).toBe(true);
		expect(
			futureBbqBookings![0].start.compare(new CalendarDateTime(2024, 6, 15, 12, 0, 0)) > 0
		).toBe(true);
	});
});
