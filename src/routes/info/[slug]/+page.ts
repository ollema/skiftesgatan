import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import { navigation } from '$lib/config/navigation';

export const load = async ({ params, fetch }) => {
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

export const entries = () => {
	const info = navigation.find((item) => item.title === 'Information');
	if (!info) {
		return [];
	}

	return info.items.map((item) => {
		return {
			slug: item.href.split('/info/').pop() as string
		};
	});
};

export const prerender = true;
