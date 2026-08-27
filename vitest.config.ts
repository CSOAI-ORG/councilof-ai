import path from 'node:path';
import { defineConfig, defaultExclude } from 'vitest/config';

// Vitest must not collect the Playwright e2e specs (e2e/**) — they run under
// `playwright test`, not vitest. Without this, `npm test` fails on every spec.
// `**/e2e/**` covers nested copies (e.g. .claude/worktrees/*/e2e/**) and
// `**/worktrees/**` keeps the parallel Claude worktrees out of the unit run.
//
// The `@` aliases mirror client/vite.config.ts so a test can import a page
// component (which imports `@/components/ui/*`) and render it.
export default defineConfig({
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './client/src/components'),
      '@/pages': path.resolve(__dirname, './client/src/pages'),
      '@/contexts': path.resolve(__dirname, './client/src/contexts'),
      '@/hooks': path.resolve(__dirname, './client/src/hooks'),
      '@/lib': path.resolve(__dirname, './client/src/lib'),
      '@/styles': path.resolve(__dirname, './client/src/styles'),
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  test: {
    exclude: [...defaultExclude, 'e2e/**', '**/e2e/**', '**/worktrees/**'],
  },
});
