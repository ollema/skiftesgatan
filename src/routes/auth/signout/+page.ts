import { signout, pb } from '$lib/pocketbase';

import { PUBLIC_ADAPTER } from '$env/static/public';

export const load = async ({ parent }) => {
	await parent();

	if (PUBLIC_ADAPTER !== 'node') {
		signout(pb);
	}
};
