import { encodeBase32LowerCase } from '@oslojs/encoding';
import { and, eq, gte, lt, lte } from 'drizzle-orm';
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

// MAIN EXTERNAL API FUNCTIONS

/**
 * Get all bookings for a specific type and month
 */
export async function getBookings(
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
 * Get bookings for a specific apartment within a time range
 */
export async function getApartmentBookings(
	apartment: string,
	startDateTime: CalendarDateTime,
	endDateTime: CalendarDateTime
): Promise<Array<Booking>> {
	const user = await db
		.select()
		.from(table.user)
		.where(eq(table.user.apartment, apartment))
		.limit(1);

	if (!user[0]) {
		throw new Error('Apartment not found');
	}

	return await db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.userId, user[0].id),
				gte(table.booking.startTime, startDateTime.toDate(timezone)),
				lte(table.booking.startTime, endDateTime.toDate(timezone))
			)
		)
		.orderBy(table.booking.startTime);
}

/**
 * Smart booking function - cancels existing future booking and creates new one
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

	// cancel any existing future booking of this type for this user (smart booking)
	const existingBooking = await getUserFutureBooking(userId, bookingType);
	if (existingBooking) {
		await cancelBooking(existingBooking.id);
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
 * Cancel a booking - allowed at any time, even if ongoing
 */
export async function cancelBooking(bookingId: string): Promise<boolean> {
	const result = await db.delete(table.booking).where(eq(table.booking.id, bookingId));
	return result.changes > 0;
}

// HELPER FUNCTIONS

async function getUserFutureBooking(
	userId: string,
	bookingType: BookingType
): Promise<Booking | null> {
	const now = new Date();
	const [booking] = await db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.userId, userId),
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.startTime, now)
			)
		)
		.limit(1);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return booking || null;
}

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

// UTILITY FUNCTIONS

export async function getUserBookings(userId: string): Promise<Array<Booking>> {
	return await db
		.select()
		.from(table.booking)
		.where(eq(table.booking.userId, userId))
		.orderBy(table.booking.startTime);
}

export async function getUserFutureBookings(userId: string): Promise<Array<Booking>> {
	const now = new Date();
	return await db
		.select()
		.from(table.booking)
		.where(and(eq(table.booking.userId, userId), gte(table.booking.startTime, now)))
		.orderBy(table.booking.startTime);
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
	const [booking] = await db
		.select()
		.from(table.booking)
		.where(eq(table.booking.id, bookingId))
		.limit(1);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return booking || null;
}

export function formatBookingTime(booking: Booking): string {
	const start = new Date(booking.startTime);
	const end = new Date(booking.endTime);

	const dateStr = start.toLocaleDateString('sv-SE');
	const startTime = start.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
	const endTime = end.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

	return `${dateStr} ${startTime}-${endTime}`;
}

export async function isTimeSlotAvailable(
	bookingType: BookingType,
	startTime: CalendarDateTime,
	endTime: CalendarDateTime,
	excludeUserId?: string
): Promise<boolean> {
	const startDate = startTime.toDate(timezone);
	const endDate = endTime.toDate(timezone);

	const conflictingBooking = await getBookingInTimeSlot(bookingType, startDate, endDate);

	if (!conflictingBooking) return true;
	if (excludeUserId && conflictingBooking.userId === excludeUserId) return true;

	return false;
}
