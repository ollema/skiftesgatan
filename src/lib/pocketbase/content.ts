import { Collections } from '$lib/pocketbase-types';

import { pb } from './client';

export async function maybeGetPage(slug: string, fetchImplementation?: typeof fetch) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;
	try {
		return await pb
			.collection(Collections.Content)
			.getFirstListItem(pb.filter('slug = {:slug}', { slug: slug }), {
				fetch: selectedFetchImplementation
			});
	} catch (e) {
		return undefined;
	}
}
