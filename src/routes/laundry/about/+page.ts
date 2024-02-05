import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load = async ({ fetch }) => {
	const page = await maybeGetPage('laundry/about', fetch);

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

export const prerender = true;
