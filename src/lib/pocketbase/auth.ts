import { pb } from './client';

import { PUBLIC_REDIRECT_URL } from '$env/static/public';

export async function signin(provider: string) {
	const { authProviders } = await pb.collection('users').listAuthMethods();
	const authProvider = authProviders.find((method) => method.name === provider);
	if (!authProvider) {
		throw new Error(`unknown auth provider: ${provider}`);
	}

	// save the provider to localStorage
	localStorage.setItem('provider', JSON.stringify(authProvider));

	window.location.assign(authProvider.authUrl + PUBLIC_REDIRECT_URL);
}

export async function redirect(url: URL) {
	// parse the query parameters from the redirected url
	const params = url.searchParams;
	const state = params.get('state');
	if (!state) {
		throw new Error('no state query parameter found');
	}
	const code = params.get('code');
	if (!code) {
		throw new Error('no code query parameter found');
	}

	// load the provider from localStorage
	const authProvider = JSON.parse(localStorage.getItem('provider') || '{}');
	if (!authProvider) {
		throw new Error('no provider found');
	}

	// compare the redirect's state param and the stored provider's one
	if (state !== authProvider.state) {
		throw new Error("state parameters don't match");
	}

	// authenticate the user with the provider
	const { record, meta } = await pb
		.collection('users')
		.authWithOAuth2Code(authProvider.name, code, authProvider.codeVerifier, PUBLIC_REDIRECT_URL, {
			// TODO: must fix!!!
			role: 'member'
		});

	// update the user's name with data from the provider if needed
	if (record.name === '' && meta && meta.name) {
		const formData = new FormData();

		// update name
		formData.append('name', meta.name);

		await pb.collection('users').update(record.id, formData);
	}

	// refresh the auth store
	await pb.collection('users').authRefresh();

	// remove the provider from localStorage
	localStorage.removeItem('provider');

	window.location.assign('/');
}

export function signout() {
	pb.authStore.clear();
}
