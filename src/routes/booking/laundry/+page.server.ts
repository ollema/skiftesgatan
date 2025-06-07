import { fail, redirect } from '@sveltejs/kit';
import { CalendarDateTime } from '@internationalized/date';
import {
	LAUNDRY_SLOTS,
	cancelBooking,
	createBooking,
	getBookingById,
	getBookingsPerMonth,
	timezone
} from '$lib/server/bookings';
import { route } from '$lib/routes';

export const load = (event) => {
	if (event.locals.session === null || event.locals.user === null) {
		redirect(302, route('/auth/sign-in'));
	}

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

	const bookings = getBookingsPerMonth('laundry', currentYear, currentMonth);

	return {
		user: event.locals.user,
		bookings,
		currentYear,
		currentMonth,
		laundrySlots: LAUNDRY_SLOTS
	};
};

export const actions = {
	create: async (event) => {
		if (event.locals.session === null || event.locals.user === null) {
			return fail(401, {
				create: {
					message: 'Inte autentiserad'
				}
			});
		}

		const formData = await event.request.formData();
		const dateStr = formData.get('date');
		const slotStr = formData.get('slot');

		if (typeof dateStr !== 'string' || typeof slotStr !== 'string') {
			return fail(400, {
				create: {
					message: 'Ogiltiga eller saknade fält'
				}
			});
		}

		if (!dateStr || !slotStr) {
			return fail(400, {
				create: {
					message: 'Datum och tid måste anges'
				}
			});
		}

		const dateParts = dateStr.split('-');
		if (dateParts.length !== 3) {
			return fail(400, {
				create: {
					message: 'Ogiltigt datumformat'
				}
			});
		}

		const year = parseInt(dateParts[0]);
		const month = parseInt(dateParts[1]);
		const day = parseInt(dateParts[2]);

		if (isNaN(year) || isNaN(month) || isNaN(day)) {
			return fail(400, {
				create: {
					message: 'Ogiltigt datum'
				}
			});
		}

		const slotIndex = parseInt(slotStr);
		if (isNaN(slotIndex) || slotIndex < 0 || slotIndex >= LAUNDRY_SLOTS.length) {
			return fail(400, {
				create: {
					message: 'Ogiltigt tidsintervall'
				}
			});
		}

		const slot = LAUNDRY_SLOTS[slotIndex];

		const startTime = new CalendarDateTime(year, month, day, slot.start, 0, 0, 0);
		const endTime = new CalendarDateTime(year, month, day, slot.end, 0, 0, 0);

		const now = new Date();
		const startDate = startTime.toDate(timezone);

		if (startDate <= now) {
			return fail(400, {
				create: {
					message: 'Bokningar kan endast göras för framtida tidpunkter'
				}
			});
		}

		try {
			const booking = createBooking(event.locals.user.id, 'laundry', startTime, endTime);

			return {
				create: {
					message: 'Bokning skapad framgångsrikt',
					booking: booking
				}
			};
		} catch (error) {
			return fail(400, {
				create: {
					message: error instanceof Error ? error.message : 'Ett fel uppstod vid bokning'
				}
			});
		}
	},

	cancel: async (event) => {
		if (event.locals.session === null || event.locals.user === null) {
			return fail(401, {
				cancel: {
					message: 'Inte autentiserad'
				}
			});
		}

		const formData = await event.request.formData();
		const bookingId = formData.get('bookingId');

		if (typeof bookingId !== 'string' || !bookingId) {
			return fail(400, {
				cancel: {
					message: 'Ogiltigt boknings-ID'
				}
			});
		}

		const booking = getBookingById(bookingId);
		if (!booking) {
			return fail(404, {
				cancel: {
					message: 'Bokningen hittades inte'
				}
			});
		}

		if (booking.userId !== event.locals.user.id) {
			return fail(403, {
				cancel: {
					message: 'Du har inte behörighet att avboka denna bokning'
				}
			});
		}

		try {
			const success = cancelBooking(bookingId);

			if (success) {
				return {
					cancel: {
						message: 'Bokning avbokad framgångsrikt'
					}
				};
			} else {
				return fail(400, {
					cancel: {
						message: 'Kunde inte avboka bokningen'
					}
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			return fail(500, {
				cancel: {
					message: 'Ett fel uppstod vid avbokning'
				}
			});
		}
	}
};
