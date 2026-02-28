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
  }
})