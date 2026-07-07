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
    proxy: { '^/api/': { target: 'http://localhost:3001', changeOrigin: true } },
    watch: { usePolling: true, interval: 1000 },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split heavy vendors into cacheable chunks so the main app chunk is
        // small and the browser can load in parallel — big first-paint win.
        manualChunks(id: string) {
          // Carve the big, rarely-changing content datasets into their own chunks
          // so they cache independently of the app code.
          if (/src[\\/]data[\\/]sectors-content/.test(id)) return 'data-sectors';
          if (/src[\\/]data[\\/]blog-content/.test(id)) return 'data-blog';
          if (/src[\\/]data[\\/]industries-content/.test(id)) return 'data-industries';
          if (/src[\\/]data[\\/]frameworks-content/.test(id)) return 'data-frameworks';
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|scheduler|wouter)[\\/]/.test(id)) return 'react';
          if (/recharts|d3-|victory|chart\.js/.test(id)) return 'charts';
          if (/jspdf|html2canvas|canvg|dompurify/.test(id)) return 'pdf';
          if (/lucide|@radix-ui|framer-motion/.test(id)) return 'ui';
          return 'vendor';
        },
      },
    },
  },
});
