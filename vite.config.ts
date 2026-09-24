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
    chunkSizeWarningLimit: 1600,
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase'
            if (id.includes('@zxing')) return 'vendor-zxing'
            if (id.includes('recharts')) return 'vendor-ui'
            if (id.includes('framer-motion')) return 'vendor-ui'
            if (id.includes('react-dom') || 
                id.includes('react-router')) return 'vendor-react'
          }
        },
      },
    },
  },
})
