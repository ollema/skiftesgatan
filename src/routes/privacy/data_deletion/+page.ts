import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load = async ({ parent, fetch }) => {
	await parent();

	const page = await maybeGetPage('privacy/data_deletion', fetch);

	if (!page) {
		error(404, 'Page not found');
	}

	const meta = {
		title: page.title,
		description: page.description
	};

	return {
		page,
		meta
	};
};
