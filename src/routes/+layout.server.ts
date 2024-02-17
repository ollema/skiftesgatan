import { maybeGetApartmentForUser } from '$lib/pocketbase';

export const load = async ({ locals, fetch }) => {
	const user = locals.pb.authStore.model || undefined;
	const apartment = user ? await maybeGetApartmentForUser(locals.pb, user, fetch) : undefined;

	return {
		user: user,
		apartment: apartment
	};
};
