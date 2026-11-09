import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'node:child_process';
import { exportColiseum } from '../scripts/build-coliseum-mirror.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRevision = (() => {
  const declared = process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA;
  if (declared) return declared;
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return 'development-unpublished'; }
})();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'csoai-coliseum-mirror',
      apply: 'build',
      // Export the same emitted bytes after all output files exist, before the
      // existing shell postprocessors. Root dependency inputs stay unchanged.
      writeBundle: {
        order: 'post',
        sequential: true,
        async handler() {
          const receipt = await exportColiseum({
            buildDir: path.resolve(__dirname, '../dist/client'),
            outputDir: path.resolve(__dirname, '../dist/hf-coliseum'),
            licensePath: path.resolve(__dirname, '../LICENSE'),
            sourceCommit: sourceRevision,
          });
          console.log('Coliseum mirror: ' + Object.keys(receipt.files).length +
            ' files, source ' + receipt.source_commit);
        },
      },
    },
  ],
  define: {
    'import.meta.env.VITE_SOURCE_REVISION': JSON.stringify(sourceRevision),
  },
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
    proxy: { '^/api/': { target: 'http://localhost:3001', changeOrigin: true } },
    watch: { usePolling: true, interval: 1000 },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    sourcemap: false,
    // Read by scripts/inject-dashboard-preload.mjs (Council OS deep-link preloads), which then deletes it from dist.
    manifest: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        coliseum: path.resolve(__dirname, 'hf-coliseum.html'),
      },
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
