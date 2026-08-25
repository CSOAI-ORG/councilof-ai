import { test, expect } from '@playwright/test';

/** Smoke: honesty surfaces ship without crash and keep UNMEASURED language. */
const ROUTES = [
  { path: '/indices', must: /UNMEASURED|indices/i },
  { path: '/indices/ai-economy', must: /UNMEASURED|AI.?economy/i },
  { path: '/products', must: /product|catalog|HO\.2|score/i },
  { path: '/powered-by', must: /powered|white-?label|Option A/i },
];

for (const r of ROUTES) {
  test(`${r.path} loads with honesty copy`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(r.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(r.must);
    const critical = errors.filter(
      (e) =>
        e.includes('is not defined') ||
        e.includes('is not a function') ||
        e.includes('Cannot read properties of') ||
        e.includes('Failed to fetch dynamically imported module'),
    );
    expect(critical).toEqual([]);
  });
}

/** Mobile viewport smoke — /indices and /products (#220) */
const MOBILE_ROUTES = [
  { path: '/indices', must: /UNMEASURED|indices/i },
  { path: '/products', must: /product|catalog|HO\.2|score/i },
];

for (const r of MOBILE_ROUTES) {
  test(`mobile ${r.path} loads (${375}x812)`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(r.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(r.must);
    const critical = errors.filter(
      (e) =>
        e.includes('is not defined') ||
        e.includes('is not a function') ||
        e.includes('Cannot read properties of') ||
        e.includes('Failed to fetch dynamically imported module'),
    );
    expect(critical).toEqual([]);
  });
}
