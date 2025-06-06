import { and, eq, gt, gte, lt } from 'drizzle-orm';
import { CalendarDateTime } from '@internationalized/date';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth/utils';

export const timezone = 'Europe/Stockholm' as const;

export type Booking = typeof table.booking.$inferSelect;
export type BookingWithUser = {
	id: string;
	userId: string;
	bookingType: BookingType;
	startTime: Date;
	endTime: Date;
	createdAt: Date;
	apartment: string;
};
export type BookingType = 'laundry' | 'bbq';

export const LAUNDRY_SLOTS = [
	{ start: 7, end: 11, label: '07:00-11:00' },
	{ start: 11, end: 15, label: '11:00-15:00' },
	{ start: 15, end: 19, label: '15:00-19:00' },
	{ start: 19, end: 22, label: '19:00-22:00' }
] as const;

export const BBQ_SLOT = { start: 8, end: 20, label: '08:00-20:00' } as const;

/**
 * Create booking - cancels any existing future bookings and creates new one
 */
export function createBooking(
	userId: string,
	bookingType: BookingType,
	startTime: CalendarDateTime,
	endTime: CalendarDateTime
): Booking {
	const startDate = startTime.toDate(timezone);
	const endDate = endTime.toDate(timezone);
	const now = new Date();

	if (startDate >= endDate) {
		throw new Error('Start time must be before end time');
	}

	if (startDate <= now) {
		throw new Error('Bokningar kan endast göras för framtida tidpunkter');
	}

	const conflictingBooking = getBookingInTimeSlot(bookingType, startDate, endDate);
	if (conflictingBooking && conflictingBooking.userId !== userId) {
		throw new Error('Den valda tiden är redan bokad');
	}

	const existingBookings = getFutureBookingsPerUser(userId, bookingType);
	if (existingBookings) {
		for (const existingBooking of existingBookings) {
			cancelBooking(existingBooking.id);
		}
	}

	const bookingId = generateId();
	const booking = db
		.insert(table.booking)
		.values({
			id: bookingId,
			userId,
			bookingType,
			startTime: startDate,
			endTime: endDate,
			createdAt: now
		})
		.returning()
		.all();

	return booking[0];
}

/**
 * Get all bookings for a specific type, year and month
 */
export function getBookingsPerMonth(
	bookingType: BookingType,
	year: number,
	month: number
): Array<BookingWithUser> {
	const startOfMonth = new CalendarDateTime(year, month, 1, 0, 0, 0, 0);
	const endOfMonth = startOfMonth.add({ months: 1 });

	return db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			startTime: table.booking.startTime,
			endTime: table.booking.endTime,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.startTime, startOfMonth.toDate(timezone)),
				lt(table.booking.startTime, endOfMonth.toDate(timezone))
			)
		)
		.orderBy(table.booking.startTime)
		.all();
}

/**
 * Get bookings for a specific type and user with a limit
 */
export function getBookingsPerUser(
	userId: string,
	bookingType: BookingType,
	limit: number
): Array<BookingWithUser> {
	return db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			startTime: table.booking.startTime,
			endTime: table.booking.endTime,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(and(eq(table.booking.userId, userId), eq(table.booking.bookingType, bookingType)))
		.orderBy(table.booking.startTime)
		.limit(limit)
		.all();
}

export function getFutureBookingsPerUser(
	userId: string,
	bookingType: BookingType
): Array<BookingWithUser> | null {
	const now = new Date();
	const bookings = db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			startTime: table.booking.startTime,
			endTime: table.booking.endTime,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(
			and(
				eq(table.booking.userId, userId),
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.startTime, now)
			)
		)
		.all();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return bookings || null;
}

/**
 * Get booking by booking ID
 */
export function getBookingById(bookingId: string): Booking | null {
	const booking = db.select().from(table.booking).where(eq(table.booking.id, bookingId)).get();

	return booking || null;
}

/**
 * Cancel a booking
 */
export function cancelBooking(bookingId: string): boolean {
	const result = db.delete(table.booking).where(eq(table.booking.id, bookingId)).run();
	return result.changes > 0;
}

/**
 * Get a booking in a specific time slot
 */
function getBookingInTimeSlot(
	bookingType: BookingType,
	startTime: Date,
	endTime: Date
): Booking | null {
	const booking = db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				lt(table.booking.startTime, endTime),
				gt(table.booking.endTime, startTime)
			)
		)
		.get();

	return booking || null;
}
