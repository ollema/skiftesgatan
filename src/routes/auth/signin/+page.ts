import { pb } from '$lib/pocketbase';
import type { MetaTagsProps } from 'svelte-meta-tags';

export const load = async () => {
	const { authProviders } = await pb.collection('users').listAuthMethods();

	const meta: MetaTagsProps = {
		title: 'Logga in',
		description: 'Logga in som boende i BRF Skiftesgatan 4'
	};

	return { providers: authProviders, meta };
};
