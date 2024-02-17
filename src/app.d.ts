import type { User, Apartment } from './lib/types';
import { TypedPocketBase } from '$lib/pocketbase-types';

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
		interface Locals {
			pb: TypedPocketBase;
		}
	}
}

export {};
