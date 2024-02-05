import type { MetaTagsProps } from 'svelte-meta-tags';

export const load = () => {
	const meta: MetaTagsProps = {
		title: 'Information',
		description: 'Allmän information om BRF Skiftesgatan 4'
	};

	return { meta };
};

export const prerender = true;
