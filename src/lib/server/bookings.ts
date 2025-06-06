import { encodeBase32LowerCase } from '@oslojs/encoding';
import { and, eq, gte, lt } from 'drizzle-orm';
import { CalendarDateTime } from '@internationalized/date';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export const timezone = 'Europe/Stockholm' as const;

export type Booking = typeof table.booking.$inferSelect;
export type BookingType = 'laundry' | 'bbq';

export function generateBookingId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}

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
export async function createBooking(
	userId: string,
	bookingType: BookingType,
	startTime: CalendarDateTime,
	endTime: CalendarDateTime
): Promise<Booking> {
	const startDate = startTime.toDate(timezone);
	const endDate = endTime.toDate(timezone);
	const now = new Date();

	if (startDate <= now) {
		throw new Error('Bokningar kan endast göras för framtida tidpunkter');
	}

	const conflictingBooking = await getBookingInTimeSlot(bookingType, startDate, endDate);
	if (conflictingBooking && conflictingBooking.userId !== userId) {
		throw new Error('Den valda tiden är redan bokad');
	}

	const existingBookings = await getFutureBookingsPerUser(userId, bookingType);
	if (existingBookings) {
		for (const existingBooking of existingBookings) {
			await cancelBooking(existingBooking.id);
		}
	}

	const bookingId = generateBookingId();
	const booking = await db
		.insert(table.booking)
		.values({
			id: bookingId,
			userId,
			bookingType,
			startTime: startDate,
			endTime: endDate,
			createdAt: now
		})
		.returning();

	return booking[0];
}

/**
 * Get all bookings for a specific type, year and month
 */
export async function getBookingsPerMonth(
	bookingType: BookingType,
	year: number,
	month: number
): Promise<Array<Booking>> {
	const startOfMonth = new CalendarDateTime(year, month, 1, 0, 0, 0, 0);
	const endOfMonth = startOfMonth.add({ months: 1 });

	return await db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.startTime, startOfMonth.toDate(timezone)),
				lt(table.booking.startTime, endOfMonth.toDate(timezone))
			)
		)
		.orderBy(table.booking.startTime);
}

/**
 * Get bookings for a specific type and user with a limit
 */
export async function getBookingsPerUser(
	userId: string,
	bookingType: BookingType,
	limit: number
): Promise<Array<Booking>> {
	return await db
		.select()
		.from(table.booking)
		.where(and(eq(table.booking.userId, userId), eq(table.booking.bookingType, bookingType)))
		.orderBy(table.booking.startTime)
		.limit(limit);
}

export async function getFutureBookingsPerUser(
	userId: string,
	bookingType: BookingType
): Promise<Array<Booking> | null> {
	const now = new Date();
	const bookings = await db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.userId, userId),
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.startTime, now)
			)
		);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return bookings || null;
}

/**
 * Get booking by booking ID
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
	const [booking] = await db
		.select()
		.from(table.booking)
		.where(eq(table.booking.id, bookingId))
		.limit(1);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return booking || null;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<boolean> {
	const result = await db.delete(table.booking).where(eq(table.booking.id, bookingId));
	return result.changes > 0;
}

/**
 * Get a booking in a specific time slot
 */
async function getBookingInTimeSlot(
	bookingType: BookingType,
	startTime: Date,
	endTime: Date
): Promise<Booking | null> {
	const [booking] = await db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				lt(table.booking.startTime, endTime),
				gte(table.booking.endTime, startTime)
			)
		)
		.limit(1);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return booking || null;
}
