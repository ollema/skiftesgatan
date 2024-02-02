import { goto } from '$app/navigation';
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', async (event) => {
	// example url: https://skiftesgatan.com/laundry/calendar
	// slug = /laundry/calendar
	const slug = event.url.split('.com').pop();
	if (slug) {
		await goto(slug);
	}

	// if no match, do nothing - let regular routing logic take over
});
