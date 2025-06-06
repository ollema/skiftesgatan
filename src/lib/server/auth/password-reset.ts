import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import type { User } from '$lib/server/auth/user';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateRandomOTP } from '$lib/server/auth/utils';

import { dev } from '$app/environment';

export const passwordResetSessionCookieName = 'password_reset_session';

export function createPasswordResetSession(
	token: string,
	userId: string,
	email: string
): PasswordResetSession {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session: PasswordResetSession = {
		id: sessionId,
		userId,
		email,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		code: generateRandomOTP(),
		emailVerified: false
	};

	db.insert(table.passwordResetSession).values(session).run();

	return session;
}

export function validatePasswordResetSessionToken(
	token: string
): PasswordResetSessionValidationResult {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session = db
		.select()
		.from(table.passwordResetSession)
		.where(eq(table.passwordResetSession.id, sessionId))
		.get();

	if (!session) {
		return { session: null, user: null };
	}

	const user = db.select().from(table.user).where(eq(table.user.id, session.userId)).get();

	if (!user) {
		db.delete(table.passwordResetSession).where(eq(table.passwordResetSession.id, sessionId)).run();
		return { session: null, user: null };
	}

	if (Date.now() > session.expiresAt.getTime()) {
		db.delete(table.passwordResetSession).where(eq(table.passwordResetSession.id, sessionId)).run();
		return { session: null, user: null };
	}

	return { session, user };
}

export function setPasswordResetSessionAsEmailVerified(sessionId: string): void {
	db.update(table.passwordResetSession)
		.set({ emailVerified: true })
		.where(eq(table.passwordResetSession.id, sessionId))
		.run();
}

export function invalidateUserPasswordResetSessions(userId: string): void {
	db.delete(table.passwordResetSession).where(eq(table.passwordResetSession.userId, userId)).run();
}

export function validatePasswordResetSessionRequest(
	event: RequestEvent
): PasswordResetSessionValidationResult {
	const token = event.cookies.get(passwordResetSessionCookieName) ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const result = validatePasswordResetSessionToken(token);
	if (result.session === null) {
		deletePasswordResetSessionTokenCookie(event);
	}
	return result;
}

export function setPasswordResetSessionTokenCookie(
	event: RequestEvent,
	token: string,
	expiresAt: Date
): void {
	event.cookies.set(passwordResetSessionCookieName, token, {
		expires: expiresAt,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		secure: !dev
	});
}

export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set(passwordResetSessionCookieName, '', {
		maxAge: 0,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		secure: !dev
	});
}

// TODO: replace with actual email sending logic
export function sendPasswordResetEmail(email: string, code: string): void {
	console.log(`To ${email}: Your reset code is ${code}`);
}

export interface PasswordResetSession {
	id: string;
	userId: string;
	email: string;
	code: string;
	expiresAt: Date;
	emailVerified: boolean;
}

export type PasswordResetSessionValidationResult =
	| { session: PasswordResetSession; user: User }
	| { session: null; user: null };
