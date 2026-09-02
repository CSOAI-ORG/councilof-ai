import { test, expect, type Page } from "@playwright/test";

/**
 * Council OS shell smoke.
 *
 * The Dashboard IS Council OS: every door on the site lands on /dashboard?tab=<id>, and every
 * tab must render INSIDE the shell (sidebar + header + pane), with no uncaught exception, no
 * horizontal overflow, and — on a phone — the rail closed and the pane full-width.
 *
 * What is asserted is structure, never a number: the static server has no /api/*, so each
 * pane is seen in its honest empty state. Third-party frames (the living Hugging Face board)
 * are blocked so a defect in someone else's script cannot fail our shell.
 *
 * Runs with `npm run test:e2e:shell` against dist/client (see playwright.shell.config.ts).
 */

/** Legacy `/os?lobby=<id>` door ids that are not sidebar tabs but must still resolve to a pane. */
const LEGACY_PANE_IDS = ["cards", "evidence", "embed", "matrix", "play", "state", "leaderboard", "terminal", "assess"];

const IGNORED_CONSOLE = [
  /Failed to load resource/, // /api/* does not exist on the static server
  /net::ERR_/,
  /status of (401|403|404|5\d\d)/,
  /hf\.space/,
  /favicon/,
];

async function collectErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e?.message ?? e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED_CONSOLE.some((r) => r.test(m.text()))) consoleErrors.push(m.text());
  });
  return { pageErrors, consoleErrors };
}

async function openTab(page: Page, id: string) {
  await page.goto(`/dashboard?tab=${id}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function expectShell(page: Page, id: string) {
  // The shell's own rail (a pane may carry an <aside> of its own, e.g. the estate-state tapes).
  await expect(page.locator('aside nav[aria-label="Council software destinations"]'), `${id}: sidebar present`).toHaveCount(1);
  await expect(page.locator("header nav[aria-label='You are here']"), `${id}: header trail`).toHaveCount(1);
  await expect(page.locator('[data-testid="free-rail"]'), `${id}: canon free rail`).toHaveCount(1);
  // The pane never carries the marketing site chrome — one chrome at a time. The site Header
  // is the sticky top bar (client/src/components/Header.tsx); the shell's own header is not sticky.
  await expect(page.locator("header.sticky"), `${id}: no marketing site header`).toHaveCount(0);
  await expect(page.locator("footer.surface-raised"), `${id}: no marketing site footer`).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${id}: no horizontal overflow`).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ context }) => {
  await context.route(/hf\.space/, (r) => r.abort());
});

test("sidebar lists every Dashboard tab as a direct /dashboard?tab= link", async ({ page }) => {
  await openTab(page, "board");
  const hrefs = await page.locator('aside nav a[href^="/dashboard?tab="]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThanOrEqual(10);
  for (const h of hrefs) expect(h).toMatch(/^\/dashboard\?tab=[a-z]+$/);
  // No door on the shell hops through the legacy /os redirect.
  const legacy = await page.locator('a[href^="/os?"]').count();
  expect(legacy, "no /os?lobby= hops inside the shell").toBe(0);
});

test("every sidebar tab renders its own pane inside the shell, error-free", async ({ page, isMobile }) => {
  test.setTimeout(240_000);
  await openTab(page, "board");
  const ids = await page
    .locator('aside nav a[href^="/dashboard?tab="]')
    .evaluateAll((as) => as.map((a) => (a.getAttribute("href") || "").replace("/dashboard?tab=", "")));
  expect(ids).toContain("board");
  const { pageErrors, consoleErrors } = await collectErrors(page);
  for (const id of ids) {
    await openTab(page, id);
    if (id === "workbench") {
      // tabs.ts marks the workbench `auth: "required"`: signed out, RequireAuth sends the reader to
      // /login — the rail says so before the click, so the redirect IS the correct behaviour here.
      await expect(page, "workbench: signed-out reader is sent to /login").toHaveURL(/\/login/);
      continue;
    }
    await expectShell(page, id);
    const pane = page.locator(`[data-testid="dashboard-pane-${id}"]`);
    if (id === "home") {
      await expect(page.locator("h1"), "home: the overview").toContainText(/Dashboard/);
    } else {
      await expect(pane, `${id}: its own pane is mounted`).toHaveCount(1);
      await expect(pane, `${id}: a registered pane, not the fallback`).toHaveAttribute("data-pane-known", "yes");
    }
    // The trail names the open pane: "Council OS › <label>".
    const crumb = page.locator("header nav[aria-label='You are here'] [aria-current='page']");
    await expect(crumb, `${id}: current crumb present`).toHaveCount(1);
    if (isMobile) {
      const asideWidth = await page.locator('aside:has(nav[aria-label="Council software destinations"])').evaluate((el) => el.getBoundingClientRect().width);
      expect(asideWidth, `${id}: rail closed on a phone`).toBeLessThanOrEqual(1);
    }
  }
  expect(pageErrors, "no uncaught exceptions across the tabs").toEqual([]);
  expect(consoleErrors, "no console errors across the tabs").toEqual([]);
});

test("legacy door ids resolve to a real pane, never the fallback", async ({ page }) => {
  test.setTimeout(120_000);
  const { pageErrors } = await collectErrors(page);
  for (const id of LEGACY_PANE_IDS) {
    await openTab(page, id);
    await expectShell(page, id);
    const known = page.locator('[data-testid^="dashboard-pane-"][data-pane-known="yes"]');
    await expect(known, `${id}: resolves to a registered pane`).toHaveCount(1);
  }
  expect(pageErrors).toEqual([]);
});

test("an unknown tab id says so and shows the live board", async ({ page }) => {
  await openTab(page, "no-such-pane");
  await expectShell(page, "no-such-pane");
  await expect(page.locator('[data-testid="dashboard-pane-unknown"]')).toContainText("No pane is named");
  await expect(page.locator('[data-testid="dashboard-pane-no-such-pane"]')).toHaveAttribute("data-pane-known", "no");
});

test("the board pane quotes GET /api/gspc and embeds the living Space — nothing typed", async ({ page }) => {
  await openTab(page, "board");
  const pane = page.locator('[data-testid="dashboard-pane-board"]');
  await expect(pane).toHaveCount(1);
  await expect(pane.locator('a[href="/api/gspc"]'), "the payload link").toHaveCount(1);
  await expect(pane.locator('a[href="/dashboard?tab=leaderboard"]'), "leaderboard opens in-shell, no hop").toHaveCount(1);
  // The master Space's origin is HomeGspcBoard's SPACE_EMBED_ORIGIN (csoai/gspc-board since #1148); pin the
  // Hugging Face static-Space host, not one Space name, so a fold of Spaces does not fail the shell.
  await expect(pane.locator('iframe[src*=".hf.space"]'), "the living Space is the board").toHaveCount(1);
  // With no /api/gspc on the static server the strip must say so in words, not show a count.
  await expect(pane.locator('a[href="/leaderboard"]'), "no legacy /leaderboard hop").toHaveCount(0);
});

test("legacy /os and /gspc-scoreboard doors land inside the Dashboard", async ({ page }) => {
  await page.goto("/os?lobby=verify", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/dashboard\?.*tab=verify/, { timeout: 15_000 });
  await expect(page.locator('[data-testid="dashboard-pane-verify"]')).toHaveCount(1);
  await page.goto("/gspc-scoreboard", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/dashboard\?tab=board/, { timeout: 15_000 });
  await expect(page.locator('[data-testid="dashboard-pane-board"]')).toHaveCount(1);
});

test("phone: the rail opens as a drawer and closes on pick", async ({ page, isMobile }) => {
  test.skip(!isMobile, "drawer behaviour is the phone layout");
  await openTab(page, "board");
  await page.getByRole("button", { name: /collapse or expand sidebar/i }).click();
  await expect(page.locator('[data-testid="sidebar-backdrop"]')).toHaveCount(1);
  await page.locator('aside nav a[href="/dashboard?tab=verify"]').click();
  await expect(page).toHaveURL(/tab=verify/);
  await expect(page.locator('[data-testid="sidebar-backdrop"]')).toHaveCount(0);
});
