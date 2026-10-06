import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vue and the router change less often than the site, so they keep
        // their own long-lived chunk.
        manualChunks: {
          vue: ['vue', 'vue-router'],
        },
      },
    },
  },
})
