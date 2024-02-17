import type { TypedPocketBase } from '$lib/pocketbase-types';
import { getApartment, maybeGetAgreementsForApartment } from '$lib/pocketbase';

export async function loadData(
	pb: TypedPocketBase,
	apartmnt: string,
	fetchImplementation: typeof fetch
) {
	const apartment = await getApartment(pb, apartmnt, fetchImplementation);
	const owners = [...new Set(apartment.expand?.owners?.map((o) => o.name))];
	const subtenants = [...new Set(apartment.expand?.subtenants?.map((s) => s.name))];
	const agreements = await maybeGetAgreementsForApartment(pb, apartmnt, fetch);

	const meta = {
		title: `Lägenhet ${apartment.apartment}`,
		description: 'Information om din lägenhet.'
	};

	return {
		apartment,
		owners,
		subtenants,
		agreements,
		meta
	};
}
