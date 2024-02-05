import type { User, Apartment } from './lib/types';
import type { MetaTagsProps } from 'svelte-meta-tags';

declare global {
	declare namespace App {
		interface PageData {
			user?: User;
			apartment?: Apartment;
			meta: MetaTagsProps;
		}
	}
}

export {};
