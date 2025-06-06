import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZonedDateTime } from '@internationalized/date';
import {
	STOCKHOLM_TZ,
	cancelBooking,
	createBooking,
	formatBookingTime,
	getApartmentBookings,
	getBookingById,
	getBookings,
	getUserBookings,
	getUserFutureBookings,
	isTimeSlotAvailable
} from './bookings';
import { db } from '$lib/server/db';

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

beforeEach(() => {
	vi.useFakeTimers();

	db.run(
		`INSERT INTO user (id, apartment, email, email_verified, password_hash) VALUES ('${testUser1.id}', '${testUser1.apartment}', '${testUser1.email}', ${testUser1.emailVerified}, '${testUser1.passwordHash}')`
	);
	db.run(
		`INSERT INTO user (id, apartment, email, email_verified, password_hash) VALUES ('${testUser2.id}', '${testUser2.apartment}', '${testUser2.email}', ${testUser2.emailVerified}, '${testUser2.passwordHash}')`
	);
});

afterEach(() => {
	db.run('DELETE FROM booking');
	db.run('DELETE FROM user');
	vi.useRealTimers();
});

function expectDatesClose(actual: Date, expected: Date, toleranceMs = 1000) {
	// Normalize both dates to remove milliseconds (like SQLite timestamp mode does)
	const normalizeDate = (date: Date) => new Date(Math.floor(date.getTime() / 1000) * 1000);

	const normalizedActual = normalizeDate(actual);
	const normalizedExpected = normalizeDate(expected);

	const diff = Math.abs(normalizedActual.getTime() - normalizedExpected.getTime());
	expect(diff).toBeLessThan(toleranceMs);
}

function insertTestBooking(
	userId: string,
	bookingType: 'laundry' | 'bbq',
	startTime: ZonedDateTime,
	endTime: ZonedDateTime
) {
	const startDate = startTime.toDate();
	const endDate = endTime.toDate();
	const id = 'test-' + Math.random().toString(36).substring(2);

	db.run(`
		INSERT INTO booking (id, user_id, booking_type, start_time, end_time, created_at)
		VALUES ('${id}', '${userId}', '${bookingType}', '${startDate.toISOString()}', '${endDate.toISOString()}', '${Math.floor(Date.now() / 1000)}')
	`);

	return id;
}

describe('Debug date precision', () => {
	it('should show date precision behavior', async () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
		const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

		console.log('Original ZonedDateTime dates:');
		console.log('Start:', startTime.toDate().toISOString());
		console.log('End:', endTime.toDate().toISOString());

		const booking = await createBooking(testUser1.id, 'laundry', startTime, endTime);

		console.log('Stored in database:');
		console.log('Start:', booking.startTime.toISOString());
		console.log('End:', booking.endTime.toISOString());

		// Check if dates match exactly
		console.log(
			'Dates match exactly:',
			booking.startTime.getTime() === startTime.toDate().getTime() &&
				booking.endTime.getTime() === endTime.toDate().getTime()
		);
	});
});

describe('Booking Management', () => {
	describe('createBooking', () => {
		it('should create a new booking successfully', async () => {
			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const booking = await createBooking(testUser1.id, 'laundry', startTime, endTime);

			expect(booking).toBeDefined();
			expect(booking.userId).toBe(testUser1.id);
			expect(booking.bookingType).toBe('laundry');
			expectDatesClose(booking.startTime, startTime.toDate());
			expectDatesClose(booking.endTime, endTime.toDate());
		});

		it('should reject booking in the past', async () => {
			const startTime = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024

			await expect(createBooking(testUser1.id, 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should implement smart booking by cancelling existing future booking', async () => {
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const firstStart = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const firstEnd = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const firstBooking = await createBooking(testUser1.id, 'laundry', firstStart, firstEnd);
			expect(firstBooking).toBeDefined();

			const secondStart = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 15, 0, 0, 0, 0);
			const secondEnd = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 19, 0, 0, 0, 0);

			const secondBooking = await createBooking(testUser1.id, 'laundry', secondStart, secondEnd);

			const oldBooking = await getBookingById(firstBooking.id);
			expect(oldBooking).toBeNull();

			expectDatesClose(secondBooking.startTime, secondStart.toDate());
		});

		it('should allow multiple bookings of different types', async () => {
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const laundryStart = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const laundryEnd = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const bbqStart = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 8, 0, 0, 0, 0);
			const bbqEnd = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 20, 0, 0, 0, 0);

			const laundryBooking = await createBooking(testUser1.id, 'laundry', laundryStart, laundryEnd);
			const bbqBooking = await createBooking(testUser1.id, 'bbq', bbqStart, bbqEnd);

			expect(laundryBooking).toBeDefined();
			expect(bbqBooking).toBeDefined();

			const userBookings = await getUserBookings(testUser1.id);
			expect(userBookings).toHaveLength(2);
		});

		it('should reject conflicting bookings from different users', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			console.log('Creating first booking for user1...');
			const firstBooking = await createBooking(testUser1.id, 'laundry', startTime, endTime);
			console.log('First booking created:', firstBooking.id);

			// Check if booking was actually stored
			const allBookings = await getUserBookings(testUser1.id);
			console.log('All user1 bookings after first create:', allBookings.length);

			console.log('Attempting to create conflicting booking for user2...');
			await expect(createBooking(testUser2.id, 'laundry', startTime, endTime)).rejects.toThrow(
				'Den valda tiden är redan bokad'
			);
		});
	});

	describe('cancelBooking', () => {
		it('should cancel an existing booking', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const booking = await createBooking(testUser1.id, 'laundry', startTime, endTime);

			const result = await cancelBooking(booking.id);
			expect(result).toBe(true);

			const cancelledBooking = await getBookingById(booking.id);
			expect(cancelledBooking).toBeNull();
		});

		it('should return false for non-existent booking', async () => {
			const result = await cancelBooking('non-existent-id');
			expect(result).toBe(false);
		});
	});

	describe('getBookings', () => {
		it('should return bookings for specific type and month', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			// create bookings in June 2024 using direct insert to avoid date validation
			const booking1Start = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const booking1End = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'laundry', booking1Start, booking1End);

			const booking2Start = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 15, 0, 0, 0, 0);
			const booking2End = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 19, 0, 0, 0, 0);
			await insertTestBooking(testUser2.id, 'laundry', booking2Start, booking2End);

			// create a BBQ booking to ensure filtering works
			const bbqStart = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 8, 0, 0, 0, 0);
			const bbqEnd = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 20, 0, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'bbq', bbqStart, bbqEnd);

			const bookings = await getBookings('laundry', 2024, 6);
			expect(bookings).toHaveLength(2);
			expect(bookings.every((b) => b.bookingType === 'laundry')).toBe(true);
		});

		it('should return empty array for month with no bookings', async () => {
			const bookings = await getBookings('laundry', 2024, 12);
			expect(bookings).toHaveLength(0);
		});
	});

	describe('getApartmentBookings', () => {
		it('should return bookings for a specific apartment', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startDateTime = new ZonedDateTime(2024, 6, 1, STOCKHOLM_TZ, 0, 0, 0, 0, 0);
			const endDateTime = new ZonedDateTime(2024, 6, 30, STOCKHOLM_TZ, 23, 59, 59, 999, 0);

			// create bookings for user1 using direct insert to avoid future date validation
			const booking1Start = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const booking1End = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'laundry', booking1Start, booking1End);

			const booking2Start = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 8, 0, 0, 0, 0);
			const booking2End = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 20, 0, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'bbq', booking2Start, booking2End);

			// create booking for user2 (should not be included)
			const booking3Start = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 15, 0, 0, 0, 0);
			const booking3End = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 19, 0, 0, 0, 0);
			await insertTestBooking(testUser2.id, 'laundry', booking3Start, booking3End);

			const bookings = await getApartmentBookings('A1101', startDateTime, endDateTime);
			expect(bookings).toHaveLength(2);
			expect(bookings.every((b) => b.userId === testUser1.id)).toBe(true);
		});

		it('should throw error for non-existent apartment', async () => {
			const startDateTime = new ZonedDateTime(2024, 6, 1, STOCKHOLM_TZ, 0, 0, 0, 0, 0);
			const endDateTime = new ZonedDateTime(2024, 6, 30, STOCKHOLM_TZ, 23, 59, 59, 999, 0);

			await expect(getApartmentBookings('Z9999', startDateTime, endDateTime)).rejects.toThrow(
				'Apartment not found'
			);
		});
	});

	describe('isTimeSlotAvailable', () => {
		it('should return true for available time slot', async () => {
			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const available = await isTimeSlotAvailable('laundry', startTime, endTime);
			expect(available).toBe(true);
		});

		it('should return false for occupied time slot', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await createBooking(testUser1.id, 'laundry', startTime, endTime);

			const available = await isTimeSlotAvailable('laundry', startTime, endTime);
			expect(available).toBe(false);
		});

		it('should return true when excluding the booking owner', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await createBooking(testUser1.id, 'laundry', startTime, endTime);

			const available = await isTimeSlotAvailable('laundry', startTime, endTime, testUser1.id);
			expect(available).toBe(true);
		});
	});

	describe('getUserFutureBookings', () => {
		it('should return only future bookings', async () => {
			vi.setSystemTime(new Date(2024, 5, 15, 12, 0)); // June 15, 2024, 12:00

			// create past booking using direct database insert
			const pastStart = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const pastEnd = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 11, 0, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'laundry', pastStart, pastEnd);

			// create future bookings using createBooking (which validates dates)
			const future1Start = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const future1End = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 11, 0, 0, 0, 0);
			await createBooking(testUser1.id, 'laundry', future1Start, future1End);

			const future2Start = new ZonedDateTime(2024, 6, 25, STOCKHOLM_TZ, 8, 0, 0, 0, 0);
			const future2End = new ZonedDateTime(2024, 6, 25, STOCKHOLM_TZ, 20, 0, 0, 0, 0);
			await createBooking(testUser1.id, 'bbq', future2Start, future2End);

			const futureBookings = await getUserFutureBookings(testUser1.id);
			expect(futureBookings).toHaveLength(2);
			expect(futureBookings.every((b) => b.startTime > new Date())).toBe(true);
		});
	});

	describe('formatBookingTime', () => {
		it('should format booking time correctly', () => {
			const booking = {
				id: 'test-id',
				userId: testUser1.id,
				bookingType: 'laundry' as const,
				startTime: new Date(2024, 5, 15, 7, 0), // June 15, 2024, 07:00
				endTime: new Date(2024, 5, 15, 11, 0), // June 15, 2024, 11:00
				createdAt: new Date()
			};

			const formatted = formatBookingTime(booking);
			expect(formatted).toMatch(/2024-06-15 07:00-11:00/);
		});
	});

	describe('Edge cases', () => {
		it('should handle booking exactly at current time', async () => {
			const now = new Date(2024, 5, 15, 7, 0);
			vi.setSystemTime(now);

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await expect(createBooking(testUser1.id, 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should handle different booking types independently', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const timeSlot = {
				start: new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 8, 0, 0, 0, 0),
				end: new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 20, 0, 0, 0, 0)
			};

			await createBooking(testUser1.id, 'laundry', timeSlot.start, timeSlot.end);
			await createBooking(testUser2.id, 'bbq', timeSlot.start, timeSlot.end);

			const laundryBookings = await getBookings('laundry', 2024, 6);
			const bbqBookings = await getBookings('bbq', 2024, 6);

			expect(laundryBookings).toHaveLength(1);
			expect(bbqBookings).toHaveLength(1);
		});
	});
});
