import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js', '@pixi/react'],
          react: ['react', 'react-dom', 'framer-motion'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});