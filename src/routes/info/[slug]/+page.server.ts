import { maybeGetPage } from '$lib/server/content';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const page = await maybeGetPage(locals.pb, 'info/' + params.slug);

	if (!page) {
		throw error(404, 'Page not found');
	}

	return {
		page: page
	};
};
