import type { TypedPocketBase, ApartmentsResponse, UsersResponse } from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';
import type { AuthModel } from 'pocketbase';

type Texpand = {
	owners: UsersResponse[];
	subtenants: UsersResponse[];
};

export async function maybeGetApartmentForUser(
	pb: TypedPocketBase,
	authModel: AuthModel,
	fetchImplementation?: typeof fetch
) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;

	if (!authModel) {
		return undefined;
	}

	try {
		return await pb
			.collection(Collections.Apartments)
			.getFirstListItem<
				ApartmentsResponse<Texpand>
			>(pb.filter('owners.id ?= {:user} || subtenants.id ?= {:user}', { user: authModel.id }), { expand: 'owners,subtenants', fetch: selectedFetchImplementation });
	} catch (e) {
		return undefined;
	}
}

export async function getApartment(
	pb: TypedPocketBase,
	apartment: string,
	fetchImplementation?: typeof fetch
) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;
	return await pb
		.collection(Collections.Apartments)
		.getFirstListItem<
			ApartmentsResponse<Texpand>
		>(pb.filter('apartment = {:apartment}', { apartment: apartment }), { expand: 'owners,subtenants', fetch: selectedFetchImplementation });
}
