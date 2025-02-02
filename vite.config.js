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
    // Ensure source files are copied to dist maintaining directory structure
    copyPublicDir: true,
    rollupOptions: {
      input: {
        // Only include the pack open test page
        packOpen: resolve(__dirname, 'src/views/pack_open/test_pack_open.html')
      },
      external: [
        'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js'
      ]
    }
  },
  // This ensures the assets directory is copied as-is to dist
  publicDir: 'assets',
  // Exclude game.js and its dependencies from the build
  optimizeDeps: {
    exclude: ['src/game.js', '@world/GameState.js', '@world/WorldEngineSimple.js']
  }
})
