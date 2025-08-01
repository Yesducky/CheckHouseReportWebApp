import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    port: 5174,
    host: true,
    https: true,
    proxy: {
      '/api': {
        target: 'http://192.168.33.41:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
