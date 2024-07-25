import node from '@astrojs/node'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  prefetch: true,
  output: 'server',
  redirects: {},
  adapter: node({
    mode: 'standalone'
  })
})
