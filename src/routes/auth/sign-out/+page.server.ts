import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import { route } from '$lib/routes';

export const actions = {
	default: (event) => {
		if (event.locals.session === null) {
			return fail(401, {
				message: 'Inte autentiserad'
			});
		}
		invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		return redirect(302, route('/'));
	}
};
