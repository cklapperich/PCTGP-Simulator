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
      '@world': resolve(__dirname, 'src/WorldEngine'),
      '@rules': resolve(__dirname, 'src/RulesEngine'),
      '@assets': resolve(__dirname, 'assets')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  },
  publicDir: 'assets'
})
