import { pb, maybeGetApartmentForUser } from '$lib/pocketbase';

export const ssr = false;
export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch }) => {
	if (!pb.authStore.isValid) {
		pb.authStore.clear();
	}
	const user = pb.authStore.model || undefined;
	const apartment = user ? await maybeGetApartmentForUser(user, fetch) : undefined;

	return {
		user: user,
		apartment: apartment
	};
};
