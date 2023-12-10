import type { TypedPocketBase } from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';

export async function maybeGetPage(pb: TypedPocketBase, slug: string) {
	try {
		return await pb
			.collection(Collections.Content)
			.getFirstListItem(pb.filter('slug = {:slug}', { slug: slug }));
	} catch (e) {
		return undefined;
	}
}
