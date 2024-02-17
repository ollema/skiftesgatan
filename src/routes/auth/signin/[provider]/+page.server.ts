import { signin } from '$lib/pocketbase';

export const load = async ({ parent, locals, params, cookies }) => {
	await parent();

	await signin(locals.pb, params.provider, cookies);
};
