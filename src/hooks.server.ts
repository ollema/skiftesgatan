import PocketBase from 'pocketbase';

export async function handle({ event, resolve }) {
	event.locals.pb = new PocketBase('https://pocketbase.skiftesgatan.com');
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		event.locals.pb.authStore.isValid && (await event.locals.pb.collection('users').authRefresh());
		const model = event.locals.pb.authStore.model;
		if (model) {
			event.locals.user = {
				id: model.id,
				username: model.username,
				name: model.name,
				avatar: model.avatar
			};
		}
	} catch (_) {
		event.locals.pb.authStore.clear();
	}

	const response = await resolve(event);
	response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie());
	return response;
}
