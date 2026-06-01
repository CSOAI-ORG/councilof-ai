// MEOK OS — Playwright E2E config. Tests the live 3-window OS at :4173.
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
