import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    minify: 'terser',
    treeshake: true,
    sourcemap: false,
    compress: true,
    rollupOptions: {
      input: './index.html',
    },
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/database'], // Include Firebase in optimized deps
  },
});
