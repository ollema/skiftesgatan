import {
	type TypedPocketBase,
	type ReservationsResponse,
	type ApartmentsResponse,
	ReservationsTypeOptions
} from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';

export async function getReservations(pb: TypedPocketBase) {
	return await pb
		.collection(Collections.Reservations)
		.getFullList<ReservationsResponse<{ apartment: ApartmentsResponse }>>({ expand: 'apartment' });
}

export async function maybeGetReservationForApartment(pb: TypedPocketBase, apartment: string) {
	try {
		return await pb
			.collection(Collections.Reservations)
			.getFirstListItem(pb.filter('apartment.apartment = {:apartment}', { apartment: apartment }));
	} catch (e) {
		return undefined;
	}
}

export async function createReservation(
	pb: TypedPocketBase,
	start: string,
	end: string,
	apartmentId: string,
	reservationType: ReservationsTypeOptions = ReservationsTypeOptions.laundry
) {
	return await pb.collection(Collections.Reservations).create({
		type: reservationType,
		start: start,
		end: end,
		apartment: apartmentId
	});
}

export async function deleteReservation(pb: TypedPocketBase, reservationId: string) {
	return await pb.collection(Collections.Reservations).delete(reservationId);
}
