import { maybeGetAgreementsForApartment } from '$lib/server/agreements.js';
import { getApartment } from '$lib/server/apartments';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, depends }) => {
	depends('apartments:apartment');

	try {
		const apartment = await getApartment(locals.pb, params.apartment);
		const owners = [...new Set(apartment.expand?.owners?.map((o) => o.name))];
		const subtenants = [...new Set(apartment.expand?.subtenants?.map((s) => s.name))];
		const agreements = await maybeGetAgreementsForApartment(locals.pb, params.apartment);

		return {
			user: locals.user,
			apartment: apartment,
			owners,
			subtenants,
			agreements
		};
	} catch (e) {
		throw error(404, 'Apartment not found or you may not have access to view it.');
	}
};
