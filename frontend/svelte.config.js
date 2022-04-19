import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(
			{ 
				out: 'node_build',
				precompress: false,
				envPrefix: 'ASH_',
		 	}
		),
		floc: false,
	}
};

export default config;
