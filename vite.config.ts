import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api/thetanuts': {
        target: 'https://round-snowflake-9c31.devops-118.workers.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/thetanuts/, ''),
      },
    },
  },
})
