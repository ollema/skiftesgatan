import {
	type ReservationsResponse,
	type ApartmentsResponse,
	ReservationsTypeOptions,
	type TypedPocketBase
} from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';
import { ClientResponseError } from 'pocketbase';

export async function getReservations(pb: TypedPocketBase, fetchImplementation?: typeof fetch) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	return await pb
		.collection(Collections.Reservations)
		.getFullList<
			ReservationsResponse<{ apartment: ApartmentsResponse }>
		>({ expand: 'apartment', fetch: selectedFetchImplementation });
}

export async function maybeGetReservationForApartment(
	pb: TypedPocketBase,
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
	pb: TypedPocketBase,
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

export async function deleteReservation(
	pb: TypedPocketBase,
	reservationId: string,
	fetchImplementation?: typeof fetch
) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	return await pb
		.collection(Collections.Reservations)
		.delete(reservationId, { fetch: selectedFetchImplementation });
}

export async function reserve(
	pb: TypedPocketBase,
	apartment: ApartmentsResponse,
	start: string,
	end: string
) {
	const reservation = await maybeGetReservationForApartment(pb, apartment.apartment);
	if (reservation) {
		try {
			await deleteReservation(pb, reservation.id);
		} catch (e) {
			if (e instanceof ClientResponseError) {
				console.log('client error:', e.message);
				return;
			}
		}
	}

	try {
		await createReservation(pb, start, end, apartment.id);
	} catch (e) {
		if (e instanceof ClientResponseError) {
			console.log('client error:', e.message);
		} else {
			console.log('unknown error:', e);
		}
	}
}

export async function release(pb: TypedPocketBase, apartment: ApartmentsResponse) {
	const reservation = await maybeGetReservationForApartment(pb, apartment.apartment);
	if (reservation) {
		try {
			await deleteReservation(pb, reservation.id);
		} catch (e) {
			if (e instanceof ClientResponseError) {
				console.log('client error:', e.message);
				return;
			}
		}
	}
}
