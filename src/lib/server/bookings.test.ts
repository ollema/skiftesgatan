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
	vi.useFakeTimers(); // TODO: is this needed? why?

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
});

describe('Booking Management', () => {
	describe('createBooking', () => {
		it('should create a new booking successfully', async () => {
			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			// set current time to before the booking
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const booking = await createBooking(testUser1.id, 'laundry', startTime, endTime);

			expect(booking).toBeDefined();
			expect(booking.userId).toBe(testUser1.id);
			expect(booking.bookingType).toBe('laundry');
			expect(booking.startTime).toEqual(startTime.toDate());
			expect(booking.endTime).toEqual(endTime.toDate());
		});

		it('should reject booking in the past', async () => {
			const startTime = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			// set current time to after the booking
			vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024

			await expect(createBooking(testUser1.id, 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should implement smart booking by cancelling existing future booking', async () => {
			// set current time
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			// create first booking
			const firstStart = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const firstEnd = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const firstBooking = await createBooking(testUser1.id, 'laundry', firstStart, firstEnd);
			expect(firstBooking).toBeDefined();

			// create second booking of same type - should cancel first and create new
			const secondStart = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 15, 0, 0, 0, 0);
			const secondEnd = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 19, 0, 0, 0, 0);

			const secondBooking = await createBooking(testUser1.id, 'laundry', secondStart, secondEnd);

			// verify first booking was cancelled
			const oldBooking = await getBookingById(firstBooking.id);
			expect(oldBooking).toBeNull();

			// verify second booking exists
			expect(secondBooking.startTime).toEqual(secondStart.toDate());
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

			// first user books successfully
			await createBooking(testUser1.id, 'laundry', startTime, endTime);

			// second user should be rejected
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

			// create bookings in June 2024
			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'laundry',
			// 	startTime: new Date(2024, 5, 15, 7, 0),
			// 	endTime: new Date(2024, 5, 15, 11, 0)
			// });

			// await seedTestBooking({
			// 	userId: testUser2.id,
			// 	bookingType: 'laundry',
			// 	startTime: new Date(2024, 5, 20, 15, 0),
			// 	endTime: new Date(2024, 5, 20, 19, 0)
			// });

			// create a BBQ booking to ensure filtering works
			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'bbq',
			// 	startTime: new Date(2024, 5, 15, 8, 0),
			// 	endTime: new Date(2024, 5, 15, 20, 0)
			// });

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

			// create bookings for user1
			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'laundry',
			// 	startTime: new Date(2024, 5, 15, 7, 0),
			// 	endTime: new Date(2024, 5, 15, 11, 0)
			// });

			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'bbq',
			// 	startTime: new Date(2024, 5, 20, 8, 0),
			// 	endTime: new Date(2024, 5, 20, 20, 0)
			// });

			// create booking for user2 (should not be included)
			// await seedTestBooking({
			// 	userId: testUser2.id,
			// 	bookingType: 'laundry',
			// 	startTime: new Date(2024, 5, 15, 15, 0),
			// 	endTime: new Date(2024, 5, 15, 19, 0)
			// });

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

			// create a booking
			await createBooking(testUser1.id, 'laundry', startTime, endTime);

			// check if same time slot is available
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

			// create past booking
			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'laundry',
			// 	startTime: new Date(2024, 5, 10, 7, 0),
			// 	endTime: new Date(2024, 5, 10, 11, 0)
			// });

			// create future bookings
			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'laundry',
			// 	startTime: new Date(2024, 5, 20, 7, 0),
			// 	endTime: new Date(2024, 5, 20, 11, 0)
			// });

			// await seedTestBooking({
			// 	userId: testUser1.id,
			// 	bookingType: 'bbq',
			// 	startTime: new Date(2024, 5, 25, 8, 0),
			// 	endTime: new Date(2024, 5, 25, 20, 0)
			// });

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

			// both laundry and BBQ can be booked for overlapping times
			await createBooking(testUser1.id, 'laundry', timeSlot.start, timeSlot.end);
			await createBooking(testUser2.id, 'bbq', timeSlot.start, timeSlot.end);

			const laundryBookings = await getBookings('laundry', 2024, 6);
			const bbqBookings = await getBookings('bbq', 2024, 6);

			expect(laundryBookings).toHaveLength(1);
			expect(bbqBookings).toHaveLength(1);
		});
	});
});
