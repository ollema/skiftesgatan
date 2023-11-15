import type TypedPocketBase from './lib/pocketbase-types';
import type { User } from './lib/types';

declare global {
	declare namespace App {
		interface Locals {
			pb: TypedPocketBase;
			user?: User;
		}
	}
}

export {};
