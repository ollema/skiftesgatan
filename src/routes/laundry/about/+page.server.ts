import { loadData } from './load';

export const load = async ({ locals, fetch }) => {
	return loadData(locals.pb, fetch);
};
