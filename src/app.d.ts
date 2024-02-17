import { ApartmentsResponse, TypedPocketBase } from '$lib/pocketbase-types';
import type { AuthModel } from 'pocketbase';

declare global {
	declare namespace App {
		interface PageData {
			user?: AuthModel;
			apartment?: ApartmentsResponse;
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
