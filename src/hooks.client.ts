import { goto } from '$app/navigation';
import { active } from '$lib/active';

import { App } from '@capacitor/app';

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
