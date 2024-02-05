import type { MetaTagsProps } from 'svelte-meta-tags';

export const load = () => {
	const meta: MetaTagsProps = {
		title: 'Kontakt',
		description: 'Kontakta BRF Skiftesgatan 4'
	};

	return { meta };
};
