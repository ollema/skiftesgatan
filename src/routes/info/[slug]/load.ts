import type { TypedPocketBase } from '$lib/pocketbase-types';
import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export async function loadData(
	pb: TypedPocketBase,
	slug: string,
	fetchImplementation: typeof fetch
) {
	const page = await maybeGetPage(pb, 'info/' + slug, fetchImplementation);

	if (!page) {
		error(404, 'Page not found');
	}

	const meta = {
		title: page.title,
		description: page.description
	};

	return {
		page: page,
		meta: meta
	};
}
