import PocketBase, { AsyncAuthStore } from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';
import { Preferences } from '@capacitor/preferences';

const authKey = 'pb_auth';

const store = new AsyncAuthStore({
	initial: Preferences.get({ key: authKey }),
	save: async (serialized) => await Preferences.set({ key: authKey, value: serialized }),
	clear: async () => await Preferences.remove({ key: authKey })
});

export const pb = new PocketBase('https://skiftesgatan.com', store) as TypedPocketBase;
