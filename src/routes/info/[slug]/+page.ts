import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch }) => {
	const page = await maybeGetPage('info/' + params.slug, fetch);

	if (!page) {
		error(404, 'Page not found');
	}

	return {
		page: page
	};
};
