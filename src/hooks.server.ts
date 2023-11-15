import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

export async function handle({ event, resolve }) {
	event.locals.pb = new PocketBase('https://pocketbase.skiftesgatan.com') as TypedPocketBase;
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	if (event.locals.pb.authStore.isValid) {
		const record = event.locals.pb.authStore.model;
		if (record) {
			event.locals.user = {
				id: record.id,
				username: record.username,
				name: record.name
			};
		}
	}

	const response = await resolve(event);
	return response;
}
