import { signin, pb } from '$lib/pocketbase';

export const load = async ({ parent, params }) => {
	await parent();

	await signin(pb, params.provider);
};
