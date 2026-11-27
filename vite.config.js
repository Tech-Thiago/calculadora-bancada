import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const caminho = id.replace(/\\/g, '/')
          if (
            caminho.includes('/node_modules/react/') ||
            caminho.includes('/node_modules/react-dom/') ||
            caminho.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react'
          }
          if (caminho.includes('/node_modules/lucide-react/')) {
            return 'vendor-icons'
          }
        },
      },
    },
  },
})
