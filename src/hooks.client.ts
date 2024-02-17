import { goto } from '$app/navigation';
import { active } from '$lib/active';

import { App } from '@capacitor/app';
import * as Sentry from '@sentry/sveltekit';
import { initSentry, sentryClientErrorHandler } from '$lib/sentry';

// handling deep links
App.addListener('appUrlOpen', async (event) => {
	const url = new URL(event.url);
	// remove protocol, host and port
	await goto(url.pathname + url.search + url.hash);
});

// handling app state changes
App.addListener('appStateChange', async (state) => {
	active.set(state.isActive);
});

// handling errors with Sentry
initSentry();
export const handleError = Sentry.handleErrorWithSentry(sentryClientErrorHandler);
