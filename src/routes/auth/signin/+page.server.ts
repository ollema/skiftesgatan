import { fail, error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const actions = {
	default: async ({ locals, request, cookies }) => {
		const { authProviders } = await locals.pb.collection('users').listAuthMethods();

		const data = await request.formData();

		const authProvider = data.get('authProvider');
		if (!authProvider) {
			return fail(400, { authProvider, missing: true });
		}

		interface AuthMethod {
			name: string;
		}
		const provider = authProviders.find((method: AuthMethod) => method.name === authProvider);
		if (!provider) {
			throw error(500, `unknown auth provider: ${authProvider}`);
		}

		cookies.set('provider', JSON.stringify(provider), {
			path: '/',
			maxAge: 60 * 5 // 5 minutes
		});

		const redirectUrl = provider.authUrl + env.AUTH_REDIRECT_URL;

		throw redirect(302, redirectUrl);
	}
};
