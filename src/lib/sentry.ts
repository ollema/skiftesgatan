import * as Sentry from '@sentry/sveltekit';

import { dev } from '$app/environment';
import type { NavigationEvent } from '@sveltejs/kit';

import { PUBLIC_DSN } from '$env/static/public';

export function initSentry() {
	if (!dev) {
		Sentry.init({
			dsn: PUBLIC_DSN,
			environment: dev ? 'development' : 'production',
			tracesSampleRate: 0.2
		});
	}
}

type MaybePromise<T> = T | Promise<T>;

type HandleError = (input: {
	error: unknown;
	event: NavigationEvent;
	status: number;
	message: string;
}) => MaybePromise<void | App.Error>;

export const sentryClientErrorHandler = (({ error, event }) => {
	console.error('An error occurred on the client side:', error, event);
}) as HandleError;

export const sentryServerErrorHandler = (({ error, event }) => {
	console.error('An error occurred on the server side:', error, event);
}) as HandleError;
