import { loadData } from './load';

export const load = async ({ parent, locals, fetch }) => {
	await parent();

	return loadData(locals.pb, fetch);
};
