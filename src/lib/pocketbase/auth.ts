import { Preferences } from '@capacitor/preferences';

import type { TypedPocketBase } from '$lib/pocketbase-types';
import type { AuthProviderInfo } from 'pocketbase';

import { dev } from '$app/environment';
import { error, redirect, type Cookies } from '@sveltejs/kit';

const redirectUrl = 'https://skiftesgatan.server.ollema.xyz/auth/redirect';

import { PUBLIC_ADAPTER, PUBLIC_NGROK_REDIRECT_URL } from '$env/static/public';

function getRedirectUrl() {
	if (dev) {
		return PUBLIC_NGROK_REDIRECT_URL;
	}
	return redirectUrl;
}

const providerKey = 'provider';

async function setProvider(provider: AuthProviderInfo, cookies?: Cookies) {
	if (PUBLIC_ADAPTER === 'node' && cookies) {
		cookies.set(providerKey, JSON.stringify(provider), {
			path: '/',
			maxAge: 60 * 5 // 5 minutes
		});
	} else {
		await Preferences.set({ key: providerKey, value: JSON.stringify(provider) });
	}
}

async function getProvider(cookies?: Cookies) {
	if (PUBLIC_ADAPTER === 'node' && cookies) {
		const provider = JSON.parse(cookies.get(providerKey) || '{}');
		return provider as AuthProviderInfo | null;
	} else {
		const provider = await Preferences.get({ key: providerKey });
		return provider.value ? (JSON.parse(provider.value) as AuthProviderInfo) : null;
	}
}

async function removeProvider(cookies?: Cookies) {
	if (PUBLIC_ADAPTER === 'node' && cookies) {
		cookies.delete(providerKey, { path: '/' });
	} else {
		await Preferences.remove({ key: providerKey });
	}
}

export async function signin(pb: TypedPocketBase, provider: string, cookies?: Cookies) {
	const { authProviders } = await pb.collection('users').listAuthMethods();
	const authProvider = authProviders.find((p) => p.name === provider);
	if (!authProvider) {
		error(404, { message: 'provider not found' });
	}

	await setProvider(authProvider, cookies);

	redirect(303, authProvider.authUrl + getRedirectUrl());
}

export async function handleRedirect(pb: TypedPocketBase, url: URL, cookies?: Cookies) {
	// parse the query parameters from the redirected url
	const params = url.searchParams;
	const state = params.get('state');
	if (!state) {
		error(400, { message: 'no state query parameter found' });
	}
	const code = params.get('code');
	if (!code) {
		error(400, { message: 'no code query parameter found' });
	}

	// load the provider from:
	// - cookies (adapter-node)
	// - UserDefaults/SharedPreferences (adapter-static)
	const authProvider = await getProvider(cookies);
	if (!authProvider) {
		error(403, { message: 'no provider found' });
	}

	// compare the redirect's state param and the stored provider's one
	if (state !== authProvider.state) {
		error(403, { message: 'state mismatch' });
	}

	// authenticate the user with the provider
	const { record, meta } = await pb
		.collection('users')
		.authWithOAuth2Code(authProvider.name, code, authProvider.codeVerifier, getRedirectUrl(), {
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

	// remove the provider from:
	// - cookies (adapter-node)
	// - UserDefaults/SharedPreferences (adapter-static)
	await removeProvider(cookies);

	redirect(303, '/');
}

export function signout(pb: TypedPocketBase) {
	pb.authStore.clear();

	redirect(303, '/');
}
