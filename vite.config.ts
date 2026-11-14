import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    // Rapier's compat build inlines its WebAssembly binary as base64.
    chunkSizeWarningLimit: 4000,
  },
})
