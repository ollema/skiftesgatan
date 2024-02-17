import { pb } from '$lib/pocketbase';

export const load = async ({ parent }) => {
	const meta = {
		title: 'Logga in',
		description: 'Logga in som boende i BRF Skiftesgatan 4'
	};

	await parent();

	const { authProviders } = await pb.collection('users').listAuthMethods();

	return { meta, providers: authProviders };
};
