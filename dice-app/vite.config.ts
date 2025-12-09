import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load correctly on GitHub Pages
  build: {
    outDir: '../docs', // Output to a 'docs' folder in the repo root
    emptyOutDir: true,
  }
})
