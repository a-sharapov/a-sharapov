import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: '_build',
			assets: '_build',
			fallback: '404.html',
			precompress: false
		}),
		prerender: {
			default: true
		},
		floc: false,
	}
};

export default config;
