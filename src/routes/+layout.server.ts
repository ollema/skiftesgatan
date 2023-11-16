import { maybeGetApartmentForUser } from '$lib/server/apartments.js';

export const load = async ({ locals }) => {
	const user = locals.user;
	let apartment = undefined;

	if (user) {
		apartment = await maybeGetApartmentForUser(locals.pb, user);
	}

	return {
		user: user,
		apartment: apartment
	};
};
