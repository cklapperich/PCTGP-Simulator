import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    host: true
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
    // Copy all assets to dist/assets maintaining directory structure
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep original path structure for assets
          if (assetInfo.name.startsWith('assets/')) {
            return assetInfo.name;
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Copy the entire assets directory to dist
  publicDir: 'assets'
})
