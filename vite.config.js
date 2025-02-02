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
      '@world': resolve(__dirname, 'src/views/WorldEngine'),
      'phaser': resolve(__dirname, 'node_modules/phaser/dist/phaser.js')
    }
  },
  optimizeDeps: {
    include: ['phaser']
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/views/pack_open/test_pack_open.html')
      }
    }
  },
  publicDir: 'assets'
})
