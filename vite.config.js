import { defineConfig } from 'vite';
import { resolve } from 'path';
import prerender from './scripts/vite-prerender.js';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [prerender()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Prevents exposing internal source structures in production
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
