
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'c2f062aa-f9a1-4d23-99f9-f2c8d32d5d78-00-1pq19eo2nt4xb.pike.replit.dev',
      '.replit.dev'
    ]
  }
})
