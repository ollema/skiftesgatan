import { pb, maybeGetApartmentForUser } from '$lib/pocketbase';
import { Preferences } from '@capacitor/preferences';

export const ssr = false;
export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch }) => {
	// TODO: figure out if there is a better way to wait for the auth store to be fully loaded
	await Preferences.get({ key: 'pb_auth' });

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
