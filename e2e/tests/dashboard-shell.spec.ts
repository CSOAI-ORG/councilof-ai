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
const LEGACY_PANE_IDS = [
  "cards",
  "evidence",
  "embed",
  "matrix",
  "play",
  "state",
  "leaderboard",
  "terminal",
  "ras",
  "archive",
];

/** Tabs visible in the sidebar (per LOBBY_TABS in client/src/components/lobby/tabs.ts). */
const IGNORED_CONSOLE = [
  /Failed to load resource/, // /api/* does not exist on the static server
  /net::ERR_/,
  /blocked by CORS policy/, // production-origin reader under the local static harness
  /status of (401|403|404|5\d\d)/,
  /hf\.space/,
  /favicon/,
];

async function collectErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e?.message ?? e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED_CONSOLE.some((r) => r.test(m.text())))
      consoleErrors.push(m.text());
  });
  return { pageErrors, consoleErrors };
}

/** Open /dashboard?tab=<id> and wait for the SPA shell to mount. */
async function openTab(page: Page, id: string, trailingSlash = false) {
  await page.goto(`/dashboard${trailingSlash ? "/" : ""}?tab=${id}`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .locator('[data-testid="dashboard-shell"]')
    .waitFor({ state: "visible", timeout: 60_000 });
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => undefined);
  await page.waitForTimeout(400);
}

async function expectColdDoor(page: Page, path: string, tab: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForURL(new RegExp(`/dashboard/?\\?.*tab=${tab}`), {
    timeout: 15_000,
  });
  await page
    .locator('[data-testid="dashboard-shell"]')
    .waitFor({ state: "visible", timeout: 60_000 });
  await expect(
    page.locator(`[data-testid="dashboard-pane-${tab}"]`),
  ).toHaveCount(1);
}

/** Assertions that hold for EVERY mounted pane (per DashboardLayout.tsx). */
async function expectShell(page: Page, id: string) {
  await expect(
    page.locator('[data-testid="dashboard-shell"]'),
    `${id}: canonical shell present`,
  ).toHaveCount(1);
  await expect(
    page.locator("main"),
    `${id}: exactly one main landmark`,
  ).toHaveCount(1);
  await expect(
    page
      .getByRole("region", { name: new RegExp("workspace canvas$", "i") })
      .first(),
    `${id}: labelled canvas`,
  ).toBeVisible();
  // No horizontal overflow at the document level.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${id}: no horizontal overflow`).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ context }) => {
  // Block third-party frames so a defect in someone else's script cannot fail our shell.
  await context.route(/hf\.space/, (r) => r.abort());
});

test("sidebar exposes the ten primary user jobs as direct /dashboard?tab= links", async ({
  page,
}) => {
  await openTab(page, "board");
  const navigation = page.getByRole("navigation", {
    name: "Workspace destinations",
  });
  if (!(await navigation.isVisible().catch(() => false)))
    await page
      .getByRole("button", { name: "Open workspace navigation" })
      .click();
  await expect(navigation).toBeVisible();
  const hrefs = await navigation
    .locator('a[href^="/dashboard?tab="]')
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual([
    "/dashboard?tab=home",
    "/dashboard?tab=measured",
    "/dashboard?tab=verify",
    "/dashboard?tab=board",
    "/dashboard?tab=evidence",
    "/dashboard?tab=tools",
    "/dashboard?tab=learn",
    "/dashboard?tab=watchdog",
    "/dashboard?tab=standards",
    "/dashboard?tab=fabric",
  ]);
  for (const h of hrefs) expect(h).toMatch(/^\/dashboard\?tab=[a-z0-9-]+$/);
  await expect(
    page.getByRole("link", { name: "All tools", exact: true }),
  ).toHaveAttribute("href", "/dashboard?tab=explore");
  // No door on the shell hops through the legacy /os redirect.
  const legacy = await page.locator('a[href^="/os?"]').count();
  expect(legacy, "no /os?lobby= hops inside the shell").toBe(0);
});

test("the canonical dashboard accepts its optional trailing slash", async ({
  page,
}) => {
  for (const trailingSlash of [false, true]) {
    await openTab(page, "verify", trailingSlash);
    await expect(page).toHaveURL(/\/dashboard\/?\?tab=verify/);
    await expect(
      page.locator('[data-testid="dashboard-pane-verify"]'),
    ).toHaveCount(1);
  }
});

test("every sidebar tab renders its own pane inside the shell, error-free", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(240_000);
  await openTab(page, "board");
  const { pageErrors, consoleErrors } = await collectErrors(page);
  // Loop through the known-good set of tab ids. We don't enumerate the
  // sidebar links here because the sidebar also carries legacy aliases
  // and auth-required routes that do NOT render in the shell (the
  // rail sends workbench to /login when signed out, but on a static
  // server there is no auth backend, so the test would hang).
  const ids = [
    "home",
    "learn",
    "play",
    "explore",
    "board",
    "results",
    "models",
    "measured",
    "verify",
    "cards",
    "attestations",
    "evidence",
    "standards",
    "matrix",
    "art50",
    "fabric",
    "tools",
    "harness",
    "space",
    "products",
    "library",
  ];
  expect(ids).toContain("board");
  for (const id of ids) {
    await openTab(page, id);
    await expectShell(page, id);
    const pane = page.locator(`[data-testid="dashboard-pane-${id}"]`);
    if (id === "home") {
      // Home is the conversational operating surface. The former metrics dashboard
      // remains available below it in the Account overview disclosure.
      await expect(
        page.getByRole("heading", {
          name: "What should the Council help you do?",
          exact: true,
        }),
        "home: conversation first",
      ).toBeVisible();
      await expect(
        page.getByText("Account overview and recent measurements", {
          exact: true,
        }),
      ).toHaveCount(1);
    } else {
      await expect(pane, `${id}: its own pane is mounted`).toHaveCount(1);
    }
  }
  expect(pageErrors, "no uncaught exceptions across the tabs").toEqual([]);
  expect(consoleErrors, "no console errors across the tabs").toEqual([]);
});

test("legacy door ids resolve to a real pane, never the fallback", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const { pageErrors } = await collectErrors(page);
  for (const id of LEGACY_PANE_IDS) {
    await openTab(page, id);
    await expectShell(page, id);
    const known = page.locator(
      '[data-testid^="dashboard-pane-"][data-pane-known="yes"]',
    );
    await expect(known, `${id}: resolves to a registered pane`).toHaveCount(1);
  }
  expect(pageErrors).toEqual([]);
});

test("an unknown tab id fails explicitly and never substitutes another pane", async ({
  page,
}) => {
  await openTab(page, "no-such-pane");
  await expectShell(page, "no-such-pane");
  await expect(
    page.locator('[data-testid="dashboard-pane-unknown"]'),
  ).toContainText("No tool is named");
  await expect(
    page.locator('[data-testid="dashboard-pane-board"]'),
  ).toHaveCount(0);
});

test("the board pane quotes GET /api/gspc and embeds the living Space — nothing typed", async ({
  page,
}) => {
  await openTab(page, "board");
  const pane = page.locator('[data-testid="dashboard-pane-board"]');
  await expect(pane).toHaveCount(1);
  await expect(
    pane.locator('a[href="/api/gspc"]'),
    "the payload link",
  ).toHaveCount(1);
  // Master's HomeGspcBoard (post #1158) is a self-contained 22-axis strip rendered from
  // /api/gspc; the iframe to csoai-gspc-board.static.hf.space was removed 2026-09-02 because
  // the Space had sunset to 302s. The assertion is now: there is NO iframe dependency,
  // there IS a self-contained axis strip from the live payload (the card grid — see
  // "Every axis, from GET /api/gspc"), and there are zero typed axis counts (every
  // figure is quoted from GET /api/gspc verbatim — see "nothing typed" in the title).
  await expect(
    pane.locator('iframe[src*=".hf.space"]'),
    "no iframe dependency",
  ).toHaveCount(0);
  // The strip renders one card per axis; 9 by default + a "Load more" button
  // for the rest (STRIP_N = 9 per client/src/components/home/HomeGspcBoard.tsx).
  // On a live /api/gspc the strip mounts 9 cards; on a static server the empty-state
  // message is the honest answer. Both prove the pane is wired correctly.
  await expect(
    pane
      .locator("[data-axis-row]")
      .first()
      .or(pane.getByText("Board is unreachable", { exact: false })),
    "axis data mounted (live) or honest empty-state",
  ).toBeVisible();
});

test("a cold /os door converges on the canonical Dashboard", async ({
  page,
}) => {
  await expectColdDoor(page, "/os?lobby=verify", "verify");
});

test("a cold /gspc-scoreboard door converges on the canonical Dashboard", async ({
  page,
}) => {
  await expectColdDoor(page, "/gspc-scoreboard", "board");
});

test("one workspace keeps the composer and workspace rail access while a tool pane is open", async ({
  page,
  isMobile,
}) => {
  await openTab(page, "board");
  await expect(page.locator('[data-testid="dashboard-workspace"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('[data-testid="dashboard-pane-board"]'),
  ).toHaveCount(1);
  await expect(
    page.getByLabel("Ask the Council, or name a pane to open"),
  ).toHaveCount(1);
  if (isMobile) {
    const railButton = page.getByRole("button", {
      name: "Open workspaces, tasks and chat history",
    });
    await expect(railButton).toBeVisible();
    await railButton.click();
    await expect(
      page.locator(
        'aside[aria-label="Workspace, tasks and chat history"]:visible',
      ),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.locator(
        'aside[aria-label="Workspace, tasks and chat history"]:visible',
      ),
    ).toHaveCount(0);
  } else {
    await expect(
      page.locator('aside[aria-label="Workspace, tasks and chat history"]'),
    ).toHaveCount(1);
  }
  await expect(
    page.getByLabel("Open Council OS"),
    "no legacy overlay launcher over the shell",
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Open account and workspace menu").first(),
  ).toBeVisible();
});

test("the mobile consent notice preserves the public Workspace door", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile overlap contract");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("region", { name: "Cookie consent" }),
  ).toBeVisible();
  const launcher = page.getByRole("link", {
    name: "Open the Council of AI workspace",
  });
  await expect(launcher).toBeVisible();
  await launcher.click();
  await page.waitForURL(/\/dashboard\/?\?tab=home/, { timeout: 15_000 });
  await expect(page.locator('[data-testid="dashboard-shell"]')).toBeVisible();
});

test("a top-level embed hint normalizes to the canonical workspace", async ({
  page,
}) => {
  await page.goto("/dashboard?embed=1&tab=products", {
    waitUntil: "domcontentloaded",
  });
  await page
    .locator('[data-testid="dashboard-workspace"]')
    .waitFor({ state: "visible", timeout: 60_000 });

  await expect(page.locator('[data-testid="dashboard-workspace"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('[data-testid="dashboard-pane-products"]'),
  ).toHaveCount(1);
  await expect(
    page.getByLabel("Ask the Council, or name a pane to open"),
  ).toHaveCount(1);
  await expect(page).toHaveURL(/\/dashboard\/?\?tab=products/);
  expect(new URL(page.url()).searchParams.has("embed")).toBe(false);
  await expect(
    page.locator('[data-testid="dashboard-shell"]'),
    "dashboard is an unframeable top-level workspace",
  ).toHaveCount(1);
  await expect(
    page.getByLabel("Open Council OS"),
    "retired overlay launcher is never mounted",
  ).toHaveCount(0);
});

test("chat remains beside a tool and its session history stays reachable", async ({
  page,
  isMobile,
}) => {
  await openTab(page, "home");
  const composer = page.getByLabel("Ask the Council, or name a pane to open");
  const question = "Can you make me certified?";

  await composer.fill(question);
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(
    page
      .getByRole("log", { name: "Council of AI conversation" })
      .getByText(question, { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/tab=home/);
  await expect(
    page.locator('[data-testid="dashboard-pane-space"]'),
  ).toHaveCount(0);

  const ask = page.getByRole("button", { name: "Ask", exact: true });
  await composer.fill("Open Council Space");
  await expect(ask).toBeEnabled();
  await ask.click();
  await expect(page).toHaveURL(/tab=space/);
  await expect(
    page.locator('[data-testid="dashboard-pane-space"]'),
  ).toHaveCount(1);

  if (isMobile) {
    await page
      .getByRole("button", {
        name: "Open workspaces, tasks and chat history",
      })
      .click();
  }
  const rail = page.locator(
    'aside[aria-label="Workspace, tasks and chat history"]:visible',
  );
  await expect(rail).toBeVisible();
  await rail.getByRole("tab", { name: /^Chats/ }).click();
  await expect(rail.getByTestId("dashboard-chat-rail")).toBeVisible();
  await expect(rail.getByText(question, { exact: true })).toBeVisible();
  await rail.getByRole("button", { name: /^History/ }).click();
  await expect(rail.getByText(question, { exact: true })).toBeVisible();
});

test("GSPC quests are a styled in-workspace game and never promote play into measurement", async ({
  page,
}) => {
  await openTab(page, "play");
  const playPane = page.locator('[data-testid="dashboard-pane-play"]');
  await expect(
    playPane.getByRole("heading", {
      name: "GSPC Quests — play frozen challenge banks",
    }),
  ).toBeVisible();
  await expect(playPane.getByText(/currently admitted ranking/i)).toBeVisible();
  await expect(playPane.getByText(/models are measured on/i)).toHaveCount(0);

  await page.goto("/gspc-quests.html?embed=1", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: /GSPC QUESTS/i }),
  ).toContainText("independent reproduction and admission");
  await expect(page.locator("#grid .q").first()).toBeVisible();
  await expect(
    page.getByText(/candidate still is not a measurement/i),
  ).toBeVisible();
  const tabRadius = await page
    .locator(".tab")
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderRadius),
    );
  expect(tabRadius).toBeGreaterThan(0);

  await page.locator("#grid .q").first().click();
  await expect(page.locator("#run .item")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(
    page.locator("#run").getByText(/this is local play, not a measurement/i),
  ).toBeVisible();
});

test("the 22-axis learning arena keeps coaching, practice and human review in one workspace", async ({
  page,
}) => {
  await openTab(page, "learn");
  const pane = page.locator('[data-testid="dashboard-pane-learn"]');
  await expect(
    pane.getByRole("heading", {
      name: /Learn the problem\. Play it\. Explain it\. Fix it/i,
    }),
  ).toBeVisible();
  await expect(pane.locator("[data-axis-learning]").first()).toBeVisible();
  await expect(pane.getByTestId("learning-progress")).toBeVisible();
  await expect(pane.getByTestId("learning-stage-learn")).toContainText(
    "AVAILABLE",
  );
  await expect(pane.getByTestId("learning-stage-play")).toContainText("LOCKED");

  await pane.getByRole("button", { name: "Complete Learn" }).click();
  await expect(pane.getByTestId("learning-stage-play")).toContainText(
    "AVAILABLE",
  );

  await pane
    .getByRole("link", { name: "Ask Council to coach this stage" })
    .click();
  await expect(page.getByText(/Nothing sent yet/i)).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: /Ask the Council/i }),
  ).toHaveValue(
    /Coach me through the Governance GSPC learning path at the play stage/i,
  );
  await expect(page.getByText(/PRACTICE_ONLY · UNMEASURED/i)).toBeVisible();
});
