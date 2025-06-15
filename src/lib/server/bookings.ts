import { and, eq, gt, gte, lt } from 'drizzle-orm';
import { parseDateTime } from '@internationalized/date';
import { cancelBookingNotifications, scheduleBookingNotification } from './notifications.js';
import type { CalendarDateTime } from '@internationalized/date';
import type { Booking, BookingGrid, BookingType, BookingWithUser } from '$lib/constants/bookings';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth/utils';
import { now } from '$lib/datetime';
import { LAUNDRY_SLOTS } from '$lib/constants/bookings';
import { events } from '$lib/server/db/events';

/**
 * Create booking - cancels any existing future bookings and creates new one
 */
export function createBooking(
	userId: string,
	bookingType: BookingType,
	start: CalendarDateTime,
	end: CalendarDateTime
): BookingWithUser {
	if (start.compare(end) >= 0) {
		throw new Error('Start time must be before end time');
	}

	const nowDateTime = parseDateTime(now());
	if (start.compare(nowDateTime) <= 0) {
		throw new Error('Bokningar kan endast göras för framtida tidpunkter');
	}

	const conflictingBooking = getBookingInTimeSlot(bookingType, start, end);
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
			start: start.toString(),
			end: end.toString(),
			createdAt: now()
		})
		.returning()
		.all();

	const bookingWithUser = dbBookingToApiBooking({
		...booking[0],
		apartment: '' // Will be filled by caller if needed
	});

	events.emitBookingsUpdated(bookingType);

	try {
		scheduleBookingNotification(bookingId);
	} catch (error) {
		console.error(`Failed to schedule notification for booking ${bookingId}:`, error);
	}

	return bookingWithUser;
}

/**
 * Get all bookings for a specific type within a date range as a grid
 */
export function getBookings<T extends BookingType>(
	bookingType: T,
	startDate: CalendarDateTime,
	endDate: CalendarDateTime
): BookingGrid<T> {
	const start = startDate.toString().split('.')[0];
	const end = endDate.toString().split('.')[0];

	const rawBookings = db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			start: table.booking.start,
			end: table.booking.end,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.start, start),
				lt(table.booking.start, end)
			)
		)
		.orderBy(table.booking.start)
		.all();

	const bookings = rawBookings.map(dbBookingToApiBooking);

	// Create grid structure
	const grid: Record<string, Array<BookingWithUser | null>> = {};

	// Initialize all days in range
	let currentDate = startDate;
	while (currentDate.compare(endDate) < 0) {
		const dayKey = `${currentDate.year}-${currentDate.month.toString().padStart(2, '0')}-${currentDate.day.toString().padStart(2, '0')}`;

		if (bookingType === 'laundry') {
			grid[dayKey] = [null, null, null, null] as [
				BookingWithUser | null,
				BookingWithUser | null,
				BookingWithUser | null,
				BookingWithUser | null
			];
		} else {
			grid[dayKey] = [null] as [BookingWithUser | null];
		}

		currentDate = currentDate.add({ days: 1 });
	}

	// Place bookings in their slots
	bookings.forEach((booking) => {
		const dayKey = `${booking.start.year}-${booking.start.month.toString().padStart(2, '0')}-${booking.start.day.toString().padStart(2, '0')}`;
		const slotIndex = getSlotIndex(bookingType, booking.start);

		if (slotIndex !== -1) {
			grid[dayKey][slotIndex] = booking;
		}
	});

	return grid as BookingGrid<T>;
}

/**
 * Get bookings as an array for a specific type within a date range
 */
export function getBookingsArray(
	bookingType: BookingType,
	startDate: CalendarDateTime,
	endDate: CalendarDateTime
): Array<BookingWithUser> {
	const start = startDate.toString().split('.')[0];
	const end = endDate.toString().split('.')[0];

	const rawBookings = db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			start: table.booking.start,
			end: table.booking.end,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.start, start),
				lt(table.booking.start, end)
			)
		)
		.orderBy(table.booking.start)
		.all();

	return rawBookings.map(dbBookingToApiBooking);
}

/**
 * Get bookings for a specific type and user with a limit
 */
export function getBookingsPerUser(
	userId: string,
	bookingType: BookingType,
	limit: number
): Array<BookingWithUser> {
	const rawBookings = db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			start: table.booking.start,
			end: table.booking.end,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(and(eq(table.booking.userId, userId), eq(table.booking.bookingType, bookingType)))
		.orderBy(table.booking.start)
		.limit(limit)
		.all();

	return rawBookings.map(dbBookingToApiBooking);
}

/**
 * Get all future bookings for a user (all booking types)
 */
export function getAllFutureBookingsForUser(userId: string): Array<BookingWithUser> {
	const nowStr = now();
	const rawBookings = db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			start: table.booking.start,
			end: table.booking.end,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(and(eq(table.booking.userId, userId), gte(table.booking.start, nowStr)))
		.orderBy(table.booking.start)
		.all();

	return rawBookings.map(dbBookingToApiBooking);
}

export function getFutureBookingsPerUser(
	userId: string,
	bookingType: BookingType
): Array<BookingWithUser> | null {
	const nowStr = now();
	const rawBookings = db
		.select({
			id: table.booking.id,
			userId: table.booking.userId,
			bookingType: table.booking.bookingType,
			start: table.booking.start,
			end: table.booking.end,
			createdAt: table.booking.createdAt,
			apartment: table.user.apartment
		})
		.from(table.booking)
		.innerJoin(table.user, eq(table.booking.userId, table.user.id))
		.where(
			and(
				eq(table.booking.userId, userId),
				eq(table.booking.bookingType, bookingType),
				gte(table.booking.start, nowStr)
			)
		)
		.all();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (rawBookings) {
		return rawBookings.map(dbBookingToApiBooking);
	}

	return null;
}

/**
 * Get booking by booking ID
 */
export function getBookingById(bookingId: string): Booking | null {
	const booking = db.select().from(table.booking).where(eq(table.booking.id, bookingId)).get();

	return booking || null;
}

/**
 * Get a booking in a specific time slot
 */
function getBookingInTimeSlot(
	bookingType: BookingType,
	start: CalendarDateTime,
	end: CalendarDateTime
): Booking | null {
	const startStr = start.toString();
	const endStr = end.toString();

	const booking = db
		.select()
		.from(table.booking)
		.where(
			and(
				eq(table.booking.bookingType, bookingType),
				lt(table.booking.start, endStr),
				gt(table.booking.end, startStr)
			)
		)
		.get();

	return booking || null;
}

/**
 * Cancel a booking
 */
export function cancelBooking(bookingId: string): boolean {
	const booking = db.select().from(table.booking).where(eq(table.booking.id, bookingId)).get();

	if (!booking) {
		return false;
	}

	const result = db.delete(table.booking).where(eq(table.booking.id, bookingId)).run();
	const success = result.changes > 0;

	if (success) {
		events.emitBookingsUpdated(booking.bookingType);

		try {
			cancelBookingNotifications(bookingId);
		} catch (error) {
			console.error(`Failed to cancel notifications for booking ${bookingId}:`, error);
		}
	}

	return success;
}

// Helper function to convert database booking to API booking
function dbBookingToApiBooking(dbBooking: {
	id: string;
	userId: string;
	bookingType: BookingType;
	start: string;
	end: string;
	createdAt: string;
	apartment: string;
}): BookingWithUser {
	return {
		id: dbBooking.id,
		userId: dbBooking.userId,
		bookingType: dbBooking.bookingType,
		start: parseDateTime(dbBooking.start),
		end: parseDateTime(dbBooking.end),
		createdAt: parseDateTime(dbBooking.createdAt),
		apartment: dbBooking.apartment
	};
}

// Helper function to get slot index for a booking
function getSlotIndex(bookingType: BookingType, start: CalendarDateTime): number {
	if (bookingType === 'laundry') {
		return LAUNDRY_SLOTS.findIndex((slot) => slot.start === start.hour);
	} else {
		return 0; // BBQ only has one slot
	}
}
