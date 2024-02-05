import { pb } from '$lib/pocketbase';

export const load = async () => {
	const { authProviders } = await pb.collection('users').listAuthMethods();

	const meta = {
		title: 'Logga in',
		description: 'Logga in som boende i BRF Skiftesgatan 4'
	};

	return { providers: authProviders, meta };
};
