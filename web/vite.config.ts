import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SITE_ORIGIN } from './src/lib/common/constants.ts';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({ precompress: true }),
      csrf: { trustedOrigins: [SITE_ORIGIN] },
    }),
  ],
  optimizeDeps: {
    include: [
      '@threlte/core',
      '@threlte/extras',
      'three',
      'three/tsl',
      'three/webgpu',
      'three/addons/environments/RoomEnvironment.js',
      'three/addons/geometries/RoundedBoxGeometry.js',
      'three/addons/loaders/SVGLoader.js',
      'three/addons/tsl/display/BloomNode.js',
      'three/addons/tsl/display/DenoiseNode.js',
      'three/addons/tsl/display/GaussianBlurNode.js',
      'three/addons/tsl/display/GTAONode.js',
      'three/addons/tsl/display/Lut3DNode.js',
      'three/addons/tsl/display/TRAANode.js',
      'three/addons/utils/BufferGeometryUtils.js',
    ],
  },
  server: {
    host: true,
    port: 5701,
    strictPort: true,
    allowedHosts: ['a-sharapov.com', 'www.a-sharapov.com', 'localhost', 'web'],
  },
});
