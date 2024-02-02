import { pb } from '$lib/pocketbase';

export const load = async () => {
	const { authProviders } = await pb.collection('users').listAuthMethods();

	return { providers: authProviders };
};
