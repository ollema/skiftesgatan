import { handleRedirect, pb } from '$lib/pocketbase';

import { PUBLIC_ADAPTER } from '$env/static/public';

export const load = async ({ parent, url }) => {
	await parent();

	if (PUBLIC_ADAPTER !== 'node') {
		await handleRedirect(pb, url);
	}
};
