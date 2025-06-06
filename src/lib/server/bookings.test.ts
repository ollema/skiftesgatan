import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarDateTime } from '@internationalized/date';
import {
	cancelBooking,
	createBooking,
	getBookingById,
	getBookingsPerMonth,
	getBookingsPerUser,
	getFutureBookingsPerUser,
	timezone
} from './bookings';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

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

async function insertTestBooking(
	userId: string,
	bookingType: 'laundry' | 'bbq',
	startTime: CalendarDateTime,
	endTime: CalendarDateTime
) {
	const startDate = startTime.toDate(timezone);
	const endDate = endTime.toDate(timezone);
	const id = 'test-' + Math.random().toString(36).substring(2);

	await db.insert(table.booking).values({
		id,
		userId,
		bookingType,
		startTime: startDate,
		endTime: endDate,
		createdAt: new Date()
	});

	return id;
}

describe('Debug date precision', () => {
	it('should show date precision behavior', async () => {
		vi.setSystemTime(new Date(2024, 5, 10));

		const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
		const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

		console.log('Original CalendarDateTime dates:');
		console.log('Start:', startTime.toDate(timezone).toISOString());
		console.log('End:', endTime.toDate(timezone).toISOString());

		const booking = await createBooking(testUser1.id, 'laundry', startTime, endTime);

		console.log('Stored in database:');
		console.log('Start:', booking.startTime.toISOString());
		console.log('End:', booking.endTime.toISOString());

		console.log(
			'Dates match exactly:',
			booking.startTime.getTime() === startTime.toDate(timezone).getTime() &&
				booking.endTime.getTime() === endTime.toDate(timezone).getTime()
		);
	});
});

describe('Booking Management', () => {
	describe('createBooking', () => {
		it('should create a new booking successfully', async () => {
			const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const booking = await createBooking(testUser1.id, 'laundry', startTime, endTime);

			expect(booking).toBeDefined();
			expect(booking.userId).toBe(testUser1.id);
			expect(booking.bookingType).toBe('laundry');
			expect(booking.startTime.getTime()).toBe(startTime.toDate(timezone).getTime());
			expect(booking.endTime.getTime()).toBe(endTime.toDate(timezone).getTime());
		});

		it('should reject booking in the past', async () => {
			const startTime = new CalendarDateTime(2024, 6, 10, 7, 0, 0, 0);
			const endTime = new CalendarDateTime(2024, 6, 10, 11, 0, 0, 0);

			vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024

			await expect(createBooking(testUser1.id, 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should implement smart booking by cancelling existing future booking', async () => {
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const firstStart = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const firstEnd = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

			const firstBooking = await createBooking(testUser1.id, 'laundry', firstStart, firstEnd);
			expect(firstBooking).toBeDefined();

			const secondStart = new CalendarDateTime(2024, 6, 16, 15, 0, 0, 0);
			const secondEnd = new CalendarDateTime(2024, 6, 16, 19, 0, 0, 0);

			const secondBooking = await createBooking(testUser1.id, 'laundry', secondStart, secondEnd);

			const oldBooking = await getBookingById(firstBooking.id);
			expect(oldBooking).toBeNull();

			expect(secondBooking.startTime.getTime()).toBe(secondStart.toDate(timezone).getTime());
		});

		it('should allow multiple bookings of different types', async () => {
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const laundryStart = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const laundryEnd = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

			const bbqStart = new CalendarDateTime(2024, 6, 16, 8, 0, 0, 0);
			const bbqEnd = new CalendarDateTime(2024, 6, 16, 20, 0, 0, 0);

			const laundryBooking = await createBooking(testUser1.id, 'laundry', laundryStart, laundryEnd);
			const bbqBooking = await createBooking(testUser1.id, 'bbq', bbqStart, bbqEnd);

			expect(laundryBooking).toBeDefined();
			expect(bbqBooking).toBeDefined();

			const userLaundryBookings = await getBookingsPerUser(testUser1.id, 'laundry', 10);
			const userBbqBookings = await getBookingsPerUser(testUser1.id, 'bbq', 10);
			expect(userLaundryBookings).toHaveLength(1);
			expect(userBbqBookings).toHaveLength(1);
		});

		it('should reject conflicting bookings from different users', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

			console.log('Creating first booking for user1...');
			const firstBooking = await createBooking(testUser1.id, 'laundry', startTime, endTime);
			console.log('First booking created:', firstBooking.id);

			const allBookings = await getBookingsPerUser(testUser1.id, 'laundry', 10);
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

			const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

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

			const booking1Start = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const booking1End = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'laundry', booking1Start, booking1End);

			const booking2Start = new CalendarDateTime(2024, 6, 20, 15, 0, 0, 0);
			const booking2End = new CalendarDateTime(2024, 6, 20, 19, 0, 0, 0);
			await insertTestBooking(testUser2.id, 'laundry', booking2Start, booking2End);

			const bbqStart = new CalendarDateTime(2024, 6, 15, 8, 0, 0, 0);
			const bbqEnd = new CalendarDateTime(2024, 6, 15, 20, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'bbq', bbqStart, bbqEnd);

			const bookings = await getBookingsPerMonth('laundry', 2024, 6);
			expect(bookings).toHaveLength(2);
			expect(bookings.every((b) => b.bookingType === 'laundry')).toBe(true);
		});

		it('should return empty array for month with no bookings', async () => {
			const bookings = await getBookingsPerMonth('laundry', 2024, 12);
			expect(bookings).toHaveLength(0);
		});
	});

	describe('getApartmentBookings', () => {
		it('should return bookings for a specific apartment', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const booking1Start = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const booking1End = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'laundry', booking1Start, booking1End);

			const booking2Start = new CalendarDateTime(2024, 6, 20, 8, 0, 0, 0);
			const booking2End = new CalendarDateTime(2024, 6, 20, 20, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'bbq', booking2Start, booking2End);

			const booking3Start = new CalendarDateTime(2024, 6, 15, 15, 0, 0, 0);
			const booking3End = new CalendarDateTime(2024, 6, 15, 19, 0, 0, 0);
			await insertTestBooking(testUser2.id, 'laundry', booking3Start, booking3End);

			const laundryBookings = await getBookingsPerUser(testUser1.id, 'laundry', 10);
			const bbqBookings = await getBookingsPerUser(testUser1.id, 'bbq', 10);
			expect(laundryBookings).toHaveLength(1);
			expect(bbqBookings).toHaveLength(1);
			expect(laundryBookings[0].userId).toBe(testUser1.id);
			expect(bbqBookings[0].userId).toBe(testUser1.id);
		});

		it('should return empty array for non-existent user', async () => {
			const bookings = await getBookingsPerUser('user3', 'laundry', 10);
			expect(bookings).toHaveLength(0);
		});
	});

	describe('getFutureBookingsPerUser', () => {
		it('should return only future bookings', async () => {
			vi.setSystemTime(new Date(2024, 5, 15, 12, 0)); // June 15, 2024, 12:00

			const pastStart = new CalendarDateTime(2024, 6, 10, 7, 0, 0, 0);
			const pastEnd = new CalendarDateTime(2024, 6, 10, 11, 0, 0, 0);
			await insertTestBooking(testUser1.id, 'laundry', pastStart, pastEnd);

			const future1Start = new CalendarDateTime(2024, 6, 20, 7, 0, 0, 0);
			const future1End = new CalendarDateTime(2024, 6, 20, 11, 0, 0, 0);
			await createBooking(testUser1.id, 'laundry', future1Start, future1End);

			const future2Start = new CalendarDateTime(2024, 6, 25, 8, 0, 0, 0);
			const future2End = new CalendarDateTime(2024, 6, 25, 20, 0, 0, 0);
			await createBooking(testUser1.id, 'bbq', future2Start, future2End);

			const futureLaundryBookings = await getFutureBookingsPerUser(testUser1.id, 'laundry');
			const futureBbqBookings = await getFutureBookingsPerUser(testUser1.id, 'bbq');
			expect(futureLaundryBookings).toHaveLength(1);
			expect(futureBbqBookings).toHaveLength(1);
			expect(futureLaundryBookings![0].startTime > new Date()).toBe(true);
			expect(futureBbqBookings![0].startTime > new Date()).toBe(true);
		});
	});

	describe('Edge cases', () => {
		it('should handle booking exactly at current time', async () => {
			const now = new Date(2024, 5, 15, 7, 0);
			vi.setSystemTime(now);

			const startTime = new CalendarDateTime(2024, 6, 15, 7, 0, 0, 0);
			const endTime = new CalendarDateTime(2024, 6, 15, 11, 0, 0, 0);

			await expect(createBooking(testUser1.id, 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should handle different booking types independently', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const timeSlot = {
				start: new CalendarDateTime(2024, 6, 15, 8, 0, 0, 0),
				end: new CalendarDateTime(2024, 6, 15, 20, 0, 0, 0)
			};

			await createBooking(testUser1.id, 'laundry', timeSlot.start, timeSlot.end);
			await createBooking(testUser2.id, 'bbq', timeSlot.start, timeSlot.end);

			const laundryBookings = await getBookingsPerMonth('laundry', 2024, 6);
			const bbqBookings = await getBookingsPerMonth('bbq', 2024, 6);

			expect(laundryBookings).toHaveLength(1);
			expect(bbqBookings).toHaveLength(1);
		});
	});
});
