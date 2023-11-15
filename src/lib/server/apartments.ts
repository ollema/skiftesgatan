import { type TypedPocketBase, Collections } from '$lib/pocketbase-types';
import type { User } from '$lib/types';

export async function getApartmentForUser(pb: TypedPocketBase, user: User) {
	try {
		const apartment = await pb
			.collection(Collections.Apartments)
			.getFirstListItem(pb.filter('owners.id ?= {:user}', { user: user.id }));
		return apartment;
	} catch (e) {
		return undefined;
	}
}
