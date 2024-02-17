import { Collections, type TypedPocketBase } from '$lib/pocketbase-types';

export async function maybeGetPage(
	pb: TypedPocketBase,
	slug: string,
	fetchImplementation?: typeof fetch
) {
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
