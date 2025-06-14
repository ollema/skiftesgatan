import type { CalendarDateTime } from '@internationalized/date';
import type { BOOKING_TYPES } from '$lib/constants/bookings';

export type BookingType = (typeof BOOKING_TYPES)[number];

export type Booking = {
	id: string;
	userId: string;
	bookingType: BookingType;
	start: string;
	end: string;
	createdAt: string;
};

export type BookingWithUser = {
	id: string;
	userId: string;
	bookingType: BookingType;
	start: CalendarDateTime;
	end: CalendarDateTime;
	createdAt: CalendarDateTime;
	apartment: string;
};

export type LaundrySlotIndex = 0 | 1 | 2 | 3;
export type BBQSlotIndex = 0; // BBQ only has one slot

export type LaundryBookingGrid = Record<
	string,
	[BookingWithUser | null, BookingWithUser | null, BookingWithUser | null, BookingWithUser | null]
>;
export type BBQBookingGrid = Record<string, [BookingWithUser | null]>;

export type BookingGrid<T extends BookingType> = T extends 'laundry'
	? LaundryBookingGrid
	: BBQBookingGrid;
