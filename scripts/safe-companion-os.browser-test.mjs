import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exercise the actual React entry against the generated public reader assets.
// Dependencies come from the existing repository; nothing is installed or fetched.
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { chromium } = require('playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(root, 'public');
const output = resolve(process.argv[2] || resolve(root, 'qualification/safe-companion'));
const checks = [];
const errors = [];
let browser;
let server;
let result;

try {
  const bundle = await build({
    absWorkingDir: root,
    stdin: {
      contents: `import { createRoot } from 'react-dom/client';
import SafeExportReview from './client/src/components/SafeExportReview.tsx';
createRoot(document.getElementById('root')).render(<SafeExportReview />);`,
      sourcefile: 'safe-companion-os-harness.tsx', resolveDir: root, loader: 'tsx',
    },
    bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
  });
  const javascript = bundle.outputFiles[0].contents;
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SAFE Council OS integration test</title></head><body><main id="root"></main><script defer src="/os-harness.js"></script></body></html>';
  server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(html); return; }
      if (pathname === '/os-harness.js') { res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }).end(javascript); return; }
      const path = resolve(publicRoot, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!path.startsWith(publicRoot + sep)) { res.writeHead(403).end(); return; }
      const data = await readFile(path);
      const type = /\.(?:mjs|js)$/.test(path) ? 'text/javascript; charset=utf-8' : path.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/json';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/chromium'),
    headless: true,
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  const requests = [];
  page.setDefaultTimeout(10000);
  page.on('request', request => requests.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/');
  await page.getByTestId('safe-export-review').waitFor();
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('input[type="file"]').count(), 0, 'The collapsed integration exposes no file input');
  assert.equal(requests.filter(url => url.includes('/safe-companion/')).length, 0, 'The collapsed integration loads no reader assets');
  assert.equal(await page.evaluate(() => Boolean(customElements.get('council-safe-companion'))), false);
  checks.push('lazy_initial_no_reader_request_or_file_input');

  const summary = page.locator('[data-testid="safe-export-review"] > summary');
  await summary.click();
  await page.getByTestId('safe-export').waitFor();
  assert.equal(requests.filter(url => new URL(url).pathname === '/safe-companion/element.mjs').length, 1);
  checks.push('expand_loads_actual_reader');
  await page.getByTestId('examples-toggle').click();
  await page.getByTestId('demo-catalog').click();
  await page.getByRole('heading', { name: 'Inspection complete', exact: true }).waitFor();
  assert.equal(await page.locator('council-safe-companion').evaluate(element => element.report.accepted_for_reading), true);
  checks.push('embedded_catalog_demo');

  await summary.click();
  await page.locator('council-safe-companion').waitFor({ state: 'detached' });
  assert.equal(await page.locator('input[type="file"]').count(), 0);
  await summary.click();
  await page.getByTestId('empty-result').waitFor();
  assert.equal(await page.getByTestId('inspection-result').count(), 0);
  assert.deepEqual(await page.locator('council-safe-companion').evaluate(element => ({ original: element.original, report: element.report, comparison: element.comparison, practice: element.practice })), { original: null, report: null, comparison: null, practice: null });
  assert.equal(requests.filter(url => new URL(url).pathname === '/safe-companion/element.mjs').length, 1, 'Reopening reuses the registered code but creates fresh reader state');
  checks.push('collapse_unmounts_and_reopen_clears_state');
  assert.equal(requests.some(url => !url.startsWith(base + '/')), false);
  assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })), { local: 0, session: 0 });
  checks.push('embedded_no_external_requests_or_browser_storage');
  await context.close();

  // A new context ensures module registration from the success journey cannot mask a load failure.
  const failureContext = await browser.newContext();
  const failureRequests = [];
  failureContext.on('request', request => failureRequests.push(request.url()));
  const failurePage = await failureContext.newPage();
  failurePage.setDefaultTimeout(10000);
  failurePage.on('pageerror', error => errors.push(error.message));
  const moduleAttempts = [];
  await failurePage.route('**/safe-companion/element.mjs?*', async route => {
    moduleAttempts.push(new URL(route.request().url()).searchParams.get('retry'));
    if (moduleAttempts.length === 1) await route.fulfill({ status: 503, contentType: 'text/javascript', body: '// Deliberate load failure for the recovery test.' });
    else await route.continue();
  });
  await failurePage.goto(base + '/');
  await failurePage.getByTestId('safe-export-review').waitFor();
  assert.equal(await failurePage.evaluate(() => Boolean(customElements.get('council-safe-companion'))), false);
  await failurePage.locator('[data-testid="safe-export-review"] > summary').click();
  await failurePage.getByRole('alert').filter({ hasText: 'The reader could not load.' }).waitFor();
  assert.equal(await failurePage.locator('input[type="file"]').count(), 0);
  checks.push('fresh_context_module_503_shows_recoverable_error');

  const fallback = failurePage.getByRole('link', { name: 'Open standalone reader', exact: true });
  assert.equal(await fallback.getAttribute('href'), '/safe-companion/');
  const standalone = await failureContext.newPage();
  await standalone.goto(new URL(await fallback.getAttribute('href'), base).href);
  await standalone.getByTestId('safe-export').waitFor();
  await standalone.getByTestId('empty-result').waitFor();
  await standalone.close();
  checks.push('error_fallback_resolves_to_standalone_reader');

  await failurePage.getByRole('button', { name: 'Retry reader', exact: true }).click();
  await failurePage.getByTestId('safe-export').waitFor();
  assert.deepEqual(moduleAttempts, ['0', '1'], 'Retry uses a new module URL so an earlier failed module response is not reused');
  assert.equal(await failurePage.getByRole('alert').count(), 0);
  await failurePage.getByTestId('examples-toggle').click();
  await failurePage.getByTestId('demo-disclosure').click();
  await failurePage.getByRole('heading', { name: 'Inspection complete', exact: true }).waitFor();
  assert.equal(await failurePage.locator('council-safe-companion').evaluate(element => element.report.input.type), 'disclosure');
  checks.push('cache_busted_retry_recovers_and_inspects_disclosure');
  assert.equal(failureRequests.some(url => !url.startsWith(base + '/')), false);
  await failureContext.close();
  const conflictContext = await browser.newContext();
  const conflictPage = await conflictContext.newPage();
  await conflictPage.addInitScript(() => customElements.define('council-safe-companion', class extends HTMLElement {}));
  await conflictPage.goto(base + '/');
  await conflictPage.locator('[data-testid="safe-export-review"] > summary').click();
  await conflictPage.getByRole('alert').filter({ hasText: 'A different reader version' }).waitFor();
  assert.equal(await conflictPage.locator('input[type="file"]').count(), 0);
  assert.equal(await conflictPage.getByRole('link', { name: 'Open standalone reader' }).isVisible(), true);
  await conflictContext.close();
  checks.push('incompatible_registered_component_refused_with_fallback');
  assert.deepEqual(errors, []);
  checks.push('no_uncaught_page_errors');
  result = { passed: true, scope: 'Council OS SafeExportReview integration in an isolated React harness', checks, module_retry_values: moduleAttempts, external_requests: 0, uncaught_page_errors: errors.length };
} catch (error) {
  process.exitCode = 1;
  result = { passed: false, scope: 'Council OS SafeExportReview integration in an isolated React harness', checks, error: error instanceof Error ? error.message : String(error), uncaught_page_errors: errors };
} finally {
  if (browser) await browser.close();
  if (server?.listening) await new Promise(resolveClose => { server.closeAllConnections?.(); server.close(resolveClose); });
}
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'os-integration.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
