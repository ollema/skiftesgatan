import { maybeGetPage } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import type { MetaTagsProps } from 'svelte-meta-tags';

export const load = async ({ fetch }) => {
	const page = await maybeGetPage('privacy/data_deletion', fetch);

	if (!page) {
		error(404, 'Page not found');
	}

	const meta: MetaTagsProps = {
		title: page.title,
		description: page.description
	};

	return {
		page,
		meta
	};
};

export const prerender = true;
