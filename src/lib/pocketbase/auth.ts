import { Preferences } from '@capacitor/preferences';

import { pb } from './client';
import type { AuthProviderInfo } from 'pocketbase';

import { goto } from '$app/navigation';

import { dev } from '$app/environment';
import { PUBLIC_NGROK_REDIRECT_URL } from '$env/static/public';
const redirectUrl = 'https://skiftesgatan.com/auth/redirect';

export function getRedirectUrl() {
	if (dev) {
		return PUBLIC_NGROK_REDIRECT_URL;
	}
	return redirectUrl;
}

const providerKey = 'provider';

async function getProvider() {
	const provider = await Preferences.get({ key: providerKey });
	return provider.value ? (JSON.parse(provider.value) as AuthProviderInfo) : null;
}

export async function setProvider(provider: AuthProviderInfo) {
	await Preferences.set({ key: providerKey, value: JSON.stringify(provider) });
}

async function removeProvider() {
	await Preferences.remove({ key: providerKey });
}

export async function handleRedirect(url: URL) {
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

	// load the provider from localStorage/UserDefaults/SharedPreferences
	const authProvider = await getProvider();
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

	// remove the provider from localStorage/UserDefaults/SharedPreferences
	await removeProvider();

	await goto('/');
}

export function signout() {
	pb.authStore.clear();
}
