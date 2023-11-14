import PocketBase from 'pocketbase';

export async function handle({ event, resolve }) {
	event.locals.pb = new PocketBase('https://pocketbase.skiftesgatan.com');
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
