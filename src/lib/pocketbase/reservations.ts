import {
	type ReservationsResponse,
	type ApartmentsResponse,
	ReservationsTypeOptions
} from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';
import { ClientResponseError } from 'pocketbase';

import { pb } from './client';
import type { Apartment } from '$lib/types';

export async function getReservations(fetchImplementation?: typeof fetch) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	return await pb
		.collection(Collections.Reservations)
		.getFullList<
			ReservationsResponse<{ apartment: ApartmentsResponse }>
		>({ expand: 'apartment', fetch: selectedFetchImplementation });
}

export async function maybeGetReservationForApartment(
	apartment: string,
	fetchImplementation?: typeof fetch
) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	try {
		return await pb.collection(Collections.Reservations).getFirstListItem(
			pb.filter('apartment.apartment = {:apartment}', {
				apartment: apartment
			}),
			{ fetch: selectedFetchImplementation }
		);
	} catch (e) {
		return undefined;
	}
}

export async function createReservation(
	start: string,
	end: string,
	apartmentId: string,
	reservationType: ReservationsTypeOptions = ReservationsTypeOptions.laundry,
	fetchImplementation?: typeof fetch
) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	return await pb.collection(Collections.Reservations).create(
		{
			type: reservationType,
			start: start,
			end: end,
			apartment: apartmentId
		},
		{ fetch: selectedFetchImplementation }
	);
}

export async function deleteReservation(reservationId: string, fetchImplementation?: typeof fetch) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	return await pb
		.collection(Collections.Reservations)
		.delete(reservationId, { fetch: selectedFetchImplementation });
}

export async function reserve(apartment: Apartment, start: string, end: string) {
	const reservation = await maybeGetReservationForApartment(apartment.apartment);
	if (reservation) {
		try {
			await deleteReservation(reservation.id);
		} catch (e) {
			if (e instanceof ClientResponseError) {
				console.log('client error:', e.message);
				return;
			}
		}
	}

	try {
		await createReservation(start, end, apartment.id);
	} catch (e) {
		if (e instanceof ClientResponseError) {
			console.log('client error:', e.message);
		} else {
			console.log('unknown error:', e);
		}
	}
}

export async function release(apartment: Apartment) {
	const reservation = await maybeGetReservationForApartment(apartment.apartment);
	if (reservation) {
		try {
			await deleteReservation(reservation.id);
		} catch (e) {
			if (e instanceof ClientResponseError) {
				console.log('client error:', e.message);
				return;
			}
		}
	}
}
