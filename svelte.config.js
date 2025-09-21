import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'@styles': 'src/styles',
			'@styles/*': 'src/styles/*',
			'@components': 'src/lib/components',
			'@components/*': 'src/lib/components/*',
			'@resources': 'src/resources',
			'@resources/*': 'src/resources/*'
		},
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
