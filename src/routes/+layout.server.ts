import { getApartmentForUser } from '$lib/server/apartments.js';

export const load = async ({ locals }) => {
	const user = locals.user;
	let apartment = undefined;

	if (user) {
		apartment = await getApartmentForUser(locals.pb, user);
	}

	return {
		user: user,
		apartment: apartment
	};
};
