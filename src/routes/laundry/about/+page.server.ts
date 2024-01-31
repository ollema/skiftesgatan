import { maybeGetPage } from '$lib/server/content';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const page = await maybeGetPage(locals.pb, 'laundry/about');

	if (!page) {
		error(404, 'Page not found');
	}

	return {
		page: page
	};
};
