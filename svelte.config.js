import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...mdsvexConfig.extensions],
	preprocess: [preprocess({postcss: true}), mdsvex(mdsvexConfig)],
	kit: {
		adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: false,
      strict: true
    })
	}
};

export default config;
