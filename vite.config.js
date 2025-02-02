import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    host: true  // Allow network access
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'assets')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        packOpen: resolve(__dirname, 'src/views/pack_open/test_pack_open.html')
      },
      external: [
        'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js'
      ]
    },
    // Ensure assets are copied to dist
    assetsDir: 'assets',
    copyPublicDir: true
  },
  publicDir: 'assets'
})
