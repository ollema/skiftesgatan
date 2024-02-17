import { loadData } from './load';

export const load = async ({ parent, locals, params, fetch }) => {
	await parent();

	loadData(locals.pb, params.apartment, fetch);
};
