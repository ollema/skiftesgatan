import { loadData } from './load';

export const load = async ({ parent, locals, params, fetch }) => {
	await parent();

	return loadData(locals.pb, params.slug, fetch);
};
