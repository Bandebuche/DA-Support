import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/da-app-[hash].js',
        chunkFileNames: 'assets/da-chunk-[hash].js',
        assetFileNames: 'assets/da-[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
