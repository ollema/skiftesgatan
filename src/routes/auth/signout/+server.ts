import { redirect } from '@sveltejs/kit';

export const GET = async ({ locals, cookies }) => {
	locals.pb.authStore.clear();
	cookies.delete('pb_auth', { path: '/' });

	redirect(302, '/');
};
