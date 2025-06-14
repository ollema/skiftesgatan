import type { CalendarDateTime } from '@internationalized/date';

export const BOOKING_TYPES = ['laundry', 'bbq'] as const;

export const LAUNDRY_SLOTS = [
	{ start: 7, end: 11, label: '07-11' },
	{ start: 11, end: 15, label: '11-15' },
	{ start: 15, end: 19, label: '15-19' },
	{ start: 19, end: 22, label: '19-22' }
] as const;

export const BBQ_SLOT = { start: 8, end: 20, label: '08-20' } as const;

export type BookingType = (typeof BOOKING_TYPES)[number];
export type LaundrySlot = (typeof LAUNDRY_SLOTS)[number];
export type BBQSlot = typeof BBQ_SLOT;
export type TimeSlot = LaundrySlot | BBQSlot;

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
export type BBQSlotIndex = 0;

export type LaundryBookingGrid = Record<
	string,
	[BookingWithUser | null, BookingWithUser | null, BookingWithUser | null, BookingWithUser | null]
>;
export type BBQBookingGrid = Record<string, [BookingWithUser | null]>;

export type BookingGrid<T extends BookingType> = T extends 'laundry'
	? LaundryBookingGrid
	: BBQBookingGrid;

export type BookingsForDate<T extends BookingType> = T extends 'laundry'
	? [BookingWithUser | null, BookingWithUser | null, BookingWithUser | null, BookingWithUser | null]
	: [BookingWithUser | null];

export const BOOKING_CONFIG = {
	laundry: {
		slots: LAUNDRY_SLOTS,
		calendarLabel: 'Tvättstugebokningar',
		bookingTerm: 'tvättid',
		facilityTerm: 'tvättstuga',
		invalidationKey: 'bookings:laundry' as const,
		sseEndpoint: '/api/sse/bookings/laundry' as const,
		sseEventName: 'laundry-bookings-updated' as const
	},
	bbq: {
		slots: [BBQ_SLOT],
		calendarLabel: 'Grillbokningar',
		bookingTerm: 'grill',
		facilityTerm: 'grill',
		invalidationKey: 'bookings:bbq' as const,
		sseEndpoint: '/api/sse/bookings/bbq' as const,
		sseEventName: 'bbq-bookings-updated' as const
	}
} as const satisfies Record<
	BookingType,
	{
		slots: ReadonlyArray<{ start: number; end: number; label: string }>;
		calendarLabel: string;
		bookingTerm: string;
		facilityTerm: string;
		invalidationKey: string;
		sseEndpoint: string;
		sseEventName: string;
	}
>;

export type BookingConfig<T extends BookingType> = (typeof BOOKING_CONFIG)[T];
