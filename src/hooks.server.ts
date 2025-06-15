import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';


// authentification with PocketBase
export const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.pb = new PocketBase('https://pocketbase.skiftesgatan.com') as TypedPocketBase;
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		event.locals.pb.authStore.isValid && (await event.locals.pb.collection('users').authRefresh());
	} catch (_) {
		event.locals.pb.authStore.clear();
	}

	const response = await resolve(event);

	response.headers.append(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({
			sameSite: 'lax',
			secure: !dev
		})
	);

	return response;
};

export const handle = sequence(Sentry.sentryHandle(), handleAuth);
