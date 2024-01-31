import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load = async ({ fetch }) => {
	const page = await maybeGetPage('laundry/about', fetch);

	if (!page) {
		error(404, 'Page not found');
	}

	return {
		page: page
	};
};
