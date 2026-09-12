import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Firebase + Recharts = large bundle; acknowledged and acceptable for now
    chunkSizeWarningLimit: 1600,
  },
})
