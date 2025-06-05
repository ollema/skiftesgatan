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

// Mock the database
const mockBookings: Array<{
	id: string;
	userId: string;
	bookingType: 'laundry' | 'bbq';
	startTime: Date;
	endTime: Date;
	createdAt: Date;
}> = [];

const mockUsers: Array<{
	id: string;
	apartment: string;
	email: string;
}> = [];

// Mock drizzle DB
vi.mock('$lib/server/db', () => {
	return {
		db: {
			select: () => ({
				from: () => ({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
					where: (condition: any) => ({
						limit: (num: number) => mockBookings.slice(0, num),
						orderBy: () =>
							[...mockBookings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
					}),
					orderBy: () =>
						[...mockBookings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
				})
			}),
			insert: () => ({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				values: (values: any) => ({
					returning: () => {
						const newBooking = { ...values };
						mockBookings.push(newBooking);
						return [newBooking];
					}
				})
			}),
			delete: () => ({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
				where: (condition: any) => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unnecessary-condition
					const index = mockBookings.findIndex((b) => true); // Simplified for mock
					if (index >= 0) {
						mockBookings.splice(index, 1);
						return { changes: 1 };
					}
					return { changes: 0 };
				}
			})
		}
	};
});

// Enhanced mock with proper query handling
const createMockDb = () => {
	return {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
		select: (fields?: any) => ({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			from: (table: any) => ({
				// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
				where: (condition: any) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let filteredResults: Array<any> = [];

					// Handle user table queries
					if (table === 'user') {
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						filteredResults = mockUsers.filter(() => true); // Simplified condition matching
					} else {
						// Handle booking table queries
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						filteredResults = mockBookings.filter(() => true); // Simplified condition matching
					}

					return {
						limit: (num: number) => filteredResults.slice(0, num),
						orderBy: () =>
							[...filteredResults].sort((a, b) => {
								if ('startTime' in a && 'startTime' in b) {
									return a.startTime.getTime() - b.startTime.getTime();
								}
								return 0;
							})
					};
				},
				orderBy: () =>
					[...(table === 'user' ? mockUsers : mockBookings)].sort((a, b) => {
						if ('startTime' in a && 'startTime' in b) {
							return a.startTime.getTime() - b.startTime.getTime();
						}
						return 0;
					})
			})
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		insert: (table: any) => ({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			values: (values: any) => ({
				returning: () => {
					if (table === 'user') {
						mockUsers.push(values);
						return [values];
					} else {
						mockBookings.push(values);
						return [values];
					}
				}
			})
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		delete: (table: any) => ({
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			where: (condition: never) => {
				let index = -1;
				if (table === 'user') {
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					index = mockUsers.findIndex(() => true); // Simplified
					if (index >= 0) {
						mockUsers.splice(index, 1);
						return { changes: 1 };
					}
				} else {
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					index = mockBookings.findIndex(() => true); // Simplified
					if (index >= 0) {
						mockBookings.splice(index, 1);
						return { changes: 1 };
					}
				}
				return { changes: 0 };
			}
		})
	};
};

// Re-mock with enhanced version
vi.mock('$lib/server/db', () => ({
	db: createMockDb()
}));

describe('Booking Management', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Clear mock data
		mockBookings.length = 0;
		mockUsers.length = 0;

		// Add test users
		mockUsers.push(
			{ id: 'user1', apartment: 'A1101', email: 'user1@test.com' },
			{ id: 'user2', apartment: 'B1201', email: 'user2@test.com' }
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('createBooking', () => {
		it('should create a new booking successfully', async () => {
			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			// Set current time to before the booking
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const booking = await createBooking('user1', 'laundry', startTime, endTime);

			expect(booking).toBeDefined();
			expect(booking.userId).toBe('user1');
			expect(booking.bookingType).toBe('laundry');
			expect(mockBookings).toHaveLength(1);
		});

		it('should reject booking in the past', async () => {
			const startTime = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 10, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			// Set current time to after the booking
			vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024

			await expect(createBooking('user1', 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should implement smart booking by cancelling existing future booking', async () => {
			// Set current time
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			// Create first booking
			const firstStart = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const firstEnd = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await createBooking('user1', 'laundry', firstStart, firstEnd);
			expect(mockBookings).toHaveLength(1);

			// Create second booking of same type - should cancel first and create new
			const secondStart = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 15, 0, 0, 0, 0);
			const secondEnd = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 19, 0, 0, 0, 0);

			const secondBooking = await createBooking('user1', 'laundry', secondStart, secondEnd);

			// Should still have only 1 booking (old one cancelled, new one created)
			expect(mockBookings).toHaveLength(1);
			expect(secondBooking.startTime).toEqual(secondStart.toDate());
		});

		it('should allow multiple bookings of different types', async () => {
			vi.setSystemTime(new Date(2024, 5, 10)); // June 10, 2024

			const laundryStart = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const laundryEnd = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const bbqStart = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 8, 0, 0, 0, 0);
			const bbqEnd = new ZonedDateTime(2024, 6, 16, STOCKHOLM_TZ, 20, 0, 0, 0, 0);

			await createBooking('user1', 'laundry', laundryStart, laundryEnd);
			await createBooking('user1', 'bbq', bbqStart, bbqEnd);

			expect(mockBookings).toHaveLength(2);
		});
	});

	describe('cancelBooking', () => {
		it('should cancel an existing booking', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const booking = await createBooking('user1', 'laundry', startTime, endTime);
			expect(mockBookings).toHaveLength(1);

			const result = await cancelBooking(booking.id);
			expect(result).toBe(true);
			expect(mockBookings).toHaveLength(0);
		});

		it('should return false for non-existent booking', async () => {
			const result = await cancelBooking('non-existent-id');
			expect(result).toBe(false);
		});
	});

	describe('getBookings', () => {
		it('should return bookings for specific type and month', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			// Create bookings in June 2024
			const booking1Start = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const booking1End = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			const booking2Start = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 15, 0, 0, 0, 0);
			const booking2End = new ZonedDateTime(2024, 6, 20, STOCKHOLM_TZ, 19, 0, 0, 0, 0);

			await createBooking('user1', 'laundry', booking1Start, booking1End);
			await createBooking('user2', 'laundry', booking2Start, booking2End);

			const bookings = await getBookings('laundry', 2024, 6);
			expect(bookings).toHaveLength(2);
		});

		it('should return empty array for month with no bookings', async () => {
			const bookings = await getBookings('laundry', 2024, 12);
			expect(bookings).toHaveLength(0);
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

			// Create a booking
			await createBooking('user1', 'laundry', startTime, endTime);

			// Check if same time slot is available
			const available = await isTimeSlotAvailable('laundry', startTime, endTime);
			expect(available).toBe(false);
		});

		it('should return true when excluding the booking owner', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await createBooking('user1', 'laundry', startTime, endTime);

			const available = await isTimeSlotAvailable('laundry', startTime, endTime, 'user1');
			expect(available).toBe(true);
		});
	});

	describe('formatBookingTime', () => {
		it('should format booking time correctly', () => {
			const booking = {
				id: 'test-id',
				userId: 'user1',
				bookingType: 'laundry' as const,
				startTime: new Date(2024, 5, 15, 7, 0), // June 15, 2024, 07:00
				endTime: new Date(2024, 5, 15, 11, 0), // June 15, 2024, 11:00
				createdAt: new Date()
			};

			const formatted = formatBookingTime(booking);
			expect(formatted).toMatch(/2024-06-15 07:00-11:00/);
		});
	});

	describe('ZonedDateTime conversion utilities', () => {
		it('should convert ZonedDateTime to Date and back consistently', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const originalDate = new Date(2024, 5, 15, 7, 0);
			const zdt = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const convertedDate = zdt.toDate();

			// Dates should be equivalent (accounting for timezone)
			expect(convertedDate.getFullYear()).toBe(2024);
			expect(convertedDate.getMonth()).toBe(5); // June (0-indexed)
			expect(convertedDate.getDate()).toBe(15);
			expect(convertedDate.getHours()).toBe(7);
		});
	});

	describe('Edge cases and error handling', () => {
		it('should handle concurrent bookings gracefully', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			// First user books successfully
			await createBooking('user1', 'laundry', startTime, endTime);

			// Second user should be rejected
			await expect(createBooking('user2', 'laundry', startTime, endTime)).rejects.toThrow(
				'Den valda tiden är redan bokad'
			);
		});

		it('should handle booking exactly at current time', async () => {
			const now = new Date(2024, 5, 15, 7, 0);
			vi.setSystemTime(now);

			const startTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const endTime = new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await expect(createBooking('user1', 'laundry', startTime, endTime)).rejects.toThrow(
				'Bokningar kan endast göras för framtida tidpunkter'
			);
		});

		it('should handle different booking types independently', async () => {
			vi.setSystemTime(new Date(2024, 5, 10));

			const timeSlot = {
				start: new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 8, 0, 0, 0, 0),
				end: new ZonedDateTime(2024, 6, 15, STOCKHOLM_TZ, 20, 0, 0, 0, 0)
			};

			// Both laundry and BBQ can be booked for overlapping times
			await createBooking('user1', 'laundry', timeSlot.start, timeSlot.end);
			await createBooking('user2', 'bbq', timeSlot.start, timeSlot.end);

			expect(mockBookings).toHaveLength(2);
		});
	});

	describe('Month boundary handling', () => {
		it('should handle bookings across month boundaries correctly', async () => {
			vi.setSystemTime(new Date(2024, 5, 25)); // June 25, 2024

			// Create booking at end of June
			const juneBooking = new ZonedDateTime(2024, 6, 30, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const juneEnd = new ZonedDateTime(2024, 6, 30, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			// Create booking at start of July
			const julyBooking = new ZonedDateTime(2024, 7, 1, STOCKHOLM_TZ, 7, 0, 0, 0, 0);
			const julyEnd = new ZonedDateTime(2024, 7, 1, STOCKHOLM_TZ, 11, 0, 0, 0, 0);

			await createBooking('user1', 'laundry', juneBooking, juneEnd);
			await createBooking('user1', 'bbq', julyBooking, julyEnd);

			const juneBookings = await getBookings('laundry', 2024, 6);
			const julyBookings = await getBookings('bbq', 2024, 7);

			expect(juneBookings).toHaveLength(1);
			expect(julyBookings).toHaveLength(1);
		});
	});
});
