import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@fullcalendar/core',
      '@fullcalendar/daygrid',
      '@fullcalendar/interaction',
      '@fullcalendar/react',
    ],
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  },
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('@fullcalendar')) return 'calendar-vendor'
          if (id.includes('firebase')) return 'firebase-vendor'
          if (id.includes('react-icons')) return 'icons-vendor'
          if (id.includes('lucide-react')) return 'lucide-vendor'
          if (id.includes('select-philippines-address')) return 'address-vendor'
          if (id.includes('axios')) return 'http-vendor'
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  }
})
