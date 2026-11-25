import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Permite usar VITE_API_URL para apuntar a otro backend
const API_URL = process.env.VITE_API_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true
      }
    }
  }
})
