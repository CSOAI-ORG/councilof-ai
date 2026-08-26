import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: path.resolve(__dirname),
  publicDir: '../public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: { '^/api/': { target: 'http://localhost:8901', changeOrigin: true } },
    watch: { usePolling: true, interval: 1000 },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // One-time filename salt (r2) to abandon a poisoned immutable-cache set.
        // 2026-08-11: a deploy-skew window served index.html (200, text/html) for
        // missing /assets/*.js, and Pages' `immutable, max-age=31536000` header made
        // browsers cache that HTML *under the JS URL for a year* -> white screen that
        // a normal reload cannot clear. Changing every asset filename gives brand-new
        // URLs the poison can never match. Bump the salt again if it ever recurs.
        entryFileNames: 'assets/[name].r2-[hash].js',
        chunkFileNames: 'assets/[name].r2-[hash].js',
        assetFileNames: 'assets/[name].r2-[hash][extname]',
        // Split heavy vendors into cacheable chunks so the main app chunk is
        // small and the browser can load in parallel — big first-paint win.
        manualChunks(id: string) {
          // ONLY split the big, rarely-changing content datasets into their own
          // cacheable chunks. We deliberately do NOT hand-split node_modules —
          // manually chunking React separately breaks createContext ordering.
          // Route-level lazy() already gives the big code-splitting win safely.
          if (/src[\\/]data[\\/]sectors-content/.test(id)) return 'data-sectors';
          if (/src[\\/]data[\\/]blog-content/.test(id)) return 'data-blog';
          if (/src[\\/]data[\\/]industries-content/.test(id)) return 'data-industries';
          if (/src[\\/]data[\\/]frameworks-content/.test(id)) return 'data-frameworks';
        },
      },
    },
  },
});
