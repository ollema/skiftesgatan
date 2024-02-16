import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';

import sequence from 'svelte-sequential-preprocessor';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { preprocessMeltUI } from '@melt-ui/pp';

const adapter = process.env.ADAPTER === 'node' ? adapterNode : adapterStatic;
const adapterConfig =
	process.env.ADAPTER === 'node'
		? {
				out: 'build-node'
			}
		: {
				pages: 'build-static',
				assets: 'build-static',
				fallback: 'index.html',
				precompress: false,
				strict: true
			};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: sequence([vitePreprocess({}), preprocessMeltUI()]),
	kit: {
		adapter: adapter(adapterConfig),
		csrf: {
			checkOrigin: process.env.NODE_ENV === 'development' ? false : true
		},
		serviceWorker: {
			register: false
		}
	}
};

export default config;
