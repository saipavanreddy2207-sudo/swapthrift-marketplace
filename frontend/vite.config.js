import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['.app.lhr.life', '.trycloudflare.com', 'localhost', '127.0.0.1'],
  },
  preview: {
    allowedHosts: ['.app.lhr.life', '.trycloudflare.com', 'localhost', '127.0.0.1'],
  },
})
