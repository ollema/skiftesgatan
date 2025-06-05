import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { RefillingTokenBucket } from '$lib/server/auth/rate-limit';
import {
	deleteSessionTokenCookie,
	sessionCookieName,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/auth/session';

const bucket = new RefillingTokenBucket<string>(100, 1);

const handleRateLimit: Handle = async ({ event, resolve }) => {
	// note: assumes X-Forwarded-For will always be defined.
	const clientIP = event.request.headers.get('X-Forwarded-For');
	if (clientIP === null) {
		return resolve(event);
	}
	let cost: number;
	if (event.request.method === 'GET' || event.request.method === 'OPTIONS') {
		cost = 1;
	} else {
		cost = 3;
	}
	if (!bucket.consume(clientIP, cost)) {
		return new Response('Too many requests', {
			status: 429
		});
	}
	return resolve(event);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(sessionCookieName) ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);

	if (session !== null) {
		setSessionTokenCookie(event, token, session.expiresAt);
	} else {
		deleteSessionTokenCookie(event);
	}

	event.locals.session = session;
	event.locals.user = user;
	return resolve(event);
};

export const handle = sequence(handleRateLimit, handleAuth);
