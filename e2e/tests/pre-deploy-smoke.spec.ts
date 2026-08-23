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
  '/gspc-arena',
  '/workbench',
  '/dashboard',
  '/agent-runbook',
  '/receipt-spec',
  '/engine-axis',
  '/instruments',
  '/ownership',
];

for (const route of CRITICAL_PAGES) {
  test(`${route} has no uncaught exceptions`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

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

test('sovereign tour active state has no ReferenceError', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
  });
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch {}
    localStorage.setItem('sov_tour_active', '1');
    localStorage.setItem('sov_tour_step', '0');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  const critical = errors.filter(e =>
    e.includes('is not defined') || e.includes('TOUR') || e.includes('ReferenceError')
  );
  expect(critical, `uncaught JS errors:\n${critical.join('\n')}`).toEqual([]);
});

test('sovereign tour active state renders without fallback UI', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch {}
    localStorage.setItem('sov_tour_active', '1');
    localStorage.setItem('sov_tour_step', '0');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  const body = (await page.textContent('body')) || '';
  expect(body).not.toContain('Something went wrong');
  expect(body).not.toContain('TOUR is not defined');
  expect(body).not.toContain('Reload Page');
});

test('sovereign tour invite fires without ReferenceError', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  const showMe = page.locator('button:has-text("Show me")');
  if (await showMe.isVisible({ timeout: 2000 }).catch(() => false)) {
    await showMe.click();
    await page.waitForTimeout(3000);
  }
  const critical = errors.filter(e => e.includes('is not defined') || e.includes('TOUR'));
  expect(critical).toEqual([]);
});

test('DemoTour component mounts without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const referenceErrors = errors.filter(e => e.includes('ReferenceError') || e.includes('is not defined'));
  expect(referenceErrors).toEqual([]);
});
