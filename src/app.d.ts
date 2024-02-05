import type { User, Apartment } from './lib/types';

declare global {
	declare namespace App {
		interface PageData {
			user?: User;
			apartment?: Apartment;
			meta: {
				title: string;
				description: string;
			};
		}
	}
}

export {};
