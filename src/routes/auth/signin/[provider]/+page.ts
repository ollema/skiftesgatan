import { handleSignIn, pb } from '$lib/pocketbase';

export const load = async ({ parent, params }) => {
	await parent();

	await handleSignIn(pb, params.provider);
};
