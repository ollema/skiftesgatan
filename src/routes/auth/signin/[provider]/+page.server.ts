import { handleSignIn } from '$lib/pocketbase';

export const load = async ({ parent, locals, params, cookies }) => {
	await parent();

	await handleSignIn(locals.pb, params.provider, cookies);
};
