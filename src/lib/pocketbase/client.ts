import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

export const pb = new PocketBase('https://skiftesgatan.com') as TypedPocketBase;
