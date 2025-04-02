import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',  // Set root to the current directory (adjust if needed)
  build: {
    rollupOptions: {
      input: './index.html', // Ensure Vite knows about the entry point
    },
  },
});
