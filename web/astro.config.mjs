import mdx from '@astrojs/mdx'
import node from '@astrojs/node'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), mdx()],
  prefetch: true,
  output: 'server',
  trailingSlash: 'never',
  redirects: {
    'en/index': '/en',
    ru: '/',
    'ru/index': '/',
    index: '/'
  },
  adapter: node({
    mode: 'standalone'
  })
})
