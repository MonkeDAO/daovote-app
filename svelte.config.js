import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-vercel';
import { mdsvex } from 'mdsvex';

// mdsvex config
const mdsvexConfig = {
	extensions: ['.svelte.md', '.md', '.svx'],
	layout: {
		_: './src/mdsvexlayout.svelte' // default mdsvex layout
	},
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.html', '.svx', ...mdsvexConfig.extensions],
	preprocess: [
		mdsvex(mdsvexConfig),
		preprocess({
			postcss: true
		})
	],

	// Docs: https://github.com/sveltejs/kit/blob/master/packages/adapter-netlify/README.md
	kit: {
		adapter: adapter({
			runtime: 'nodejs18.x',
		}),
	}
};

export default config;
