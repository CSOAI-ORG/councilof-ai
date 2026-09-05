import { test, expect, request } from '@playwright/test';

/**
 * The buyer journey, walked the way a buyer walks it.
 *
 * Every step here has failed in production at least once on 2026-09-05, which is why each is a
 * step rather than an assumption:
 *   · /api/free-door is the ONLY resource of ours the x402 Bazaar indexes — the paid doors are
 *     absent, because a resource is catalogued off a confirmed settle and neither index has a
 *     registration endpoint. So a discovering agent lands here or nowhere.
 *   · That door named the paid tiers in PROSE and nowhere a machine could read, so an agent that
 *     found us could not learn anything was for sale.
 *   · /api/x402 published free_preview=?obligation=<id>&subject=<s>, which answered 404, because
 *     <id> means a MODEL id one tier above and an OBLIGATION id there.
 *   · /.well-known/x402.json advertised art50 with ?vendor=<slug>, a parameter its handler does
 *     not read — 400, and a buyer turned away before any payment was attempted.
 *
 * A rail proven to EARN cannot see any of these: that proof starts from a 402.
 */

const FILL: Record<string, string> = {
  '<id>': 'gpt-4o', '<slug>': 'governance', '<s>': 'gpt-4o', '<model-id>': 'gpt-4o',
  '<dora|cra|article-50|article-53>': 'dora', '<dora|eu-cra|article-50|article-53>': 'dora',
  '<symbol|issuer_address>': 'RLUSD', '<symbol>': 'RLUSD', '<iso>': '2026-09-01',
  '<64-hex>': 'a'.repeat(64),
  '<https://…>': encodeURIComponent('https://councilof.ai/images/coliseum_hero_arena.jpg'),
};
const fill = (u: string) => Object.entries(FILL).reduce((a, [k, v]) => a.split(k).join(v), u);

test('a discovering agent reaches a payment challenge from the indexed door alone', async () => {
  const api = await request.newContext({ baseURL: 'https://councilof.ai' });

  // 1. the door the Bazaar names
  const door = await api.get('/api/free-door');
  expect(door.status(), 'the indexed door must answer 402').toBe(402);
  expect(door.headers()['payment-required'], 'an indexer reads this header').toBeTruthy();
  const body = await door.json();
  expect(body.x402Version).toBe(2);
  expect(body.extensions?.bazaar, 'without this block the settle indexes nothing').toBeTruthy();

  // 2. it must say, machine-readably, that anything is for sale
  expect(body.catalog, 'prose is not a pointer an agent can follow').toBe('https://councilof.ai/api/x402');

  // 3. the catalogue resolves and advertises tiers
  const cat = await api.get('/api/x402');
  expect(cat.status()).toBe(200);
  const tiers = (await cat.json()).tiers as { id: string; resource?: string; free_preview?: string }[];
  expect(tiers.length).toBeGreaterThanOrEqual(6);

  // 4. every advertised URL must be usable AS PUBLISHED
  const failures: string[] = [];
  for (const t of tiers) {
    for (const [field, raw] of [['resource', t.resource], ['free_preview', t.free_preview]] as const) {
      if (!raw) continue;
      const u = fill(raw);
      if (u.includes('<')) { failures.push(`${t.id}.${field} has an unfilled placeholder: ${u}`); continue; }
      const r = await api.get(u.replace('https://councilof.ai', ''));
      const ok = field === 'resource' ? r.status() === 402 : [200, 402].includes(r.status());
      if (!ok) failures.push(`${t.id}.${field} answered ${r.status()} as published: ${raw}`);
    }
  }
  expect(failures, `\n  ${failures.join('\n  ')}\n`).toEqual([]);
  await api.dispose();
});

test('every door the discovery manifest advertises answers a challenge as published', async () => {
  const api = await request.newContext({ baseURL: 'https://councilof.ai' });
  const m = await (await api.get('/.well-known/x402.json')).json();
  const failures: string[] = [];
  for (const r of m.resources as { url: string; paid_for: string | null }[]) {
    const u = fill(r.url);
    if (u.includes('<')) { failures.push(`${r.url} has an unfilled placeholder`); continue; }
    const res = await api.get(u.replace('https://councilof.ai', ''));
    if (res.status() !== 402) failures.push(`${r.url} answered ${res.status()}, not 402 — a buyer is turned away`);
  }
  expect(failures, `\n  ${failures.join('\n  ')}\n`).toEqual([]);
  await api.dispose();
});

for (const [w, h, label] of [[1280, 800, 'desktop'], [390, 844, 'mobile']] as const) {
  test(`a human buyer sees /products at ${label} with no price and no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const r = await page.goto('/products/', { waitUntil: 'networkidle' });
    expect(r?.status()).toBe(200);
    // Verification-by-window-resize does not reflow the page; the viewport is set above so this
    // measures what a phone actually renders.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, 'the page must not scroll sideways').toBe(false);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text, 'public prices are forbidden on every surface').not.toMatch(/[£$]\s?\d/);
    expect(text).toMatch(/SKU/i);
  });
}
