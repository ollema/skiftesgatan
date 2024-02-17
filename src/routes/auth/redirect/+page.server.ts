import { handleRedirect } from '$lib/pocketbase';

export const load = async ({ parent, locals, url, cookies }) => {
	await parent();

	await handleRedirect(locals.pb, url, cookies);
};
