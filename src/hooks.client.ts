import { dev } from '$app/environment';
import { goto } from '$app/navigation';
import { active } from '$lib/active';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/sveltekit';
import type { NavigationEvent } from '@sveltejs/kit';

import { PUBLIC_DSN } from '$env/static/public';

function registerServiceWorker() {
	navigator.serviceWorker.register('/service-worker.js', {
		type: dev ? 'module' : 'classic'
	});
}

if (Capacitor.getPlatform() === 'web' && 'serviceWorker' in navigator) {
	if (document.readyState === 'complete') {
		registerServiceWorker();
	} else {
		window.addEventListener('load', registerServiceWorker);
	}
}

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
