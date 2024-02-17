import { loadData } from './load';

export const load = async ({ locals, params, fetch }) => {
	return loadData(locals.pb, params.slug, fetch);
};
