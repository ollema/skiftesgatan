import { encodeBase32 } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateRandomOTP } from '$lib/server/auth/utils';
import { ExpiringTokenBucket } from '$lib/server/auth/rate-limit';
import { dev } from '$app/environment';

export const emailVerificationRequestCookieName = 'email_verification';

export async function getUserEmailVerificationRequest(
	userId: string,
	id: string
): Promise<EmailVerificationRequest | null> {
	const requests = await db
		.select()
		.from(table.emailVerificationRequest)
		.where(
			and(
				eq(table.emailVerificationRequest.id, id),
				eq(table.emailVerificationRequest.userId, userId)
			)
		)
		.limit(1);

	if (requests.length === 0) {
		return null;
	}

	return requests[0];
}

export async function createEmailVerificationRequest(
	userId: string,
	email: string
): Promise<EmailVerificationRequest> {
	await deleteUserEmailVerificationRequest(userId);

	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32(idBytes).toLowerCase();
	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

	const request: EmailVerificationRequest = {
		id,
		userId,
		code,
		email,
		expiresAt
	};

	await db.insert(table.emailVerificationRequest).values(request);

	return request;
}

export async function deleteUserEmailVerificationRequest(userId: string): Promise<void> {
	await db
		.delete(table.emailVerificationRequest)
		.where(eq(table.emailVerificationRequest.userId, userId));
}

export function sendVerificationEmail(email: string, code: string): void {
	console.log(`To ${email}: Your verification code is ${code}`);
}

export function setEmailVerificationRequestCookie(
	event: RequestEvent,
	request: EmailVerificationRequest
): void {
	event.cookies.set(emailVerificationRequestCookieName, request.id, {
		httpOnly: true,
		path: '/',
		secure: !dev,
		sameSite: 'lax',
		expires: request.expiresAt
	});
}

export function deleteEmailVerificationRequestCookie(event: RequestEvent): void {
	event.cookies.set(emailVerificationRequestCookieName, '', {
		httpOnly: true,
		path: '/',
		secure: !dev,
		sameSite: 'lax',
		maxAge: 0
	});
}

export async function getUserEmailVerificationRequestFromRequest(
	event: RequestEvent
): Promise<EmailVerificationRequest | null> {
	if (event.locals.user === null) {
		return null;
	}
	const id = event.cookies.get(emailVerificationRequestCookieName) ?? null;
	if (id === null) {
		return null;
	}
	const request = await getUserEmailVerificationRequest(event.locals.user.id, id);
	if (request === null) {
		deleteEmailVerificationRequestCookie(event);
	}
	return request;
}

export const sendVerificationEmailBucket = new ExpiringTokenBucket<string>(3, 60 * 10);

export interface EmailVerificationRequest {
	id: string;
	userId: string;
	code: string;
	email: string;
	expiresAt: Date;
}
