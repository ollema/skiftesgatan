import { encodeBase32LowerCase, encodeBase32UpperCaseNoPadding } from '@oslojs/encoding';

export function generateId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}

export function generateRandomOTP(): string {
	const bytes = new Uint8Array(5);
	crypto.getRandomValues(bytes);
	const code = encodeBase32UpperCaseNoPadding(bytes);
	return code;
}
