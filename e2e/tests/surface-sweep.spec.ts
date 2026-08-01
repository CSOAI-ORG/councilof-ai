import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // e2e/tests/

/**
 * Surface sweep — visual inspection of EVERY route in the master site.
 *
 * For each route: page errors, console errors, failed requests (>=400),
 * final HTTP status, and a full-page screenshot. One JSON result per route
 * lands in tests/visual/report/results/ — merged afterwards by
 * scripts/sweep-report.mjs into sweep-report.json + docs/FRONTEND_CHECKLIST.md.
 *
 * Run against a local build:
 *   npm run build:client
 *   npx vite preview --config client/vite.config.ts --port 4173 &
 *   BASE_URL=http://localhost:4173 npx playwright test surface-sweep --project=chromium
 *   node scripts/sweep-report.mjs
 *
 * Dynamic (:param) routes are not visited — they are recorded as "dynamic"
 * with their parent route noted (the parent list page is visited instead).
 */

const REPORT_DIR = path.resolve(HERE, 'visual/report');
const RESULTS_DIR = path.join(REPORT_DIR, 'results');
const SHOTS_DIR = path.join(REPORT_DIR, 'shots');

// Read the route table straight from App.tsx — the sweep can never drift from the app.
function extractRoutes(): string[] {
  const candidates = [
    path.resolve(HERE, '../../client/src/App.tsx'),
    path.resolve(process.cwd(), '../client/src/App.tsx'),
    path.resolve(process.cwd(), 'client/src/App.tsx'),
  ];
  const appPath = candidates.find(p => fs.existsSync(p));
  if (!appPath) throw new Error('App.tsx not found from ' + process.cwd());
  const src = fs.readFileSync(appPath, 'utf8');
  const routes = new Set<string>();
  for (const m of src.matchAll(/path="([^"]+)"/g)) {
    const r = m[1];
    if (!r.startsWith('/')) continue;
    routes.add(r);
  }
  return [...routes].sort();
}

const ALL = extractRoutes();
const DYNAMIC = ALL.filter(r => r.includes(':'));
const ROUTES = ALL.filter(r => !r.includes(':'));

test.describe.configure({ mode: 'default' });

test.beforeAll(() => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  // record the dynamic-route exclusions once, up front
  fs.writeFileSync(
    path.join(REPORT_DIR, 'dynamic-routes.json'),
    JSON.stringify({ skipped: DYNAMIC, reason: 'parameterized — parent list route visited instead' }, null, 2)
  );
});

const slug = (r: string) => (r === '/' ? '_root' : r.replace(/[^\w-]+/g, '_'));

for (const route of ROUTES) {
  test(`sweep ${route}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedRequests: { url: string; status: number }[] = [];

    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        failedRequests.push({ url: res.url().slice(0, 200), status: res.status() });
      }
    });

    let navStatus = 0;
    let navError = '';
    try {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      navStatus = res?.status() ?? 0;
      await page.waitForTimeout(2500); // let lazy chunks + first fetches settle
      await page.screenshot({ path: path.join(SHOTS_DIR, slug(route) + '.png'), fullPage: false });
    } catch (e: any) {
      navError = String(e?.message || e).slice(0, 300);
    }

    const result = {
      route,
      navStatus,
      navError,
      pageErrors,
      consoleErrors: consoleErrors.slice(0, 20),
      failedRequests: failedRequests.slice(0, 20),
      screenshot: 'shots/' + slug(route) + '.png',
      sweptAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(RESULTS_DIR, slug(route) + '.json'), JSON.stringify(result, null, 2));

    // The sweep records; it does not assert. Assertions live in the layer specs (Phase 5).
  });
}
