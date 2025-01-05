import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    proxy: {
      '/companies': {
        target: process.env.VITE_BACKEND_API_DOMAIN,
        changeOrigin: true,
        secure: false
      },
      '/employees': {
        target: process.env.VITE_BACKEND_API_DOMAIN,
        changeOrigin: true,
        secure: false
      },
      '/documents': {
        target: process.env.VITE_BACKEND_API_DOMAIN,
        changeOrigin: true,
        secure: false
      }
    }
  }
});