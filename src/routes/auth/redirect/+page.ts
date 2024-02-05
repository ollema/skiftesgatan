import { handleRedirect } from '$lib/pocketbase';

export const load = async ({ parent, url }) => {
	await parent();

	await handleRedirect(url);
};
