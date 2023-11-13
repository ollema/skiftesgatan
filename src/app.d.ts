import PocketBase from 'pocketbase';
import type { User } from './lib/types';

declare global {
	declare namespace App {
		interface Locals {
			pb: PocketBase;
			user?: User;
		}
	}
}

export {};
