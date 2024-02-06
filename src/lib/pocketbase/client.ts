import PocketBase, { AsyncAuthStore } from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';
import { Preferences } from '@capacitor/preferences';

const authKey = 'pb_auth';

const preferencesAsyncAuthStore = new AsyncAuthStore({
	save: async (serialized) => await Preferences.set({ key: authKey, value: serialized }),
	clear: async () => await Preferences.remove({ key: authKey })
});

export const pb = new PocketBase(
	'https://skiftesgatan.com',
	preferencesAsyncAuthStore
) as TypedPocketBase;

export async function loadInitial() {
	const serialized = (await Preferences.get({ key: authKey })).value;
	const parsed = JSON.parse(serialized || '{}') || {};
	if (serialized) {
		pb.authStore.save(parsed.token || '', parsed.model || null);
	}
}
