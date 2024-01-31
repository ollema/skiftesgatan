import type { ApartmentsResponse, UsersResponse } from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';
import type { AuthModel } from 'pocketbase';

import { pb } from './client';

export async function maybeGetApartmentForUser(
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
			.getFirstListItem(
				pb.filter('owners.id ?= {:user} || subtenants.id ?= {:user}', { user: authModel.id }),
				{ fetch: selectedFetchImplementation }
			);
	} catch (e) {
		return undefined;
	}
}

type Texpand = {
	owners: UsersResponse[];
	subtenants: UsersResponse[];
};

export async function getApartment(apartment: string, fetchImplementation?: typeof fetch) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;
	return await pb
		.collection(Collections.Apartments)
		.getFirstListItem<
			ApartmentsResponse<Texpand>
		>(pb.filter('apartment = {:apartment}', { apartment: apartment }), { expand: 'owners,subtenants', fetch: selectedFetchImplementation });
}
