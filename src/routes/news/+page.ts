import type { MetaTagsProps } from 'svelte-meta-tags';

export const load = () => {
	const meta: MetaTagsProps = {
		title: 'Nyheter',
		description: 'Nyheter från BRF Skiftesgatan 4'
	};

	return { meta };
};

export const prerender = true;
