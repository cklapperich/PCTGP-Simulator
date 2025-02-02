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
      }
    }
  },
  // This ensures the assets directory is copied as-is to dist
  publicDir: 'assets',
  // Exclude the world engine files since we're not using them
  optimizeDeps: {
    exclude: ['src/game.js', '@world/GameState.js', '@world/WorldEngineSimple.js'],
    // Ensure Phaser is properly processed
    include: ['phaser']
  }
})
