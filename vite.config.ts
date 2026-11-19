import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // three.js is big but only ever loaded by the Grimoire chunk.
    chunkSizeWarningLimit: 900,
  },
})
