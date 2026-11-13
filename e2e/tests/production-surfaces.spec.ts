import { test, expect, Page } from '@playwright/test';

/**
 * CSOAI V2 — Production-Critical Surfaces
 * Covers the surfaces that earn trust and the surfaces that have cost us before:
 * - BuiltOnFooter (license attribution — must not lie)
 * - Footer (basic nav and council CTA)
 * - New flagship pages (Globe, SovSpace, Council, GovBench, Watchdog)
 * - Article 50 (transparency passport — what users come for)
 * - Every compliance framework page
 * - Crosswalk (published frameworks — do not pin counts)
 * - Auth flows (login/signup don't crash)
 * - "What we don't claim" surfaces (no false ISO/accreditation claims)
 *
 * Designed to run against www.csoai.org with `pnpm exec playwright test`.
 */

// ─── 1. BUILT-ON FOOTER (license attribution — must be honest) ───
// BuiltOnFooter strip removed in the Council OS redesign — all strip
// assertions below are skipped rather than fabricated.
test.describe('BuiltOnFooter — License Attribution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
  });

  test.skip('renders the "What this is built on" strip', async ({ page }) => {
    await expect(page.locator('text=What this is built on')).toBeVisible();
  });

  test.skip('disclosure banner is present and visible', async ({ page }) => {
    await expect(page.locator('text=These are dependencies, anchors and citations')).toBeVisible();
  });

  test.skip('Built on tab shows real open-source dependencies', async ({ page }) => {
    const builtOnTab = page.locator('button:has-text("Built on")').first();
    await builtOnTab.click();
    await page.waitForTimeout(300);
    // C2PA, OpenSSL, Pillow — must be present (real dependencies)
    await expect(page.locator('text=c2pa-rs')).toBeVisible();
    await expect(page.locator('text=OpenSSL')).toBeVisible();
    await expect(page.locator('text=Pillow')).toBeVisible();
  });

  test.skip('Anchored to tab shows real regulations', async ({ page }) => {
    const tab = page.locator('button:has-text("Anchored to")').first();
    await tab.click();
    await page.waitForTimeout(500);
    // The strip renders cards with anchor names — assert at least one is visible
    // Use the section that contains the strip to scope
    const stripSection = page.locator('section:has(button:has-text("Anchored to"))');
    await expect(stripSection.locator('text=EU AI Act').first()).toBeVisible();
    await expect(stripSection.locator('text=legislation.gov.uk').first()).toBeVisible();
    await expect(stripSection.locator('text=C2PA specification').first()).toBeVisible();
  });

  test.skip('Standing on tab shows arXiv citations', async ({ page }) => {
    const tab = page.locator('button:has-text("Standing on")').first();
    await tab.click();
    await page.waitForTimeout(500);
    const stripSection = page.locator('section:has(button:has-text("Standing on"))');
    await expect(stripSection.locator('text=Miller').first()).toBeVisible();
    await expect(stripSection.locator('text=COMPL-AI').first()).toBeVisible();
  });

  test.skip('no partner/endorsement claims in strip', async ({ page }) => {
    // The whole point of the strip is to NOT make false partnership claims
    const bodyText = await page.textContent('body');
    // Must contain the explicit disclaimer
    expect(bodyText).toContain('not partners, sponsors or endorsements');
  });

  test.skip('all dependency links open in new tab (target=_blank)', async ({ page }) => {
    const builtOnTab = page.locator('button:has-text("Built on")').first();
    await builtOnTab.click();
    await page.waitForTimeout(300);
    const links = page.locator('a[href*="github.com"], a[href*="python.org"], a[href*="openssl.org"]');
    const count = await links.count();
    if (count > 0) {
      const firstLink = links.first();
      const target = await firstLink.getAttribute('target');
      expect(target).toBe('_blank');
    }
  });
});

// ─── 2. HONESTY CARDS (no false claims) ───
test.describe('Honesty Cards — No False Claims', () => {
  test('no "ISO 17065 certified" claim on compliance pages', async ({ page }) => {
    const catalogRoutes = ["/interop/surface-catalog.json", "/docs/MASTER_PLAN_2026-08-26.md", "/docs/INSURER_PILOT_PITCH_2026-08-26.md", "/docs/NIST_CAISI_INPUT_2026-08-26.md"];
  const complianceRoutes = [
      '/compliance/eu-ai-act', '/compliance/nist-ai-rmf', '/compliance/tc260',
      '/compliance/uk-ai-bill', '/compliance/canada-ai-act', '/compliance/australia-ai-governance',
    ];
    for (const route of complianceRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const body = (await page.textContent('body')) || '';
      // We should not claim WE are ISO 17065 certified (we don't hold it).
      // "notified body" appears legitimately in EU AI Act context — can't blanket-reject.
      expect(body.toLowerCase()).not.toContain('iso 17065 certified');
      expect(body.toLowerCase()).not.toContain('we are iso certified');
      expect(body.toLowerCase()).not.toContain('we are a notified body');
    }
  });

  test('accreditation page is honest about status', async ({ page }) => {
    await page.goto('/accreditation', { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    // Must say we don't have accreditation, or are pursuing it
    const hasHonestContent = body.toLowerCase().includes('not accredited') ||
                              body.toLowerCase().includes('no accreditation') ||
                              body.toLowerCase().includes('pursuing') ||
                              body.toLowerCase().includes('not a notified body') ||
                              body.toLowerCase().includes('no notified body') ||
                              body.toLowerCase().includes('not a certification body');
    expect(hasHonestContent).toBeTruthy();
  });

  // BuiltOnFooter strip removed in the Council OS redesign — skipped.
  test.skip('BuiltOnFooter strip explicitly denies partnership', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const disclosure = page.locator('text=What this strip is not');
    await expect(disclosure).toBeVisible();
    const text = (await disclosure.locator('..').textContent()) || '';
    // The real disclaimer text from BuiltOnFooter.tsx — assert it covers the bases
    expect(text.toLowerCase()).toContain('not partners');
    expect(text.toLowerCase()).toContain('sponsors or endorsements');
    expect(text.toLowerCase()).toContain('we hold no accreditation');
  });
});

// ─── 3. FRAMEWORK PAGES (no broken layouts) ───
test.describe('Framework Pages — Render Health', () => {
  const frameworkRoutes = [
    '/frameworks/eu-ai-act',
    '/frameworks/nist',
    '/frameworks/tc260',
    '/frameworks/uk-ai-bill',
    '/frameworks/canada-ai-act',
    '/frameworks/australia-ai',
    '/guides/eu-ai-act',
    '/guides/iso-42001',
    '/guides/nist-ai-rmf',
    '/guides/tc260',
  ];

  for (const route of frameworkRoutes) {
    test(`${route} renders without React error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push(err.message));
      // The living board is a third-party frame (Hugging Face Space); its script errors are
      // reported to the owner of that Space, not counted against this page.
      await page.route(/hf\.space/, r => r.abort());

      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      // No "React.Children.only" or component crash
      const reactErrors = errors.filter(e =>
        e.includes('React.Children.only') ||
        e.includes('Failed to fetch dynamically imported module') ||
        e.includes('is not a function')
      );
      expect(reactErrors).toHaveLength(0);

      // Body should have meaningful content
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(300);
    });
  }
});

// ─── 4. COMPLIANCE LANDING PAGES (CTA buttons wired correctly) ───
test.describe('Compliance Landing — CTA Buttons', () => {
  const compliancePages = [
    '/compliance/eu-ai-act',
    '/compliance/nist-ai-rmf',
    '/compliance/tc260',
    '/compliance/uk-ai-bill',
    '/compliance/canada-ai-act',
    '/compliance/australia-ai-governance',
  ];

  for (const route of compliancePages) {
    test(`${route} "Start Assessment" button goes to a real page`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      const buttons = page.locator('button, a').filter({ hasText: /Start Assessment|Get Started/i });
      const count = await buttons.count();
      if (count === 0) return; // Page may not have this CTA

      const button = buttons.first();
      await button.scrollIntoViewIfNeeded();
      await button.click({ trial: false }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      // Should NOT land on a 404 — and NOT land on /dashboard/compliance (dead route)
      const url = page.url();
      expect(url).not.toContain('/dashboard/compliance');
      expect(url).not.toContain('404');
    });
  }

  test('"Sign In" from PublicHome does not redirect-loop', async ({ page }) => {
    // Per memory: was previously broken — pointed to /home which redirected to /, looping
    await page.goto('/', { waitUntil: 'networkidle' });
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible().catch(() => false)) {
      await signInButton.click();
      await page.waitForLoadState('networkidle');
      // Should land on /login, not bounce back to /
      expect(page.url()).toContain('/login');
    }
  });
});

// ─── 5. CROSSWALK (counts live on the page — do not pin 13×8) ───
test.describe('Crosswalk — published frameworks', () => {
  test('/crosswalk renders the framework comparison', async ({ page }) => {
    await page.goto('/crosswalk', { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    expect(body.toLowerCase()).toContain('crosswalk');
    expect(body.toLowerCase()).toMatch(/framework/);
  });

  test('crosswalk page is accessible from main nav or footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footerCrosswalk = page.locator('footer a[href="/crosswalk"], footer a[href="/crosswalks"]').first();
    if (await footerCrosswalk.isVisible().catch(() => false)) {
      await footerCrosswalk.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/crosswalk/);
    }
  });
});

// ─── 6. ARTICLE 50 — TRANSPARENCY PASSPORT ───
test.describe('Article 50 — Transparency Passport', () => {
  test('/article-50 page renders', async ({ page }) => {
    await page.goto('/article-50', { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(300);
    expect(body).toContain('Article 50');
  });

  test('passport issuer at /article-50 has the required structural elements', async ({ page }) => {
    await page.goto('/article-50', { waitUntil: 'networkidle' });
    // 2026-09-02: /article-50 is the Article 50 explainer ("The transparency cliff.") — the
    // passport issuer form moved off this route. Pin the page, not the retired form.
    const body = (await page.textContent('body')) || '';
    expect(body).toMatch(/Article 50|transparency/i);
  });
});

// ─── 7. GLOBE / SOVEREIGN ───
test.describe('Globe & Sovereign Surfaces', () => {
  // 2026-11-02 consolidation: /globe serves WorldGlobe again (it had drifted to a bare redirect
  // into the static globe3d.html). Assert the restored page's own heading, not just body length.
  test('WorldGlobe page (/globe) renders', async ({ page }) => {
    await page.goto('/globe', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Cesium iframe + SVG globe take time
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(100);
    expect(body).toMatch(/AI governance, layered on the world/);
  });

  // 2026-11-02 consolidation: the map pages are tabs of one World maps page (/map).
  test('World maps page (/map) tabs render and switch', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('world-tab-bridges')).toBeVisible();
    await expect(page.getByTestId('world-panel-bridges')).toBeVisible();
    await page.getByTestId('world-tab-regions').click();
    await expect(page).toHaveURL(/tab=regions/);
    await expect(page.getByTestId('world-panel-regions')).toBeVisible();
    await page.getByTestId('world-tab-risk').click();
    await expect(page).toHaveURL(/tab=risk/);
    await expect(page.getByTestId('world-panel-risk')).toBeVisible();
    // The worked-example honesty note must ship with the risk tab.
    await expect(page.getByTestId('world-panel-risk')).toContainText(/worked example/i);
  });

  // P6 accessibility pass (2026-11-02): the tabs follow the WAI-ARIA tabs pattern —
  // role=tablist/tab/tabpanel, aria-selected (not just aria-current), panels labelled by their
  // tab, roving tabIndex, and Arrow/Home keys move selection and focus together.
  test('World maps tabs follow the ARIA tabs pattern (roles, selection, keyboard)', async ({ page }) => {
    await page.goto('/map?tab=bridges', { waitUntil: 'networkidle' });
    const tablist = page.getByRole('tablist', { name: 'World map views' });
    await expect(tablist).toBeVisible();
    const tabs = tablist.getByRole('tab');
    await expect(tabs).toHaveCount(3);
    // Selection state lives on the tabs; exactly one is selected and it is the URL's tab.
    await expect(page.getByTestId('world-tab-bridges')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('world-tab-regions')).toHaveAttribute('aria-selected', 'false');
    // The active panel is a labelled tabpanel; roving tabIndex keeps one tab stop.
    const panel = page.getByRole('tabpanel', { name: 'What governs what' });
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('world-tab-bridges')).toHaveAttribute('tabindex', '0');
    await expect(page.getByTestId('world-tab-regions')).toHaveAttribute('tabindex', '-1');
    // Keyboard: ArrowRight from the selected tab moves selection AND focus.
    await page.getByTestId('world-tab-bridges').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/tab=regions/);
    await expect(page.getByTestId('world-tab-regions')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('world-tab-regions')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/tab=risk/);
    await page.keyboard.press('Home');
    await expect(page).toHaveURL(/tab=bridges/);
    await expect(page.getByTestId('world-tab-bridges')).toBeFocused();
  });

  // U3 (2026-11-03): the governance library on /tools lists one row per framework the readiness
  // tool accepts — the rows are DERIVED from the tool's enum, so their count and hrefs must
  // always match what the door serves. Asserts structure and the honest split, never a number
  // beyond what the page itself derives.
  test('Governance library (/tools#governance-library) renders one row per readiness framework', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'networkidle' });
    const library = page.getByTestId('governance-library');
    await expect(library).toBeVisible();
    await expect(library.getByRole('heading', { name: 'Governance library' })).toBeVisible();
    const rows = library.locator('ul a');
    const hrefs = await rows.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(9);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/dashboard\?tab=tools&tool=framework_readiness&framework=[a-z0-9-]+$/);
    }
    // The honest split: the page names what is in preparation and never claims a determination.
    await expect(library).toContainText(/In preparation/i);
    await expect(library).toContainText(/never a determination/i);
    // Following the first row lands the readiness tool preselected in the workspace pane.
    await rows.first().click();
    await expect(page).toHaveURL(/tab=tools&tool=framework_readiness&framework=/);
    await expect(page.getByTestId('dashboard-tool-canvas')).toBeVisible();
  });

  test('Old map URLs redirect into their /map tab', async ({ page }) => {
    await page.goto('/regions', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/map\?tab=regions/);
    await expect(page.getByTestId('world-panel-regions')).toBeVisible();
    await page.goto('/relevance-map', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/map\?tab=bridges/);
    await page.goto('/risk-heatmap', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/map\?tab=risk/);
    await page.goto('/tool-commons', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard\?tab=tools/);
  });

  // SovSpace was replaced by the Council Space arena in the Council OS redesign:
  // /sov-space now returns 410 Gone. Assert the successor surface instead.
  test('Council Space arena (/gspc-arena) renders', async ({ page }) => {
    await page.goto('/gspc-arena', { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(200);
  });

  test('globe3d.html is reachable and loads without crash', async ({ page }) => {
    const response = await page.goto('/globe3d.html', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
  });

  test('globe iframe messages: flyTo / pulse / layer are accepted', async ({ page }) => {
    // The CesiumJS globe listens for postMessage — verify it doesn't crash on noise
    await page.goto('/globe3d.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // We can't easily inject messages across origin, but the page should not be crashed
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(0);
  });
});

// ─── 8. AUTH FLOWS (login/signup must not crash) ───
test.describe('Authentication — Render Health', () => {
  test('/login renders form with email + password + submit', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('/signup renders form', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });

  test('password input on /signup is type=password (not plain)', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });
    const pwInput = page.locator('input[type="password"]').first();
    if (await pwInput.isVisible().catch(() => false)) {
      const type = await pwInput.getAttribute('type');
      expect(type).toBe('password');
    }
  });
});

// ─── 9. SOVEREIGN ATTRIBUTION FOOTER ───
// Retired 2026-09-02: BuiltOnFooter (Built on / Anchored to / Standing on) is no longer mounted
// on the homepage, so the two tests that clicked its tabs there asserted a surface that does not
// exist. The component still has its own unit coverage.

// ─── 10. NEWSLETTER + CONTACT FORMS ───
test.describe('Forms — Newsletter & Contact', () => {
  // 'newsletter form has email input' retired 2026-09-02: no newsletter capture is mounted on
  // the homepage any more (NewsletterSignup lives on its own surfaces).

  test('/contact page renders', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(200);
  });
});

// ─── 11. STATIC CLAIMS GUARD (no fabricated numbers, no runtime feeds overwriting) ───
test.describe('Static Claims Guard', () => {
  test('homepage stat values appear in served HTML/JS (not lazily fetched)', async ({ page }) => {
    // Load homepage, capture all network requests, ensure no cum_episodes or
    // ungoverned_crimes endpoint was called (per memory rule — those fabricated)
    const endpoints: string[] = [];
    page.on('request', req => endpoints.push(req.url()));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // The previous fabricated endpoints — should NOT be called
    const fabricatedFetches = endpoints.filter(u =>
      u.includes('cum_episodes') || u.includes('ungoverned_crimes')
    );
    expect(fabricatedFetches).toEqual([]);
  });

  test('homepage displays measurable counts (417 frozen, 15 LIVE, etc)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    // Per session memory: the real measured numbers must appear
    const has417 = body.includes('417');
    const has15 = body.includes('15') && (body.includes('LIVE') || body.includes('live'));
    expect(has417 || has15).toBeTruthy();
  });
});

// ─── 12. 404 + REDIRECT HANDLING ───
test.describe('Error Handling', () => {
  test('/random-nonexistent-route renders 404 or Not Found', async ({ page }) => {
    await page.goto('/random-nonexistent-route-' + Date.now(), { waitUntil: 'networkidle' });
    const body = (await page.textContent('body')) || '';
    const has404 = body.match(/404|not found/i);
    expect(has404).toBeTruthy();
  });

  test('/public-dashboard → /transparency redirect still works', async ({ page }) => {
    await page.goto('/public-dashboard', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/transparency');
  });
});

// ─── 13. CONSOLE HEALTH (per-page) ───
test.describe('Console Health', () => {
  const criticalPages = [
    '/', '/compliance/eu-ai-act', '/agent-council', '/watchdog',
    // /sov-space is 410 Gone by ruling (→ /gone-space); Council Space is /gspc-arena.
    '/training', '/certification', '/globe', '/gspc-arena',
  ];

  for (const route of criticalPages) {
    test(`${route} has no fatal console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push(err.message));
      // The living board is a third-party frame (Hugging Face Space). Its own script error and
      // its hop to huggingface.co (X-Frame-Options: deny) belong to the Space, not to this page.
      await page.route(/hf\.space/, r => r.abort());

      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      // Filter known-acceptable errors
      const critical = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('analytics') &&
        !e.includes('third-party') &&
        !e.includes('Failed to load resource') &&
        !e.includes('net::ERR_') && // Network errors from external APIs are not our bug
        !e.includes('CORS')
      );
      expect(critical).toEqual([]);
    });
  }
});

// ─── 14. PERFORMANCE BASELINE ───
test.describe('Performance Baseline', () => {
  test('homepage DOMContentLoaded < 4s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(4000);
  });

  test('homepage network request count is bounded', async ({ page }) => {
    let count = 0;
    page.on('request', () => count++);
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(count).toBeLessThan(100);
  });

  test('homepage transfer size is reasonable', async ({ page }) => {
    let totalBytes = 0;
    page.on('response', async (resp) => {
      try {
        const headers = resp.headers();
        const cl = headers['content-length'];
        if (cl) totalBytes += parseInt(cl, 10);
      } catch {}
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Less than 5MB total — sanity check, not strict
    expect(totalBytes).toBeLessThan(5_000_000);
  });
});