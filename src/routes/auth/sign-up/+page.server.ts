import { fail, redirect } from '@sveltejs/kit';
import { checkEmailAvailability, verifyEmailInput } from '$lib/server/auth/email';
import { createUser, verifyApartmentInput } from '$lib/server/auth/user';
import { RefillingTokenBucket } from '$lib/server/auth/rate-limit';
import { verifyPasswordStrength } from '$lib/server/auth/password';
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '$lib/server/auth/session';
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from '$lib/server/auth/email-verification';
import { route } from '$lib/routes';

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export const load = (event) => {
	console.log('[auth] Sign up page load function triggered');

	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			console.log(
				'[auth] User is logged in but email is not verified, redirecting to /auth/verify-email',
				{ apartment: event.locals.user.apartment }
			);
			return redirect(302, route('/auth/verify-email'));
		}
		console.log('[auth] User is already logged in, redirecting to /', {
			apartment: event.locals.user.apartment
		});
		return redirect(302, route('/'));
	}
	return {};
};

export const actions = {
	default: async (event) => {
		// TODO: assumes X-Forwarded-For is always included.
		const clientIP = event.request.headers.get('X-Forwarded-For');
		console.log('[auth] Sign up form action triggered');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during sign-up check', { ip: clientIP });
			return fail(429, {
				message: 'För många förfrågningar',
				email: '',
				apartment: ''
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email');
		const apartment = formData.get('apartment');
		const password = formData.get('password');

		if (
			typeof email !== 'string' ||
			typeof apartment !== 'string' ||
			typeof password !== 'string'
		) {
			console.log('[auth] Invalid or missing fields during sign-up', { ip: clientIP });
			return fail(400, {
				message: 'Ogiltiga eller saknade fält',
				email: '',
				apartment: ''
			});
		}
		if (email === '' || password === '' || apartment === '') {
			console.log('[auth] Email, apartment, or password is empty during sign-up', { ip: clientIP });
			return fail(400, {
				message: 'Ange ditt lägenhetsnummer, e-postadress och lösenord',
				email: '',
				apartment: ''
			});
		}
		if (!verifyEmailInput(email)) {
			console.log('[auth] Invalid email format during sign-up', { email });
			return fail(400, {
				message: 'Ogiltig e-postadress',
				email,
				apartment
			});
		}
		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			console.log('[auth] Email is already used during sign-up', { email });
			return fail(400, {
				message: 'E-postadressen används redan',
				email,
				apartment
			});
		}
		if (!verifyApartmentInput(apartment)) {
			console.log('[auth] Invalid apartment format during sign-up', { apartment, email });
			return fail(400, {
				message: 'Ogiltigt lägenhetsnamn',
				email,
				apartment
			});
		}
		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			console.log('[auth] Weak password during sign-up', { email, apartment });
			return fail(400, {
				message: 'Svagt lösenord',
				email,
				apartment
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			console.log('[auth] IP rate limit exceeded during sign-up consume', {
				ip: clientIP,
				email,
				apartment
			});
			return fail(429, {
				message: 'För många förfrågningar',
				email,
				apartment
			});
		}
		const user = await createUser(apartment, email, password);
		const emailVerificationRequest = createEmailVerificationRequest(user.id, user.email);
		sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		const sessionToken = generateSessionToken();
		const session = createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log('[auth] Registration successful, redirecting to /auth/verify-email', {
			apartment,
			email
		});
		throw redirect(302, route('/auth/verify-email'));
	}
};
