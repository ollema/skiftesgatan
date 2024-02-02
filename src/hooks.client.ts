import { goto } from '$app/navigation';
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', async (event) => {
	const url = new URL(event.url);
	// remove protocol, host and port
	await goto(url.pathname + url.search + url.hash);
});
