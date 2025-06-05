/* eslint-disable @typescript-eslint/consistent-type-imports */
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth/session').SessionValidationResult['user'];
			session: import('$lib/server/auth/session').SessionValidationResult['session'];
		}
		interface PageData {
			user: import('$lib/server/auth/session').SessionValidationResult['user'];
		}
	}
}

export {};
