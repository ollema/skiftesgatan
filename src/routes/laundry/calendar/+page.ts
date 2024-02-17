import { loadData } from './load';
import { pb } from '$lib/pocketbase';

import { PUBLIC_ADAPTER } from '$env/static/public';

export const load = async ({ depends, data, parent, fetch }) => {
	if (PUBLIC_ADAPTER === 'node') {
		return { ...data };
	} else {
		depends('laundry:calendar');
		const { apartment } = await parent();

		return loadData(pb, apartment?.apartment, fetch);
	}
};
