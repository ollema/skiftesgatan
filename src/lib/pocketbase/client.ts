import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

export const pb = new PocketBase('https://pocketbase.skiftesgatan.com') as TypedPocketBase;
