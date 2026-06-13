import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, the React app runs on Vite (5173) and proxies /api to the Express
// server (8787). In production, Express serves the built assets from dist/.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    outDir: 'dist',
  },
})
