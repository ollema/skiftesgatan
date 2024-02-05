import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load = async ({ parent, params, fetch }) => {
	await parent();

	const page = await maybeGetPage('info/' + params.slug, fetch);

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
};
