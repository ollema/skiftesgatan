import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

import { pb } from './client';

import { dev } from '$app/environment';
import { PUBLIC_NGROK_REDIRECT_URL } from '$env/static/public';

const webRedirectUrl = 'https://skiftesgatan.com/auth/redirect';
const androidRedirectUrl = 'https://skiftesgatan.com/auth/redirect/android';
const iosRedirectUrl = 'https://skiftesgatan.com/auth/redirect/ios';

function getRedirectUrl() {
	switch (Capacitor.getPlatform()) {
		case 'web':
			// use ngrok redirect url in development
			if (dev) {
				return PUBLIC_NGROK_REDIRECT_URL;
			}
			return webRedirectUrl;
		case 'android':
			return androidRedirectUrl;
		case 'ios':
			return iosRedirectUrl;
		default:
			throw new Error('unknown platform');
	}
}

export async function signin(provider: string) {
	const { authProviders } = await pb.collection('users').listAuthMethods();
	const authProvider = authProviders.find((method) => method.name === provider);
	if (!authProvider) {
		throw new Error(`unknown auth provider: ${provider}`);
	}

	// save the provider to localStorage/UserDefaults/SharedPreferences
	await Preferences.set({ key: 'provider', value: JSON.stringify(authProvider) });

	// open the provider's auth url in the browser
	window.location.assign(authProvider.authUrl + getRedirectUrl());
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

	// load the provider from localStorage/UserDefaults/SharedPreferences
	const authProvider = JSON.parse((await Preferences.get({ key: 'provider' })).value || '{}');
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
	await Preferences.remove({ key: 'provider' });

	window.location.assign('/');
}

export function signout() {
	pb.authStore.clear();
}
