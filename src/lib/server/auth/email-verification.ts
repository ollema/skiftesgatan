import { encodeBase32 } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateRandomOTP } from '$lib/server/auth/utils';
import { ExpiringTokenBucket } from '$lib/server/auth/rate-limit';
import { sendVerificationEmail as sendVerificationEmailViaResend } from '$lib/server/resend';
import { dev } from '$app/environment';

export const emailVerificationRequestCookieName = 'email_verification';

export function getUserEmailVerificationRequest(
	userId: string,
	id: string
): EmailVerificationRequest | null {
	const request = db
		.select()
		.from(table.emailVerificationRequest)
		.where(
			and(
				eq(table.emailVerificationRequest.id, id),
				eq(table.emailVerificationRequest.userId, userId)
			)
		)
		.get();

	return request || null;
}

export function createEmailVerificationRequest(
	userId: string,
	email: string
): EmailVerificationRequest {
	deleteUserEmailVerificationRequest(userId);

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

	db.insert(table.emailVerificationRequest).values(request).run();

	return request;
}

export function deleteUserEmailVerificationRequest(userId: string): void {
	db.delete(table.emailVerificationRequest)
		.where(eq(table.emailVerificationRequest.userId, userId))
		.run();
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
	try {
		await sendVerificationEmailViaResend(email, code);
	} catch (error) {
		console.error('Failed to send verification email:', error);
		throw error;
	}
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

export function getUserEmailVerificationRequestFromRequest(
	event: RequestEvent
): EmailVerificationRequest | null {
	if (event.locals.user === null) {
		return null;
	}
	const id = event.cookies.get(emailVerificationRequestCookieName) ?? null;
	if (id === null) {
		return null;
	}
	const request = getUserEmailVerificationRequest(event.locals.user.id, id);
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
