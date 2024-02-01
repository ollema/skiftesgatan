import {
	createAppleSplashScreens,
	defineConfig,
	minimal2023Preset
} from '@vite-pwa/assets-generator/config';
import { readFile } from 'node:fs/promises';

const basePath = '%sveltekit.assets%/';

export default defineConfig({
	headLinkOptions: {
		basePath: basePath,
		xhtml: true
	},
	preset: {
		...minimal2023Preset,
		appleSplashScreens: createAppleSplashScreens({
			async darkImageResolver(imageName) {
				return imageName === 'static/icon.svg' ? await readFile('static/icon-dark.svg') : undefined;
			},
			padding: 0.2,
			resizeOptions: { background: '#fad899', fit: 'contain' },
			darkResizeOptions: { background: '#4a5d47', fit: 'contain' },
			linkMediaOptions: {
				log: true,
				addMediaScreen: true,
				basePath: basePath,
				xhtml: true
			},
			png: {
				compressionLevel: 8,
				quality: 80
			},
			name: (landscape, size, dark) => {
				return `apple-splash-${landscape ? 'landscape' : 'portrait'}-${
					typeof dark === 'boolean' ? (dark ? 'dark-' : 'light-') : ''
				}${size.width}x${size.height}.png`;
			}
		})
	},
	images: ['static/icon.svg']
});
