import { signout } from '$lib/pocketbase';

export const load = async ({ parent }) => {
	await parent();

	signout();
};
