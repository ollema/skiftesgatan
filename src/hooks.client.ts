import { goto } from '$app/navigation';
import { App } from '@capacitor/app';
import * as Sentry from '@sentry/sveltekit';
import type { NavigationEvent } from '@sveltejs/kit';

import { active } from '$lib/active';

import { PUBLIC_DSN } from '$env/static/public';
import { dev } from '$app/environment';

App.addListener('appUrlOpen', async (event) => {
	const url = new URL(event.url);
	// remove protocol, host and port
	await goto(url.pathname + url.search + url.hash);
});

App.addListener('appStateChange', async (state) => {
	active.set(state.isActive);
});

Sentry.init({
	dsn: PUBLIC_DSN,
	environment: dev ? 'development' : 'production'
});

type MaybePromise<T> = T | Promise<T>;

type HandleClientError = (input: {
	error: unknown;
	event: NavigationEvent;
	status: number;
	message: string;
}) => MaybePromise<void | App.Error>;

const sentryErrorHandler = (({ error, event }) => {
	console.error('An error occurred on the client side:', error, event);
}) satisfies HandleClientError;

export const handleError = Sentry.handleErrorWithSentry(sentryErrorHandler);
