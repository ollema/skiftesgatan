import sequence from 'svelte-sequential-preprocessor';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { preprocessMeltUI } from '@melt-ui/pp';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: sequence([vitePreprocess({}), preprocessMeltUI()]),
	kit: {
		adapter: adapter({
			pages: 'pb_public',
			assets: 'pb_public',
			fallback: 'index.html',
			precompress: true,
			strict: true
		}),
		csrf: {
			checkOrigin: process.env.NODE_ENV === 'development' ? false : true
		}
	},
	vitePlugin: {
		inspector: true
	}
};

export default config;
