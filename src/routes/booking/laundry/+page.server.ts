import { fail, redirect } from '@sveltejs/kit';
import { CalendarDateTime, parseDate, parseDateTime } from '@internationalized/date';
import { LAUNDRY_SLOTS } from '$lib/constants/bookings';
import { cancelBooking, createBooking, getBookingById, getBookings } from '$lib/server/bookings';
import { now } from '$lib/datetime';
import { route } from '$lib/routes';

export const load = (event) => {
	event.depends('bookings:laundry');

	if (event.locals.session === null || event.locals.user === null) {
		redirect(302, route('/auth/sign-in'));
	}

	const today = parseDateTime(now());

	const startDate = today.subtract({ days: 1 });
	const endDate = today.add({ months: 1, days: 1 });

	const bookings = getBookings('laundry', startDate, endDate);

	return {
		user: event.locals.user,
		today: parseDate(today.toString().split('T')[0]),
		bookings
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

		const startTime = new CalendarDateTime(year, month, day, slot.start, 0, 0);
		const endTime = new CalendarDateTime(year, month, day, slot.end, 0, 0);

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
