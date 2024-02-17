import { loadData } from './load';
import { pb } from '$lib/pocketbase';

import { PUBLIC_ADAPTER } from '$env/static/public';

export const load = async ({ parent, data, params, fetch }) => {
	await parent();

	if (PUBLIC_ADAPTER === 'node') {
		return { ...data };
	} else {
		return loadData(pb, params.slug, fetch);
	}
};
