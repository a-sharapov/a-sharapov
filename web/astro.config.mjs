import node from '@astrojs/node'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  prefetch: true,
  output: 'server',
  redirects: {
    '/rs/': {
      status: 301,
      destination: '/'
    }
  },
  adapter: node({
    mode: 'standalone'
  })
})
