import { fail, error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load = async ({ locals }) => {
	return {
		providers: (await locals.pb.collection('users').listAuthMethods()).authProviders
	};
};

export const actions = {
	default: async ({ locals, request, cookies }) => {
		const { authProviders } = await locals.pb.collection('users').listAuthMethods();

		const data = await request.formData();
		const authProvider = data.get('authProvider');
		if (!authProvider) {
			return fail(400, { authProvider, missing: true });
		}

		const provider = authProviders.find((method) => method.name === authProvider);
		if (!provider) {
			throw error(500, `unknown auth provider: ${authProvider}`);
		}

		cookies.set('provider', JSON.stringify(provider), {
			path: '/',
			maxAge: 60 * 5 // 5 minutes
		});

		throw redirect(302, provider.authUrl + env.AUTH_REDIRECT_URL);
	}
};
