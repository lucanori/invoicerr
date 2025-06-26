import { defineConfig } from 'vite'
import generouted from '@generouted/react-router/plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generouted(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
})
