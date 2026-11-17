import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', chunkSizeWarningLimit: 8000 },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
