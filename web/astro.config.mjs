import node from '@astrojs/node'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  prefetch: true,
  output: 'server',
  redirects: {
    ru: '/',
    en: '/en/index',
    '/ru/index': '/',
    '/index': '/'
  },
  adapter: node({
    mode: 'standalone'
  })
})
