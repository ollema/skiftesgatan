import * as Sentry from '@sentry/sveltekit';
import { initSentry, sentryServerErrorHandler } from '$lib/sentry';
import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

// handling errors with Sentry
initSentry();
export const handleError = Sentry.handleErrorWithSentry(sentryServerErrorHandler);

// authentification with PocketBase
export const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.pb = new PocketBase('https://skiftesgatan.com') as TypedPocketBase;
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');
	if (!event.locals.pb.authStore.isValid) {
		event.locals.pb.authStore.clear();
	}
	return await resolve(event);
};

export const handle = sequence(Sentry.sentryHandle(), handleAuth);
