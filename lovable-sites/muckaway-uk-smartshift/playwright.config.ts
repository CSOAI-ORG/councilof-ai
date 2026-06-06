import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration
 * 
 * This config is optimized for visual regression testing in CI/CD pipelines.
 * It captures screenshots of all routes and compares them against baselines.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  /* Configure projects for different viewports */
  projects: [
    {
      name: 'desktop-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 14'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  /* Snapshot options for visual comparison */
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  /* Run local dev server before tests if not in CI */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
  
  /* Snapshot directory for baselines */
  snapshotDir: './e2e/__snapshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',
});
