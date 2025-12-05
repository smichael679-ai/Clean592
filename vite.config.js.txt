import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: The name below must match your GitHub Repository name exactly, with slashes.
  base: '/YOUR_REPO_NAME/', 
  build: {
    outDir: 'dist',
  }
})
