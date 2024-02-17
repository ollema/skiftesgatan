import { loadInitial, maybeGetApartmentForUser, pb } from '$lib/pocketbase';

import { PUBLIC_ADAPTER } from '$env/static/public';

export const ssr = PUBLIC_ADAPTER === 'node';
export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ data, fetch }) => {
	const meta = {
		title: 'BRF Skiftesgatan 4',
		description: 'En app för boende på BRF Skiftesgatan 4.'
	};

	if (PUBLIC_ADAPTER === 'node') {
		return { ...data, meta };
	} else {
		await loadInitial();

		if (!pb.authStore.isValid) {
			pb.authStore.clear();
		}
		const user = pb.authStore.model || undefined;
		const apartment = user ? await maybeGetApartmentForUser(pb, user, fetch) : undefined;

		return {
			user: user,
			apartment: apartment,
			meta: meta
		};
	}
};
