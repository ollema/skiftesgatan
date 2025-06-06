import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import type { RequestEvent } from '@sveltejs/kit';
import type { session } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export type Session = typeof session.$inferSelect;

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth_session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export function createSession(token: string, userId: string): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	db.insert(table.session).values(session).run();
	return session;
}

export function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = db
		.select({
			// TODO: adjust user table here to tweak returned data
			user: {
				id: table.user.id,
				apartment: table.user.apartment,
				email: table.user.email,
				emailVerified: table.user.emailVerified
			},
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId))
		.all();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		db.delete(table.session).where(eq(table.session.id, session.id)).run();
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		db.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id))
			.run();
	}

	return { session, user };
}

export type SessionValidationResult = ReturnType<typeof validateSessionToken>;

export function invalidateSession(sessionId: string): void {
	db.delete(table.session).where(eq(table.session.id, sessionId)).run();
}

export function invalidateUserSessions(userId: string): void {
	db.delete(table.session).where(eq(table.session.userId, userId)).run();
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}
