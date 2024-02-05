import { pb, maybeGetApartmentForUser } from '$lib/pocketbase';

export const ssr = false;
export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch }) => {
	await pb.authStore.loadInitial();

	if (!pb.authStore.isValid) {
		pb.authStore.clear();
	}
	const user = pb.authStore.model || undefined;
	const apartment = user ? await maybeGetApartmentForUser(user, fetch) : undefined;

	const meta = {
		title: 'BRF Skiftesgatan 4',
		description: 'En bostadsrättsförening i Hisingen, Göteborg.'
	};

	return {
		user: user,
		apartment: apartment,
		meta: meta
	};
};
