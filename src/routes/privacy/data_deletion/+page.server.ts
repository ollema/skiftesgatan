import { maybeGetPage } from '$lib/server/content';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const page = await maybeGetPage(locals.pb, 'privacy/data_deletion');

	if (!page) {
		throw error(404, 'Page not found');
	}

	return {
		page: page
	};
};
