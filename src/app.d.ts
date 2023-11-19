import type TypedPocketBase from './lib/pocketbase-types';
import type { User, Apartment } from './lib/types';

declare global {
	declare namespace App {
		interface Locals {
			pb: TypedPocketBase;
			user?: User;
			apartment?: Apartment;
		}
	}
}

export {};
