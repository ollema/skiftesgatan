import sequence from 'svelte-sequential-preprocessor';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { preprocessMeltUI } from '@melt-ui/pp';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: sequence([vitePreprocess({}), preprocessMeltUI()]),
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: true
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
