import PocketBase, { BaseAuthStore, type AuthModel } from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';
import { Preferences } from '@capacitor/preferences';

class PreferencesAuthStore extends BaseAuthStore {
	private queue: Array<() => Promise<void>> = [];

	constructor() {
		super();
		this._enqueue(() => this._loadInitial());
	}

	save(token: string, model?: AuthModel): void {
		super.save(token, model);
		this._enqueue(
			async () => await Preferences.set({ key: authKey, value: JSON.stringify({ token, model }) })
		);
	}

	clear(): void {
		super.clear();
		this._enqueue(async () => await Preferences.remove({ key: authKey }));
	}

	private async _loadInitial() {
		try {
			const result = await Preferences.get({ key: authKey });
			const parsed = JSON.parse(result.value || '{}') || {};
			this.save(parsed.token || '', parsed.model || null);
		} catch (_) {
			// do nothing
		}
	}

	private _enqueue(asyncCallback: () => Promise<void>) {
		this.queue.push(asyncCallback);

		if (this.queue.length == 1) {
			this._dequeue();
		}
	}

	private _dequeue() {
		if (!this.queue.length) {
			return;
		}

		this.queue[0]().finally(() => {
			this.queue.shift();

			if (!this.queue.length) {
				return;
			}

			this._dequeue();
		});
	}
}

const authKey = 'pb_auth';

export const pb = new PocketBase(
	'https://skiftesgatan.com',
	new PreferencesAuthStore()
) as TypedPocketBase;
