import { test, expect } from '@playwright/test';

/**
 * Pre-deploy smoke test — catches uncaught JS errors before deploy.
 *
 * This is the fastest possible check that the built bundle is healthy.
 * It does NOT test content correctness (that's what production-surfaces.spec.ts
 * is for). It only catches the class of bugs that make the site SHOW AN ERROR
 * to the user — ReferenceError, TypeError, failed dynamic imports, etc.
 *
 * Run against local build:   BASE_URL=http://localhost:4173 npx playwright test pre-deploy-smoke
 * Run against staging:       BASE_URL=https://staging.csoai-site.pages.dev npx playwright test pre-deploy-smoke
 *
 * Designed to be called from deploy-staging.sh and deploy-prod.sh.
 * Timeout: 30s total (not a full regression suite).
 */

// Pages that MUST load without uncaught exceptions.
// This list is deliberately small — just the surfaces that have broken before
// or that users hit first.
const CRITICAL_PAGES = [
  '/',
  '/login',
  '/training',
  '/certification',
  '/globe',
  '/sov-space',
  '/workbench',
];

for (const route of CRITICAL_PAGES) {
  test(`${route} has no uncaught exceptions`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // The specific class of bugs we're guarding against:
    //   ReferenceError: TOUR is not defined
    //   TypeError: Cannot read properties of undefined
    //   SyntaxError: Unexpected token
    //   Failed to fetch dynamically imported module
    const critical = errors.filter(e =>
      e.includes('is not defined') ||
      e.includes('is not a function') ||
      e.includes('Cannot read properties of') ||
      e.includes('Unexpected token') ||
      e.includes('Failed to fetch dynamically imported module')
    );
    expect(critical).toEqual([]);
  });
}

// The sovereign tour is the specific path that caused the TOUR bug.
// It only fires after a 3.5s delay + user idle state, so we need to
// wait for the invite to appear, click it, and verify no crash.
test('sovereign tour invite fires without ReferenceError', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  // The tour invite appears after ~3.5s if the user hasn't seen it
  await page.waitForTimeout(5000);

  // Try to click "Show me" — if it doesn't appear, the test still passes
  // (the tour might have been dismissed or already seen)
  const showMe = page.locator('button:has-text("Show me")');
  if (await showMe.isVisible({ timeout: 2000 }).catch(() => false)) {
    await showMe.click();
    await page.waitForTimeout(3000);
  }

  const critical = errors.filter(e =>
    e.includes('is not defined') ||
    e.includes('TOUR')
  );
  expect(critical).toEqual([]);
});

// The DemoTour component is the specific file that caused the TOUR bug.
// Even if the tour invite doesn't fire (user already seen it), the
// component is still mounted — verify it doesn't throw during mount.
test('DemoTour component mounts without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Check for any ReferenceError — the specific class of bug from the TOUR fix
  const referenceErrors = errors.filter(e =>
    e.includes('ReferenceError') || e.includes('is not defined')
  );
  expect(referenceErrors).toEqual([]);
});
