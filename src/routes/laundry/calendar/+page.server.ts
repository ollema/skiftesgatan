import { loadData } from './load';

export const load = async ({ depends, parent, locals, fetch }) => {
	depends('laundry:calendar');
	const { apartment } = await parent();

	return loadData(locals.pb, apartment?.apartment, fetch);
};
