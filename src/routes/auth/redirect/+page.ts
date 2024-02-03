import { handleRedirect } from '$lib/pocketbase';

export const load = async ({ url }) => {
	await handleRedirect(url);
};
