import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const API_PORT = process.env.API_PORT || 3002

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}/`,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [vue()],
})
