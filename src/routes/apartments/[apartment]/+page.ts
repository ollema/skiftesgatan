// import { maybeGetAgreementsForApartment } from '$lib/server/agreements.js';
import { getApartment, maybeGetAgreementsForApartment } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch }) => {
	try {
		const apartment = await getApartment(params.apartment, fetch);
		const owners = [...new Set(apartment.expand?.owners?.map((o) => o.name))];
		const subtenants = [...new Set(apartment.expand?.subtenants?.map((s) => s.name))];
		const agreements = await maybeGetAgreementsForApartment(params.apartment, fetch);

		return {
			apartment: apartment,
			owners,
			subtenants,
			agreements
		};
	} catch (e) {
		error(404, 'Apartment not found or you may not have access to view it.');
	}
};
