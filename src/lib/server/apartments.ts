import type { TypedPocketBase, ApartmentsResponse, UsersResponse } from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';
import type { User } from '$lib/types';

export async function maybeGetApartmentForUser(pb: TypedPocketBase, user: User) {
	try {
		return await pb
			.collection(Collections.Apartments)
			.getFirstListItem(pb.filter('owners.id ?= {:user}', { user: user.id }));
	} catch (e) {
		return undefined;
	}
}

type Texpand = {
	owners: UsersResponse[];
	subtenants: UsersResponse[];
};

export async function getApartment(pb: TypedPocketBase, apartment: string) {
	return await pb
		.collection(Collections.Apartments)
		.getFirstListItem<ApartmentsResponse<Texpand>>(
			pb.filter('apartment = {:apartment}', { apartment: apartment }),
			{ expand: 'owners,subtentants' }
		);
}
