import { chromium } from '@playwright/test';

const url = process.env.OBSERVATORY_URL || 'http://127.0.0.1:8789/world/observatory/';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByText('1,201', { exact: true }).waitFor();
  await page.waitForFunction(() => document.getElementById('city-rows')?.textContent === '480');
  if (!(await page.locator('#city-date').textContent()).includes('2026-09-23 09:25')) throw new Error('City capture date misstated');
  if (await page.locator('#city-tick').textContent() !== '476') throw new Error('Latest city tick misstated');
  if (!(await page.locator('#city-source-hash').textContent()).startsWith('f89c96a25c21')) throw new Error('City source digest missing');
  if (await page.title() !== 'Simulation Observatory | Council of AI') throw new Error('Wrong title');
  if (await page.locator('.record').count() !== 25) throw new Error('Expected first 25 records');
  if (await page.locator('.moment').count() !== 12) throw new Error('Expected 12 source-linked moments');
  await page.locator('.moment button').first().click();
  if (!await page.locator('#query').inputValue() || await page.locator('.record').count() < 1) throw new Error('Moment did not find its source');
  await page.locator('#query').fill('');
  if (await page.locator('#source-date').textContent() !== '2026-08-15') throw new Error('Source date mislabeled');
  await page.screenshot({ path: '/workspace/lanes/codex-world-observatory-desktop.png', fullPage: true });
  await page.locator('#query').fill('1c8899583e');
  if (await page.locator('.record').count() !== 1) throw new Error('Search did not isolate source ID');
  if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(url, { waitUntil: 'networkidle' });
  await mobile.getByText('1,201', { exact: true }).waitFor();
  await mobile.waitForFunction(() => document.getElementById('city-rows')?.textContent === '480');
  await mobile.screenshot({ path: '/workspace/lanes/codex-world-observatory-mobile.png', fullPage: true });

  const hostile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await hostile.route('**/world/observatory/index.json', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      schema: 'csoai.simulation-observatory/1',
      source: { generated_at: '2026-08-15T16:59:38Z', sha256: 'fixture', url: 'https://councilof.ai/j-space/events.json' },
      import: { head_hash: 'fixture' },
      events: [{ source_id: 'fixture', axis: '<img src=x onerror=alert(1)>', intent: '<script>window.compromised=true</script>', source_epoch: 1786780977 }],
      cards: [{ source_id: 'fixture', axis: '<svg onload=alert(1)>', title: '<img src=x onerror=alert(1)>', hook: '<script>window.compromised=true</script>', disclosure: 'Simulation; upstream signature not verified.' }],
    }),
  }));
  await hostile.goto(url, { waitUntil: 'networkidle' });
  if (await hostile.locator('.record img, .record script, .moment img, .moment script, .moment svg').count()) throw new Error('Untrusted HTML was parsed');
  if (await hostile.evaluate(() => window.compromised === true)) throw new Error('Untrusted script executed');
  if (await hostile.locator('.record').count() !== 1) throw new Error('Fixture did not render');
  console.log('PASS desktop load, 1201 rows, 12 candidate moments linked to source, source date, search, mobile load, hostile text escaping');
} finally {
  await browser.close();
}
