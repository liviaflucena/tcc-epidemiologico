import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // remove o prefixo /api antes de encaminhar ao Flask
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})