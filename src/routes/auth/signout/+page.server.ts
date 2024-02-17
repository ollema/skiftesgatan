import { signout } from '$lib/pocketbase';

export const load = async ({ parent, locals }) => {
	await parent();

	signout(locals.pb);
};
