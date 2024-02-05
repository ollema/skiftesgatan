import { pb, maybeGetApartmentForUser } from '$lib/pocketbase';
import { Preferences } from '@capacitor/preferences';
import type { MetaTagsProps } from 'svelte-meta-tags';

export const ssr = false;
export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch, url }) => {
	// TODO: figure out if there is a better way to wait for the auth store to be fully loaded
	await Preferences.get({ key: 'pb_auth' });

	if (!pb.authStore.isValid) {
		pb.authStore.clear();
	}
	const user = pb.authStore.model || undefined;
	const apartment = user ? await maybeGetApartmentForUser(user, fetch) : undefined;

	const meta: MetaTagsProps = {
		title: 'BRF Skiftesgatan 4',
		description: 'En bostadsrättsförening i Hisingen, Göteborg.',
		canonical: new URL(url.pathname, url.origin).href,
		openGraph: {
			type: 'website',
			url: new URL(url.pathname, url.origin).href,
			locale: 'sv_SE',
			title: 'BRF Skiftesgatan 4',
			description: 'En bostadsrättsförening i Hisingen, Göteborg.',
			images: [
				{
					url: new URL('/apple-splash-landscape-dark-1136x640.png', url.origin).href,
					width: 1136,
					height: 640,
					alt: 'BRF Skiftesgatan 4'
				}
			]
		}
	};

	return {
		user: user,
		apartment: apartment,
		meta: meta
	};
};
