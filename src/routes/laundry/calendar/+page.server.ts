import {
	getReservations,
	maybeGetReservationForApartment,
	deleteReservation,
	createReservation
} from '$lib/server/reservations';
import type { ReservationsResponse } from '$lib/pocketbase-types';
import { ClientResponseError } from 'pocketbase';
import { formSchema } from './schema';
import type { NestedReservationMap } from './types';
import { parsePocketBaseDateTime } from './helpers';
import { toCalendarDate, toTime } from '@internationalized/date';

export const load = async ({ locals, depends }) => {
	depends('laundry:calendar');

	const reservations: NestedReservationMap = (await getReservations(locals.pb)).reduce(
		(acc, reservation) => {
			const day = toCalendarDate(parsePocketBaseDateTime(reservation.start)).toString();
			const startTime = toTime(parsePocketBaseDateTime(reservation.start)).toString();
			const endTime = toTime(parsePocketBaseDateTime(reservation.end)).toString();

			if (!acc[day]) {
				acc[day] = {};
			}

			acc[day][startTime] = {
				apartment: reservation.expand?.apartment.apartment || '',
				start: startTime,
				end: endTime
			};

			return acc;
		},
		{} as NestedReservationMap
	);

	return {
		reservations: reservations,
		apartment: locals.apartment?.apartment
	};
};

export const actions = {
	reserve: async ({ request, locals }) => {
		let reservation: ReservationsResponse | undefined;
		if (locals.apartment) {
			reservation = await maybeGetReservationForApartment(locals.pb, locals.apartment.apartment);
			if (reservation) {
				try {
					await deleteReservation(locals.pb, reservation.id);
				} catch (e) {
					if (e instanceof ClientResponseError) {
						console.log('client error:', e.message);
						return;
					}
				}
			}
		} else {
			return;
		}

		const data = await request.formData();
		const result = formSchema.safeParse(Object.fromEntries(data));

		if (!result.success) {
			console.log('error', result.error);
		} else {
			const { start, end } = result.data;
			try {
				await createReservation(locals.pb, start, end, locals.apartment.id);
			} catch (e) {
				if (e instanceof ClientResponseError) {
					console.log('client error:', e.message);
				} else {
					console.log('unknown error:', e);
				}
			}
		}
	},
	release: async ({ locals }) => {
		let reservation: ReservationsResponse | undefined;
		if (locals.apartment) {
			reservation = await maybeGetReservationForApartment(locals.pb, locals.apartment.apartment);
			if (reservation) {
				try {
					await deleteReservation(locals.pb, reservation.id);
				} catch (e) {
					if (e instanceof ClientResponseError) {
						console.log('client error:', e.message);
						return;
					}
				}
			}
		}
	}
};
