import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash((event) => {
	return {
		user: event.locals.user
	};
});
