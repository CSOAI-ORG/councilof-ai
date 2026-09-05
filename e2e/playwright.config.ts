import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // The Council OS shell smoke has its own config (playwright.shell.config.ts) and static server.
  testIgnore: /dashboard-shell\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // councilof.ai is the deployed site (csoai.org is the old domain and redirects there).
    baseURL: process.env.BASE_URL || 'https://councilof.ai',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
