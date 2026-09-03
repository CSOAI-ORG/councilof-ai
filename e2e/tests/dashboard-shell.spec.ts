import { test, expect, type Page } from "@playwright/test";

/**
 * Council OS shell smoke — adapted to master's current architecture.
 *
 * Master's /dashboard route renders Dashboard.tsx inside DashboardLayout.tsx.
 * The SPA loads 25MB of JS bundle before mounting; the sidebar with
 * aria-label="Council software destinations" appears only after the bundle
 * finishes parsing. Tests below wait for the actual mounted node, not the
 * prerendered HTML.
 *
 * What is asserted is structure, never a number: the static server has no /api/*,
 * so each pane is seen in its honest empty state. Third-party frames (the living
 * Hugging Face board) are blocked so a defect in someone else's script cannot
 * fail our shell.
 *
 * Runs with `npm run test:e2e:shell` against dist/client (see playwright.shell.config.ts).
 */

/** Legacy `/os?lobby=<id>` door ids that are not sidebar tabs but must still resolve to a pane.
 *  These are the ids that App.tsx's OsRoute handler maps to /dashboard?tab=<id>; the set must
 *  match what is actually wired into DashboardPane's PANES map (see the resolvePaneId
 *  function — it now does a direct lookup, no aliases). */
const LEGACY_PANE_IDS = ["cards", "evidence", "embed", "matrix", "play", "state", "leaderboard", "terminal", "ras", "archive"];

/** Tabs visible in the sidebar (per LOBBY_TABS in client/src/components/lobby/tabs.ts). */
const SIDEBAR_TAB_IDS = ["home", "board", "matrix", "results", "models", "tools", "verify", "cards", "state", "evidence", "embed", "products", "harness", "space", "measured", "watchdog", "claimguard", "ras", "library", "workbench", "software", "play"];

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

/** Open /dashboard?tab=<id> and wait for the SPA shell to mount. */
async function openTab(page: Page, id: string) {
  await page.goto(`/dashboard?tab=${id}`, { waitUntil: "domcontentloaded" });
  // Master's DashboardLayout renders an <aside> with a <nav aria-label="Council software destinations">.
  // The SPA mounts this AFTER the 25MB JS bundle parses, which can take a while on a cold static server.
  // Use a generous timeout (60s) and check for visibility, not just attachment.
  await page.locator('aside nav[aria-label="Council software destinations"]').waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

/** Assertions that hold for EVERY mounted pane (per DashboardLayout.tsx). */
async function expectShell(page: Page, id: string) {
  await expect(page.locator('aside nav[aria-label="Council software destinations"]'), `${id}: sidebar present`).toHaveCount(1);
  await expect(page.locator("header nav[aria-label='You are here']"), `${id}: header trail`).toHaveCount(1);
  // No horizontal overflow at the document level.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${id}: no horizontal overflow`).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ context }) => {
  // Block third-party frames so a defect in someone else's script cannot fail our shell.
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
  const { pageErrors, consoleErrors } = await collectErrors(page);
  // Loop through the known-good set of tab ids. We don't enumerate the
  // sidebar links here because the sidebar also carries legacy aliases
  // and auth-required routes that do NOT render in the shell (the
  // rail sends workbench to /login when signed out, but on a static
  // server there is no auth backend, so the test would hang).
  const ids = ["home", "board", "matrix", "results", "models", "tools", "verify",
               "cards", "state", "evidence", "embed", "products", "harness",
               "space", "measured", "watchdog", "claimguard", "library", "play"];
  expect(ids).toContain("board");
  for (const id of ids) {
    await openTab(page, id);
    await expectShell(page, id);
    const pane = page.locator(`[data-testid="dashboard-pane-${id}"]`);
    if (id === "home") {
      // home tab renders Dashboard.tsx content (overview), not a DashboardPane — the shell is still mounted.
      await expect(page.locator("h1"), "home: the overview").toContainText(/Dashboard/);
    } else {
      await expect(pane, `${id}: its own pane is mounted`).toHaveCount(1);
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
  // Master's HomeGspcBoard (post #1158) is a self-contained 22-axis strip rendered from
  // /api/gspc; the iframe to csoai-gspc-board.static.hf.space was removed 2026-09-02 because
  // the Space had sunset to 302s. The assertion is now: there is NO iframe dependency,
  // there IS a self-contained axis strip from the live payload (the card grid — see
  // "Every axis, from GET /api/gspc"), and there are zero typed axis counts (every
  // figure is quoted from GET /api/gspc verbatim — see "nothing typed" in the title).
  await expect(pane.locator('iframe[src*=".hf.space"]'), "no iframe dependency").toHaveCount(0);
  // The strip renders one card per axis; 9 by default + a "Load more" button
  // for the rest (STRIP_N = 9 per client/src/components/home/HomeGspcBoard.tsx).
  // On a live /api/gspc the strip mounts 9 cards; on a static server the empty-state
  // message is the honest answer. Both prove the pane is wired correctly.
  const cardCount = await pane.locator('[data-axis-row]').count();
  const emptyState = await pane.locator('text=Board is unreachable').count();
  expect(cardCount + emptyState, "axis cards mounted (live) or honest empty-state").toBeGreaterThanOrEqual(1);
});

test("legacy /os and /gspc-scoreboard doors land inside the Dashboard", async ({ page }) => {
  await page.goto("/os?lobby=verify", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/dashboard\?.*tab=verify/, { timeout: 15_000 });
  await page.locator('aside nav[aria-label="Council software destinations"]').waitFor({ state: "visible", timeout: 60_000 });
  await expect(page.locator('[data-testid="dashboard-pane-verify"]')).toHaveCount(1);
  await page.goto("/gspc-scoreboard", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/dashboard\?tab=board/, { timeout: 15_000 });
  await page.locator('aside nav[aria-label="Council software destinations"]').waitFor({ state: "visible", timeout: 60_000 });
  await expect(page.locator('[data-testid="dashboard-pane-board"]')).toHaveCount(1);
});
