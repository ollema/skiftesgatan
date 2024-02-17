import { loadData } from './load';
import { pb } from '$lib/pocketbase';

import { error } from '@sveltejs/kit';

import { PUBLIC_ADAPTER } from '$env/static/public';

export const load = async ({ parent, data, params, fetch }) => {
	await parent();

	try {
		if (PUBLIC_ADAPTER === 'node') {
			return { ...data };
		} else {
			return loadData(pb, params.apartment, fetch);
		}
	} catch (e) {
		error(404, 'Apartment not found or you may not have access to view it.');
	}
};
