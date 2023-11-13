import { env } from '$env/dynamic/private';

import { error, redirect } from '@sveltejs/kit';

import { getTokenPayload } from 'pocketbase';

export const GET = async ({ locals, url, cookies }) => {
	// parse the query parameters from the redirected url
	const params = url.searchParams;
	const state = params.get('state');
	if (!state) {
		throw error(404, 'no state query parameter found');
	}
	const code = params.get('code');
	if (!code) {
		throw error(404, 'no code query parameter found');
	}

	// load the previously stored provider's data from cookie
	const rawProvider = cookies.get('provider');
	if (!rawProvider) {
		throw error(404, 'no provider cookie found');
	}
	const provider = JSON.parse(rawProvider);

	// compare the redirect's state param and the stored provider's one
	if (state !== provider.state) {
		throw error(404, "state parameters don't match");
	}

	// authenticate the user with the provider
	const { record, meta } = await locals.pb
		.collection('users')
		.authWithOAuth2Code(provider.name, code, provider.codeVerifier, env.AUTH_REDIRECT_URL);

	// update the user's name and avatar with data from the provider
	if (meta && meta.name && meta.avatarUrl) {
		const formData = new FormData();

		// update name
		formData.append('name', record.name === '' ? meta.name : record.name);

		// update avatar
		console.log(meta.avatarUrl);
		const response = await fetch(meta.avatarUrl);
		if (response.ok) {
			const file = await response.blob();
			formData.append('avatar', file);
		}

		await locals.pb.collection('users').update(record.id, formData);
	}

	// refresh the auth store
	await locals.pb.collection('users').authRefresh();

	// clear the provider cookie
	cookies.delete('provider', { path: '/' });

	// set the pb_auth cookie
	const payload = getTokenPayload(locals.pb.authStore.token);
	cookies.set(
		'pb_auth',
		JSON.stringify({
			token: locals.pb.authStore.token,
			model: locals.pb.authStore.model
		}),
		{
			path: '/',
			expires: new Date(payload.exp * 1000)
		}
	);

	throw redirect(302, '/');
};
