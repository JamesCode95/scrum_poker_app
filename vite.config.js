import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/scrum_poker_app/',
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
