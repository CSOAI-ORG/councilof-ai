import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, sep } from 'node:path';
import { DISCLOSURE_EXAMPLE_TEXT } from '../packages/safe-companion/examples.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const prefix = '/nested/tools/review/safe/';
const root = resolve('public/safe-companion');
const output = resolve(process.argv[2] || 'qualification/safe-companion');
const checks = [], errors = [], requests = [];
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/blank') { res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><html lang="en"><title>Host contract test</title><body><main><div id="host"></div></main></body></html>'); return; }
  if (!path.startsWith(prefix)) { res.writeHead(404).end(); return; }
  const file = resolve(root, path.slice(prefix.length));
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': file.endsWith('.mjs') ? 'text/javascript' : 'text/html' }).end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
let browser, result;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/chromium'), headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.addInitScript(() => { window.cspViolations = []; document.addEventListener('securitypolicyviolation', e => window.cspViolations.push(e.violatedDirective)); });
  await page.goto(base + prefix + 'integration.html');
  assert.equal(await page.locator('input[type=file]').count(), 0);
  await page.getByRole('button', { name: 'Open reader', exact: true }).click();
  await page.getByTestId('safe-export').waitFor();
  assert.ok(await page.locator('council-safe-companion').evaluate(el => parseFloat(getComputedStyle(el.shadowRoot.querySelector('.wrap')).paddingTop) >= 12));
  assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
  checks.push('relocated_assets_and_nonce_restricted_styles');

  const privateName = 'PRIVATE-local-<img-onerror>.json';
  await page.getByTestId('safe-export').setInputFiles({ name: privateName, mimeType: 'application/json', buffer: Buffer.from(DISCLOSURE_EXAMPLE_TEXT) });
  await page.getByRole('heading', { name: 'Inspection complete', exact: true }).waitFor();
  assert.ok((await page.getByTestId('selected-file').innerText()).includes(privateName));
  assert.equal(await page.locator('council-safe-companion img').count(), 0);
  const downloadWait = page.waitForEvent('download');
  await page.getByTestId('save-assessment').click();
  const downloaded = await readFile(await (await downloadWait).path(), 'utf8');
  assert.equal(downloaded.includes('PRIVATE-local-'), false);
  assert.equal(JSON.parse(downloaded).permissions.execute, false);
  checks.push('local_filename_recognition_without_diagnostic_leak_or_html');
  await page.evaluate(() => { window.retainedReader = document.querySelector('council-safe-companion'); });
  await page.getByRole('button', { name: 'Remove and clear reader' }).click();
  assert.deepEqual(await page.evaluate(() => ({ original: retainedReader.original, report: retainedReader.report, text: retainedReader.shadowRoot.textContent, filename: retainedReader.selectedFileLabel })), { original: null, report: null, text: '', filename: '' });
  await page.getByRole('button', { name: 'Open reader', exact: true }).click();
  await page.getByTestId('empty-result').waitFor();
  checks.push('host_remove_and_reopen_clear_values_and_rendered_dom');

  await page.setViewportSize({ width: 320, height: 900 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 320), true);
  await page.getByTestId('safe-export').setInputFiles({ name: 'empty.json', mimeType: 'application/json', buffer: Buffer.alloc(0) });
  await page.getByRole('alert').filter({ hasText: 'This file is empty.' }).waitFor();
  await page.getByTestId('safe-export').setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(1_048_577) });
  await page.getByRole('alert').filter({ hasText: 'larger than 1 MiB' }).waitFor();
  await page.getByTestId('safe-export').setInputFiles({ name: 'v2.json', mimeType: 'application/json', buffer: Buffer.from('{"catalog_export_schema_version":"2.0.0"}') });
  await page.getByRole('heading', { name: 'Export not accepted', exact: true }).waitFor();
  assert.equal(await page.getByText('Choose an export using supported format 0.1.0.', { exact: false }).isVisible(), true);
  checks.push('distinct_empty_size_and_unsupported_version_recovery');
  await page.getByTestId('reset').click();
  await page.getByTestId('task-reopen').click();
  assert.equal(await page.getByTestId('saved-assessment').count(), 0);
  await page.getByTestId('safe-export').setInputFiles({ name: 'original.json', mimeType: 'application/json', buffer: Buffer.from(DISCLOSURE_EXAMPLE_TEXT) });
  await page.getByTestId('saved-assessment').waitFor();
  assert.equal(await page.locator('council-safe-companion').evaluate(el => el.shadowRoot.activeElement.id), 'saved-assessment');
  await page.getByTestId('saved-assessment').setInputFiles({ name: 'check.json', mimeType: 'application/json', buffer: Buffer.from(downloaded) });
  await page.getByText('The saved assessment matches a fresh inspection', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 320), true);
  checks.push('returning_user_reopen_at_320px_and_step_focus');

  await page.goto(base + '/blank');
  const contract = await page.evaluate(async prefix => {
    const { mountSafeCompanion } = await import(prefix + 'embed.mjs');
    const host = document.getElementById('host');
    const code = async callback => { try { await callback(); return 'UNEXPECTED_SUCCESS'; } catch (e) { return e.code; } };
    const refused = await Promise.all([
      code(() => mountSafeCompanion(null)),
      code(() => mountSafeCompanion(host, { file: 'private' })),
      code(() => mountSafeCompanion(host, { compact: 'true' })),
      code(() => mountSafeCompanion(host, { styleNonce: 'x; unsafe-inline' })),
    ]);
    const first = mountSafeCompanion(host);
    const duplicate = await code(() => mountSafeCompanion(host));
    const handle = await first; handle.destroy(); handle.destroy();
    const empty = host.children.length === 0;
    const pending = mountSafeCompanion(host); host.remove();
    const detached = await code(() => pending);
    return { refused, duplicate, empty, detached };
  }, prefix);
  assert.deepEqual(contract, { refused: ['HOST_UNAVAILABLE', 'OPTIONS_UNSUPPORTED', 'OPTIONS_UNSUPPORTED', 'STYLE_NONCE_INVALID'], duplicate: 'HOST_ALREADY_MOUNTED', empty: true, detached: 'HOST_UNAVAILABLE' });
  checks.push('bounded_mount_options_concurrency_idempotent_destroy_and_detach');

  const compatible = await browser.newPage();
  await compatible.goto(base + '/blank');
  assert.equal(await compatible.evaluate(async prefix => {
    await import(prefix + 'element.mjs?already-loaded=0.2.1');
    const { mountSafeCompanion } = await import(prefix + 'embed.mjs');
    const handle = await mountSafeCompanion(document.getElementById('host'));
    const ok = document.querySelector('council-safe-companion') !== null; handle.destroy(); return ok;
  }, prefix), true);
  await compatible.close();
  checks.push('compatible_registration_from_versioned_url_reused');

  const incompatible = await browser.newPage();
  await incompatible.addInitScript(() => customElements.define('council-safe-companion', class extends HTMLElement {}));
  await incompatible.goto(base + '/blank');
  assert.equal(await incompatible.evaluate(async prefix => {
    const { mountSafeCompanion } = await import(prefix + 'embed.mjs');
    try { await mountSafeCompanion(document.getElementById('host')); return 'UNEXPECTED_SUCCESS'; } catch (e) { return e.code; }
  }, prefix), 'COMPONENT_VERSION_CONFLICT');
  assert.equal(await incompatible.locator('council-safe-companion').count(), 0);
  await incompatible.close();
  checks.push('incompatible_registration_refused_without_instantiation');
  assert.deepEqual(errors, []);
  assert.equal(requests.some(url => !url.startsWith(base + '/')), false);
  assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })), { local: 0, session: 0 });
  checks.push('no_external_requests_page_errors_or_browser_storage');
  result = { passed: true, checks, browser: browser.version(), css_nonce_enforced: true, width_px: 320 };
} catch (error) {
  process.exitCode = 1; result = { passed: false, checks, error: error.message };
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise(resolve => { server.closeAllConnections?.(); server.close(resolve); });
}
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'embed-journeys.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
