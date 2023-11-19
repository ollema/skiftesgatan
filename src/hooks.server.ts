import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';
import { maybeGetApartmentForUser } from '$lib/server/apartments';

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
			if (event.locals.user) {
				const apartment = await maybeGetApartmentForUser(event.locals.pb, event.locals.user);
				if (apartment) {
					event.locals.apartment = {
						id: apartment.id,
						apartment: apartment.apartment
					};
				}
			}
		}
	}

	const response = await resolve(event);
	return response;
}
