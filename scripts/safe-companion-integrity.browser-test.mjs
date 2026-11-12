import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { CATALOG_EXAMPLE_TEXT } from '../packages/safe-companion/examples.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = resolve(process.argv[2] || 'qualification/safe-companion-integrity');
await mkdir(output, { recursive: true });
const root = resolve('public');
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  const path = resolve(root, '.' + (url.endsWith('/') ? url + 'index.html' : url));
  if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': path.endsWith('.mjs') ? 'text/javascript' : 'text/html' }).end(await readFile(path)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/chromium'), headless: true });
const record = { passed: false, browser: browser.version(), checks: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith(base + '/')) external.push(r.url()); });
  page.setDefaultTimeout(10000);
  const file = text => ({ name: 'synthetic.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  const focus = () => page.locator('council-safe-companion').evaluate(e => e.shadowRoot.activeElement?.id);
  await page.goto(base + '/safe-companion/');
  await page.getByTestId('safe-export').setInputFiles(file(CATALOG_EXAMPLE_TEXT));
  await page.getByTestId('inspection-result').waitFor();
  const originalReport = await page.locator('council-safe-companion').evaluate(e => e.report);
  await page.locator('#safe-identity > summary').click();
  await page.locator('#expected-digest').fill(originalReport.input.sha256);
  await page.getByRole('button', { name: 'Compare expected digest', exact: true }).click();
  await page.getByText('The selected bytes match the supplied digest.', { exact: false }).waitFor();
  await page.locator('#expected-digest').fill('0'.repeat(64));
  assert.equal(await page.getByText('The selected bytes match the supplied digest.', { exact: false }).count(), 0,
    'Editing the expectation must invalidate the earlier matching result immediately');
  assert.equal(await focus(), 'expected-digest');
  assert.equal(await page.locator('#expected-digest').evaluate(e => e.selectionStart), 64);
  await page.getByRole('button', { name: 'Compare expected digest', exact: true }).click();
  await page.getByText('The selected bytes do not match the supplied digest.', { exact: false }).waitFor();
  await page.locator('#expected-digest').fill(originalReport.input.sha256);
  assert.equal(await page.getByText('The selected bytes do not match the supplied digest.', { exact: false }).count(), 0);
  record.checks.push('editing_expected_digest_clears_match_and_mismatch_without_losing_caret');

  await page.getByTestId('task-reopen').click();
  await page.getByTestId('saved-assessment').setInputFiles(file(JSON.stringify(originalReport)));
  await page.getByText('The saved assessment matches a fresh inspection', { exact: false }).waitFor();
  assert.equal(await focus(), 'saved-check-status');
  const tampered = structuredClone(originalReport); tampered.permissions.execute = true;
  await page.getByTestId('saved-assessment').setInputFiles(file(JSON.stringify(tampered)));
  await page.getByTestId('saved-check-status').filter({ hasText: 'Saved check not matched' }).waitFor();
  await page.getByTestId('task-inspect').click();
  await page.getByTestId('task-compare').click();
  await page.getByTestId('task-reopen').click();
  assert.equal(await page.getByTestId('saved-check-status').filter({ hasText: 'Saved check not matched' }).isVisible(), true);
  record.checks.push('failed_saved_check_survives_task_switches_and_matching_completion_receives_focus');

  await page.getByTestId('task-compare').click();
  const ids = new Map(); let number = 1;
  const disjoint = CATALOG_EXAMPLE_TEXT.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
    id => { if (!ids.has(id)) ids.set(id, `ffffffff-eeee-4ddd-8ccc-${String(number++).padStart(12, '0')}`); return ids.get(id); });
  await page.getByTestId('earlier-export').setInputFiles(file(disjoint));
  await page.getByRole('heading', { name: 'Relationship not established', exact: true }).waitFor();
  assert.equal(await focus(), 'comparison-title');
  assert.equal(await page.getByText('Different record families', { exact: true }).count(), 0);
  record.checks.push('unlinked_catalogs_do_not_invent_a_family_identity_and_comparison_receives_focus');

  await page.getByTestId('practice-toggle').click();
  await page.getByRole('radio', { name: 'The export gives permission to act on every listed finding.' }).check();
  await page.getByTestId('run-practice').click();
  await page.getByText('The practice result is incomplete.', { exact: true }).waitFor();
  assert.equal(await focus(), 'practice-result');
  const practice = await page.locator('council-safe-companion').evaluate(e => e.practice);
  assert.equal(practice.answer_correct, false); assert.equal(practice.grants_authority, false);
  record.checks.push('incorrect_practice_stays_incomplete_and_receives_result_focus');

  const delayed = await page.evaluate(async text => {
    const e = document.querySelector('council-safe-companion');
    const outside = document.createElement('button'); outside.id = 'outside-task'; outside.textContent = 'Another host task'; document.body.append(outside);
    let release; const f = new File([text], 'delayed.json', { type: 'application/json' });
    f.arrayBuffer = () => new Promise(r => { release = () => r(new TextEncoder().encode(text).buffer); });
    const pending = e.load(f); outside.focus(); release(); await pending;
    const result = { outsideKeptFocus: document.activeElement === outside, selected: e.report?.accepted_for_reading };
    outside.remove(); return result;
  }, CATALOG_EXAMPLE_TEXT);
  assert.deepEqual(delayed, { outsideKeptFocus: true, selected: true });
  record.checks.push('async_completion_does_not_take_focus_from_another_host_task');

  const cancelled = await page.evaluate(async text => {
    const e = document.querySelector('council-safe-companion'); let release;
    const f = new File([text], 'delayed-private-name.json');
    f.arrayBuffer = () => new Promise(r => { release = () => r(new TextEncoder().encode(text).buffer); });
    const pending = e.load(f); e.reset(); release(); await pending;
    return { original: e.original, report: e.report, label: e.selectedFileLabel, busy: e.busy, leaked: e.shadowRoot.textContent.includes('delayed-private-name') };
  }, CATALOG_EXAMPLE_TEXT);
  assert.deepEqual(cancelled, { original: null, report: null, label: '', busy: false, leaked: false });
  record.checks.push('reset_during_read_prevents_late_state_or_filename_return');
  await page.setViewportSize({ width: 320, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  record.checks.push('mobile_no_overflow_page_errors_external_requests_or_storage');
  record.passed = true;
} catch (e) { record.error = String(e); process.exitCode = 1; }
finally {
  await browser.close(); await new Promise(r => server.close(r));
  await writeFile(resolve(output, 'integrity-journeys.json'), JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
}
