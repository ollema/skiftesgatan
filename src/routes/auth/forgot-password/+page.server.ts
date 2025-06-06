import { fail, redirect } from '@sveltejs/kit';
import { getUserFromApartment, verifyApartmentInput } from '$lib/server/auth/user';
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie
} from '$lib/server/auth/password-reset';
import { RefillingTokenBucket } from '$lib/server/auth/rate-limit';
import { generateSessionToken } from '$lib/server/auth/session';
import { route } from '$lib/routes';

const ipBucket = new RefillingTokenBucket<string>(3, 60);
const userBucket = new RefillingTokenBucket<string>(3, 60);

export const actions = {
	default: async (event) => {
		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');
		console.log('[auth] Forgot password form action triggered');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during forgot-password check', { ip: clientIP });
			return fail(429, {
				message: 'För många förfrågningar',
				apartment: ''
			});
		}

		const formData = await event.request.formData();
		const apartment = formData.get('apartment');

		if (typeof apartment !== 'string') {
			console.log('[auth] Invalid or missing apartment field during forgot-password', {
				ip: clientIP
			});
			return fail(400, {
				message: 'Ogiltiga eller saknade fält',
				apartment: ''
			});
		}
		if (!verifyApartmentInput(apartment)) {
			console.log('[auth] Invalid apartment format during forgot-password', { apartment });
			return fail(400, {
				message: 'Ogiltigt lägenhetsnummer',
				apartment
			});
		}
		const user = await getUserFromApartment(apartment);
		if (user === null) {
			console.log('[auth] Account does not exist during forgot-password', { apartment });
			return fail(400, {
				message: 'Kontot finns inte',
				apartment
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during forgot-password consume', {
				ip: clientIP,
				apartment
			});
			return fail(400, {
				message: 'För många förfrågningar',
				apartment
			});
		}
		if (!userBucket.consume(user.id, 1)) {
			console.log('[auth] User rate limit exceeded during forgot-password', {
				apartment,
				email: user.email,
				userId: user.id
			});
			return fail(400, {
				message: 'För många förfrågningar',
				apartment
			});
		}
		invalidateUserPasswordResetSessions(user.id);
		const sessionToken = generateSessionToken();
		const session = createPasswordResetSession(sessionToken, user.id, user.email);
		sendPasswordResetEmail(session.email, session.code);
		setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log('[auth] Password reset email sent successfully', {
			apartment,
			email: session.email
		});
		console.log('[auth] Redirecting to /auth/reset-password/verify-email', {
			apartment,
			email: session.email
		});
		return redirect(302, route('/auth/reset-password/verify-email'));
	}
};
