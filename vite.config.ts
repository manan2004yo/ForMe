import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/barcode': {
        target: 'https://world.openfoodfacts.org/api/v2/product',
        changeOrigin: true,
        rewrite: (path) => `${path.replace(/^\/api\/barcode\//, '')}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,image_url`,
        headers: {
          'User-Agent': 'FORME-FitnessApp/1.0 (contact@forme.app)'
        }
      },
      '/api/food-search': {
        target: 'https://world.openfoodfacts.org/api/v2/search',
        changeOrigin: true,
        rewrite: (path) => `${path.replace(/^\/api\/food-search/, '')}&fields=code,product_name,brands,nutriments,serving_size,serving_quantity,image_url&page_size=20`,
        headers: {
          'User-Agent': 'FORME-FitnessApp/1.0 (contact@forme.app)'
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
  },
  build: {
    // Firebase + Recharts = large bundle; acknowledged and acceptable for now
    chunkSizeWarningLimit: 1600,
    cssTarget: 'chrome61',
  },
})
