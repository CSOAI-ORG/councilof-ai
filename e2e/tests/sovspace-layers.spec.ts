import { test, expect } from '@playwright/test';

/**
 * Sov Space layer specs — the unification contract (2026-08-01).
 *
 * 1. Old routes redirect into the container (arena/globe/towns are layers now).
 * 2. The arena layer carries its signed-fixture evidence strip (sha256-pinned).
 * 3. The towns layer shows its feed state honestly (live / partial / last-known).
 * 4. Geolibre is opt-in: manual shard pick renders jurisdiction frameworks;
 *    nothing resolves IPs without consent (no ipapi call on plain load).
 * 5. The AI card pipeline: a seeded C card renders on the timeline; a J card
 *    renders as confirmed. Every AI call visible — that's the OS watching itself.
 *
 * Run: BASE_URL=http://localhost:4173 npx playwright test --config e2e/playwright.config.ts sovspace-layers --project=chromium
 */

test('redirects: legacy routes land inside Sov Space as layers', async ({ page }) => {
  test.setTimeout(90_000); // shared machine gets busy during parallel sweeps
  await page.goto('/gspc-arena', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/sov-space\?view=arena/);

  // /globe is served by the consolidation redirect page (static file wins over
  // the SPA) — the canonical Earth is globe3d.html, which the globe LAYER frames.
  // Cloudflare Pages auto-rewrites static .html to its friendly URL, so the
  // browser may end up at /globe3d (no extension) instead of /globe3d.html.
  // Accept either form — the rewrite is platform behavior we can't disable
  // from _redirects. Real link targets elsewhere in the app still hit
  // /globe3d.html directly (OsLauncher, GovGraph, SovereignTown).
  await page.goto('/globe', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/globe3d(\.html)?(\?|#|$)/);

  await page.goto('/sovereign-town', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/sov-space\?view=towns/);

  await page.goto('/towns', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/sov-space\?view=towns/);
});

test('container: view switcher present and navigates between layers', async ({ page }) => {
  await page.goto('/sov-space', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('OS layers ·')).toBeVisible();

  await page.getByRole('link', { name: '🏟 Arena' }).first().click();
  await expect(page).toHaveURL(/view=arena/);

  await page.getByRole('link', { name: '🎛 Console' }).first().click();
  await expect(page).toHaveURL(/\/sov-space$/);
});

test('arena layer: signed fixture strip carries sha256 evidence + the no-composite law', async ({ page }) => {
  await page.goto('/sov-space?view=arena', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/signed fixture set · sov\.arena\/v2/)).toBeVisible();
  await expect(page.getByText(/No composite scores on any public surface/)).toBeVisible();
  await expect(page.getByText(/sha256:3ba5158e80/).first()).toBeVisible();
});

test('towns layer: feed state is labelled honestly, never silent fake-live', async ({ page }) => {
  await page.goto('/sov-space?view=towns', { waitUntil: 'domcontentloaded' });
  // Upstream (proofof-site.vercel.app) currently 402s + CORS-blocks — the badge
  // MUST show a non-live state. If the upstream heals, "live feed" is also fine —
  // what we assert is that a state badge exists at all.
  const badge = page.locator('text=/live feed · fetched|partial feed|last-known figures/');
  await expect(badge.first()).toBeVisible({ timeout: 15000 });

  // Oracle fleet strip: on this static preview the Pages Function proxy is absent,
  // so the strip MUST render its honest OFFLINE state (live state is fine too).
  const fleet = page.locator('text=/Oracle fleet · (live|offline)/');
  await expect(fleet.first()).toBeVisible({ timeout: 15000 });
  if (await page.locator('text=Oracle fleet · offline').first().isVisible().catch(() => false)) {
    await expect(page.getByText(/rendered as OFFLINE, not simulated/)).toBeVisible();
  }
});

test('geolibre: opt-in only — no IP resolution on plain load; manual pick renders frameworks', async ({ page }) => {
  const ipapiCalls: string[] = [];
  page.on('request', (req) => { if (req.url().includes('ipapi.co')) ipapiCalls.push(req.url()); });

  await page.goto('/sov-space?view=arena', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  expect(ipapiCalls).toHaveLength(0); // no silent geolocation, ever

  // Manual shard pick (GDPR-clean, no network) → jurisdiction frameworks render
  await page.evaluate(() => {
    localStorage.setItem('geolibre.v1', JSON.stringify({ enabled: true, source: 'manual', regionCode: 'EU', countryIso2: '' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/local shard: European Union \(manual\)/)).toBeVisible();
  await expect(page.getByText(/EU AI Act · GDPR/).first()).toBeVisible();
});

test('card pipeline: seeded C and J cards render on the one timeline', async ({ page }) => {
  test.setTimeout(120_000); // canvas sweep is pointer-work; allow a loaded machine
  const now = Date.now();
  // Seed must be written on the TARGET origin: load once, write, reload.
  await page.goto('/sov-space', { waitUntil: 'domcontentloaded' });
  await page.evaluate((now) => {
    localStorage.setItem('aiCardBus.v1', JSON.stringify([
      { id: 'ac-test-j', kind: 'council-verdict', space: 'J', ts: now - 1000, summary: 'TESTCARD signed verdict — triage AI permitted with conditions', evidence: 'sov-time ledger · cspace-verdict', source: 'live' },
      { id: 'ac-test-c', kind: 'dock-ask', space: 'C', ts: now, summary: 'TESTCARD dock ask — what does Article 50 require?', detail: 'transparency duties…', latencyMs: 812, source: 'live' },
    ]));
  }, now);
  await page.reload({ waitUntil: 'domcontentloaded' });

  // The timeline is a canvas (class cursor-crosshair): events are dots, claims
  // surface in the hover tooltip (DOM). Sweep every crosshair canvas until the
  // tooltip shows each seeded card.
  const canvases = page.locator('canvas.cursor-crosshair');
  await expect(canvases.first()).toBeVisible({ timeout: 10000 });

  async function tooltipShows(pattern: RegExp): Promise<boolean> {
    const n = await canvases.count();
    for (let c = 0; c < n; c++) {
      await canvases.nth(c).scrollIntoViewIfNeeded();
      const box = await canvases.nth(c).boundingBox();
      if (!box) continue;
      // Fresh events sit at the far right edge; lane-staggered dots live in the
      // 0.45–0.80 y band. Walk that grid until the tooltip carries the pattern.
      for (let x = box.width - 4; x > box.width - 160; x -= 12) {
        for (let yr = 0.45; yr <= 0.8; yr += 0.03) {
          await page.mouse.move(box.x + x, box.y + box.height * yr);
          await page.waitForTimeout(40);
          if (await page.getByText(pattern).first().isVisible().catch(() => false)) return true;
        }
      }
    }
    return false;
  }

  expect(await tooltipShows(/TESTCARD signed verdict/)).toBe(true);
  expect(await tooltipShows(/TESTCARD dock ask/)).toBe(true);
});
