import type { TypedPocketBase } from '$lib/pocketbase-types';
import { getReservations } from '$lib/pocketbase';

import type { NestedReservationMap } from './types';
import { parsePocketBaseDateTime } from './helpers';
import { toCalendarDate, toTime } from '@internationalized/date';

export async function loadData(
	pb: TypedPocketBase,
	apartment?: string,
	fetchImplementation?: typeof fetch
) {
	const reservations = await getReservations(pb, fetchImplementation);
	const nestedReservationsMap: NestedReservationMap = reservations.reduce((acc, reservation) => {
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
	}, {} as NestedReservationMap);

	const reservation = reservations.find(
		(reservation) => apartment && apartment === reservation.expand?.apartment.apartment
	);

	const meta = {
		title: 'Tvättstuga',
		description: 'Boka tider i vår tvättstuga'
	};

	return {
		reservation,
		reservations: nestedReservationsMap,
		meta
	};
}
