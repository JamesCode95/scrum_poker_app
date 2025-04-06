import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/database'], // Include Firebase in optimized deps
  },
});
