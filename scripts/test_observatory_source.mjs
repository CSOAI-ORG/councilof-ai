import { chromium } from '@playwright/test';

const url = process.env.OBSERVATORY_URL || 'http://127.0.0.1:8789/world/observatory/';
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  if (await page.getByRole('link', { name: 'GSPC board' }).getAttribute('href') !== '/dashboard/?tab=board') {
    throw new Error('GSPC board navigation does not target the live board pane');
  }
  await page.getByRole('button', { name: 'Check public source bytes' }).click();
  await page.getByRole('status').getByText(/MATCH — SHA-256 and 1,201 source rows checked/).waitFor();
  await page.locator('.record').first().getByText('Inspect exact source row').click();
  await page.locator('.record').first().getByText(/MATCH — source row 1 of 1201/).waitFor();
  if (!((await page.locator('.record').first().locator('pre').textContent()) || '').includes('"id": "1c8899583e"')) {
    throw new Error('First record was not revealed from the exact public source');
  }

  const tampered = await browser.newPage();
  await tampered.route('**/j-space/events.json', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ n_events: 1, events: [{ id: '1c8899583e' }] }),
  }));
  await tampered.goto(url, { waitUntil: 'networkidle' });
  await tampered.getByRole('button', { name: 'Check public source bytes' }).click();
  await tampered.getByRole('status').getByText(/UNCHECKABLE — source SHA-256 differs/).waitFor();
  await tampered.locator('.record').first().getByText('Inspect exact source row').click();
  await tampered.locator('.record').first().getByText(/UNCHECKABLE — source SHA-256 differs/).waitFor();
  if (await tampered.locator('.record').first().getByText(/MATCH — source row/).count()) {
    throw new Error('Tampered source was presented as a match');
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(url, { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: 'Check public source bytes' }).click();
  await mobile.getByRole('status').getByText(/MATCH — SHA-256/).waitFor();
  if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
    throw new Error('Source verification overflows the mobile viewport');
  }

  console.log('PASS board navigation, source bytes and exact row verified, tampered source UNCHECKABLE, mobile layout');
} finally {
  await browser.close();
}
