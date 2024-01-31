import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL) as TypedPocketBase;
