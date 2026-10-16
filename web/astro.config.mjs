// @ts-check

import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { allowedHosts, redirects } from './defaults';

export default defineConfig({
  site: 'https://a-sharapov.com',
  adapter: node({
    mode: 'standalone',
    bodySizeLimit: 64 * 1024,
  }),
  output: 'server',
  integrations: [svelte()],
  prefetch: true,
  trailingSlash: 'ignore',
  compressHTML: true,
  redirects,
  server: {
    host: true,
  },
  devToolbar: {
    enabled: false,
  },
  security: {
    checkOrigin: false,
  },
  vite: {
    ssr: {
      noExternal: ['three'],
    },
    optimizeDeps: {
      include: [
        'three',
        'three/addons/loaders/SVGLoader.js',
        'three/addons/environments/RoomEnvironment.js',
        'three/addons/utils/BufferGeometryUtils.js',
      ],
    },
    build: {
      cssMinify: 'lightningcss',
      sourcemap: false,
    },
    server: {
      allowedHosts,
      strictPort: true,
    },
  },
});
