import { defineConfig, defaultExclude } from 'vitest/config';

// Vitest must not collect the Playwright e2e specs (e2e/**) — they run under
// `playwright test`, not vitest. Without this, `npm test` fails on every spec.
export default defineConfig({
  test: {
    exclude: [...defaultExclude, 'e2e/**'],
  },
});
