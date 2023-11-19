import { getApartment } from '$lib/server/apartments';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	try {
		return {
			apartment: await getApartment(locals.pb, params.apartment)
		};
	} catch (e) {
		throw error(404, 'Apartment not found or you may not have access to view it.');
	}
};
