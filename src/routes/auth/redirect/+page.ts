import { redirect } from '$lib/pocketbase/index.js';

export const load = async ({ url }) => {
	await redirect(url);
};
