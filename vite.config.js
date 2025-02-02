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
      '@assets': resolve(__dirname, 'assets'),
      '@world': resolve(__dirname, 'src/views/WorldEngine')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    // Ensure source files are copied to dist maintaining directory structure
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        packOpen: resolve(__dirname, 'src/views/pack_open/test_pack_open.html')
      },
      external: [
        'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
        'phaser'
      ]
    }
  },
  // This ensures the assets directory is copied as-is to dist
  publicDir: 'assets'
})
