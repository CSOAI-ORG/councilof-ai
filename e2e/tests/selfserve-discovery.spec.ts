import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const manifest = JSON.parse(readFileSync(resolve('client/src/lib/__fixtures__/x402-manifest-2026-09-26-readback.json'), 'utf8'));
// Frozen input drives this UI contract; it is not live supply or payment evidence.
test.beforeEach(async ({ page }) => {
  await page.route('**/.well-known/x402.json', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(manifest),
  }));
});
for (const width of [320, 390, 768, 1280]) {
  test(`self-serve catalogue, preview and consent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/services/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid^="services-door-"]')).toHaveCount(manifest.resources.length);
    await expect(page.locator('[data-testid="services-ungrouped"]')).toHaveCount(0);
    const wrapper = page.locator('[data-testid="services-door-/api/wrapper"]');
    await expect(wrapper.getByRole('link', { name: /Free preview/ })).toHaveCount(0);
    const input = wrapper.getByRole('textbox');
    await input.focus(); await expect(input).toBeFocused();
    await input.fill('usdc.e:arbitrum');
    const link = wrapper.getByRole('link', { name: /Free preview/ });
    const href = new URL((await link.getAttribute('href'))!);
    expect(href.searchParams.get('id')).toBe('usdc.e:arbitrum');
    expect(href.searchParams.get('preview')).toBe('1');
    await input.fill('<wrapped-symbol:chain>'); await expect(link).toHaveCount(0);
    const banner = page.getByRole('region', { name: 'Cookie consent' });
    await expect(banner).toBeVisible();
    if (width < 640) expect((await banner.locator('p').boundingBox())!.width).toBeGreaterThanOrEqual(200);
    for (const button of await banner.locator('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const essential = banner.getByRole('button', { name: 'Essential only', exact: true });
    await essential.focus(); await page.keyboard.press('Enter'); await expect(banner).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('csoai_cookie_consent'))).toBe('declined');
  });
}
test('unavailable manifest is not invented service availability', async ({ page }) => {
  await page.route('**/.well-known/x402.json', route => route.fulfill({
    status: 503, contentType: 'application/json', body: '{"error":"fixture unavailable"}',
  }));
  await page.goto('/services/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('alert')).toContainText('could not be read');
  await expect(page.locator('[data-testid^="services-door-"]')).toHaveCount(0);
});
