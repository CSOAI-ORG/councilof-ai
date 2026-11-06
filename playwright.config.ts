import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import config from './e2e/playwright.config';

// npm's existing browser commands use this standard entry point. Resolve the
// imported suite's directory explicitly because relative paths use this file's location.
export default defineConfig({
  ...config,
  testDir: fileURLToPath(new URL('./e2e/tests', import.meta.url)),
});
