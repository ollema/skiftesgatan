import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		if (event.locals.session === null) {
			return fail(401, {
				message: 'Not authenticated'
			});
		}
		invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		return redirect(302, '/');
	}
};
