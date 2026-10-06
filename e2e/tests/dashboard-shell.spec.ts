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

test("sidebar exposes eight plainly named sections as direct /dashboard?tab= links", async ({
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
    "/dashboard?tab=mine",
    "/dashboard?tab=verify",
    "/dashboard?tab=board",
    "/dashboard?tab=connect",
    "/dashboard?tab=learn",
    "/dashboard?tab=sovx",
    "/dashboard?tab=corrections",
  ]);
  for (const h of hrefs) expect(h).toMatch(/^\/dashboard\?tab=[a-z0-9-]+$/);
  // "Check a result" section contains two panes: Check a result and Evidence pack. Evidence index
  // moved to "For developers" (tools audit, 6 Oct 2026): it is an API coverage index, not a check.
  // The section bar (not the sidebar) shows sub-tabs when the active pane belongs to a multi-tab section.
  await openTab(page, "evidence");
  const sub = page.getByRole("navigation", { name: "Check a result pages" });
  await expect(sub.getByRole("link", { name: "Evidence pack", exact: true })).toHaveAttribute(
    "href",
    "/dashboard?tab=evidence",
  );
  await expect(sub.getByRole("link", { name: "Evidence index", exact: true })).toHaveCount(0);
  await openTab(page, "evidence-index");
  await expect(
    page
      .getByRole("navigation", { name: "For developers pages" })
      .getByRole("link", { name: "Evidence index", exact: true }),
  ).toHaveAttribute("href", "/dashboard?tab=evidence-index");
  await expect(page.getByRole("navigation", { name: "Council workspace modes" })).toHaveCount(0);
  // No door on the shell hops through the legacy /os redirect.
  const legacy = await page.locator('a[href^="/os?"]').count();
  expect(legacy, "no /os?lobby= hops inside the shell").toBe(0);
});

test("a question typed on Get results keeps its answer panel mounted (no self-abort)", async ({ page }) => {
  // Regression, 6 Oct 2026: askTalk recorded the question into the lobby chat first, which
  // swapped the home canvas for the thread view, unmounted the TalkPanel and aborted its
  // /api/agui/run request ~8 ms after sending it. The first question never got an answer.
  await openTab(page, "home");
  const aborted: string[] = [];
  page.on("requestfailed", (r) => {
    if (r.url().includes("/api/agui/run") && /ABORTED/i.test(r.failure()?.errorText || "")) aborted.push(r.url());
  });
  const box = page.getByRole("textbox", { name: "Ask the Council, or name a pane to open" });
  await expect(box).toBeVisible();
  await box.fill("What does the board say?");
  await box.press("Enter");
  // The run is shown inside the home TalkPanel, and the home canvas stays mounted.
  await expect(page.getByTestId("talk-run").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("gspc-workspace-home")).toBeVisible();
  await page.waitForTimeout(500);
  expect(aborted, "the TalkPanel run must not be aborted by its own page").toEqual([]);
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
    "mine",
    "learn",
    "play",
    "explore",
    "board",
    "swift",
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
      // Home is the GSPC workspace: Get results (one input), then Answers (the AG-UI talk panel) beside the live board.
      // The retired metrics page is gone (30 Sep 2026); its figures each have one place here.
      await expect(page.getByTestId("gspc-workspace-home"), "home: the GSPC workspace").toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Answers", exact: true }),
        "home: answers panel present",
      ).toBeVisible();
      await expect(page.getByTestId("ws-board")).toHaveCount(1);
      await expect(page.getByText("Account overview and recent measurements", { exact: true })).toHaveCount(0);
    } else {
      await expect(pane, `${id}: its own pane is mounted`).toHaveCount(1);
    }
  }
  expect(pageErrors, "no uncaught exceptions across the tabs").toEqual([]);
  expect(consoleErrors, "no console errors across the tabs").toEqual([]);
});

test("retired duplicate ids open the pane that owns their content (tools audit, 6 Oct 2026)", async ({
  page,
}) => {
  // ?tab=results rendered the board under a second name; ?tab=watchdog framed /watchdog-hub,
  // which 308s to /os, so the pane showed the start page nested inside itself.
  for (const [id, owner] of [
    ["results", "board"],
    ["watchdog", "corrections"],
  ] as const) {
    await openTab(page, id);
    await expectShell(page, id);
    await expect(page.locator(`[data-testid="dashboard-pane-${owner}"]`), `${id} -> ${owner}`).toHaveCount(1);
    await expect(page.locator('[data-testid="dashboard-pane-unknown"]')).toHaveCount(0);
    await expect(page.locator('iframe[src*="watchdog-hub"]')).toHaveCount(0);
  }
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
  // The pane links the payload twice on purpose: the header link and the summary tiles' as_of
  // source line (HomeGspcBoard.test.tsx pins both). #2794 turned the second into plain <code> to
  // satisfy an exact count of 1 here, which removed the source link beside the tiles' numbers.
  await expect(
    pane.locator('a[href="/api/gspc"]').first(),
    "the payload link",
  ).toBeAttached();
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
  await expectColdDoor(page, "/os?lobby=swift", "swift");
});

test("a fresh deep link lands on its section, not the page head", async ({ page }) => {
  // App.tsx ScrollToTop used to scroll to the top on every route mount, undoing the browser's own jump
  // to the fragment, so /how-we-work/#machine-surface (the home hero's link) opened at the page head.
  await page.goto("/how-we-work/#machine-surface");
  const section = page.locator("#machine-surface");
  await expect(section).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(async () => Math.abs((await section.boundingBox())?.y ?? 99_999), {
      message: "#machine-surface within 200px of the viewport top",
      timeout: 15_000,
    })
    .toBeLessThan(200);
});

test("a cold /gspc-scoreboard door converges on the canonical Dashboard", async ({
  page,
}) => {
  await expectColdDoor(page, "/gspc-scoreboard", "board");
});

test("one workspace keeps the composer and account access while a tool pane is open", async ({
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
  // With no conversation there is nothing for the side rail to hold, so it is not drawn.
  await expect(
    page.locator('aside[aria-label="Workspace, tasks and chat history"]'),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Open Council OS"),
    "no legacy overlay launcher over the shell",
  ).toHaveCount(0);
  if (isMobile) {
    await page.getByRole("button", { name: "Open workspace navigation" }).click();
    // The account menu is in the mobile drawer, not the hidden desktop sidebar.
    await expect(
      page.getByRole("dialog", { name: "Council OS sections" })
        .getByLabel("Open account and workspace menu"),
    ).toBeVisible();
  } else {
    await expect(
      page.getByLabel("Open account and workspace menu").first(),
    ).toBeVisible();
  }
});

test("the mobile consent notice has no floating launcher over it", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile overlap contract");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("region", { name: "Cookie consent" }),
  ).toBeVisible();
  // 27 Sep 2026: the floating "Open workspace" pill is gone; Council OS is in the one header.
  await expect(
    page.getByRole("link", { name: "Open the Council of AI workspace" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
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

test("a home question goes to the Answers panel, and History keeps it beside a tool", async ({
  page,
  isMobile,
}) => {
  await openTab(page, "home");
  const composer = page.getByLabel("Ask the Council, or name a pane to open");
  const question = "Can you make me certified?";

  await composer.fill(question);
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  // 6 Oct 2026 (#2834, tools audit). A home question used to swap the canvas to the chat log and
  // unmount the Answers panel mid-run, so POST /api/agui/run was aborted and the first question
  // never got an answer. The home TalkPanel now answers it and stays mounted (see the no-self-abort
  // test; this static server has no /api, so the run ends in its honest no-answer state). The
  // question is kept in session history and as an "Asked" entry in the workspace History, both
  // checked below.
  await expect(
    page.getByTestId("talk-run").filter({ hasText: question }).first(),
  ).toBeVisible();
  await expect(page.getByTestId("gspc-workspace-home")).toBeVisible();
  await expect(
    page.getByRole("log", { name: "Council of AI conversation" }),
  ).toHaveCount(0);
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
  // The Get results question was answered by the home TalkPanel and recorded in session
  // history as its own conversation; it stays reachable one click away under History.
  await rail.getByRole("button", { name: /^History/ }).click();
  await expect(rail.getByText(question, { exact: true }).first()).toBeVisible();
  // It is also in the workspace History, as asked.
  await rail.getByRole("tab", { name: "Workspace" }).click();
  await expect(
    rail.locator('[data-activity-kind="ask"]').getByText(question, { exact: true }),
  ).toBeVisible();
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

  // The page's board read (/api/gspc, falling back to the live councilof.ai read when
  // the static server answers with the SPA's HTML) settles AFTER the quest buttons are
  // clickable, and its callback repaints the grid. Until 2026-09-05 that callback was
  // home(), whose showRun(false) hid and emptied #run — a quest already in progress was
  // wiped and the player dumped back to the grid. In CI the desktop lane lost that race
  // twice in one morning (element(s) not found at :479 and :483 — a different assertion
  // each time, because the wipe landed at a different moment); mobile happened to win it,
  // and locally it failed 2 of 3. Hold the board read open until AFTER the click so the
  // race is deterministic here, then release it and require the run to survive.
  let releaseBoard: () => void = () => undefined;
  const boardHeld = new Promise<void>((resolve) => {
    releaseBoard = resolve;
  });
  await page.route(/\/api\/gspc(\?|$)/, async (route) => {
    await boardHeld;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ totals: {}, axes: [] }),
    });
  });

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

  // The quest buttons are painted before the page's script has finished defining
  // window.start; wait for the handler so the click cannot throw into the void.
  await page.waitForFunction(() => typeof (window as any).start === "function", null, {
    timeout: 15_000,
  });
  await expect(page.locator("#boardCount")).toHaveText(/reading \/api\/gspc/i);
  await page.locator("#grid .q").first().click();
  await expect(page.locator("#run .item")).toBeVisible({ timeout: 15_000 });

  // Now let the board read land while the quest is open. The cards repaint (the
  // count line leaves its "reading…" state); the run must still be there.
  releaseBoard();
  await expect(page.locator("#boardCount")).not.toHaveText(/reading \/api\/gspc/i, {
    timeout: 15_000,
  });
  await expect(
    page.locator("#run .item"),
    "a settled board read repaints the cards and never wipes a quest in progress",
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(
    page.locator("#run").getByText(/this is local play, not a measurement/i),
  ).toBeVisible();
  await expect(page.locator("#grid .q").first()).toBeHidden();
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
  // #2497 (15 Sep review, measured 390x844): below lg the 22-row chooser is replaced by a compact
  // selector so the selected lesson is the next thing in the viewport. Each width must show its own.
  if ((page.viewportSize()?.width ?? 1280) >= 1024) {
    await expect(pane.locator("[data-axis-learning]").first()).toBeVisible();
  } else {
    await expect(pane.getByTestId("learning-axis-select")).toBeVisible();
    await expect(pane.getByTestId("learning-axis-list")).toBeHidden();
  }
  await expect(pane.getByTestId("learning-progress")).toBeVisible();
  await expect(pane.getByTestId("learning-stage-learn")).toContainText(
    "AVAILABLE",
  );
  await expect(pane.getByTestId("learning-stage-play")).toContainText("LOCKED");

  await pane.getByRole("button", { name: "Complete Learn" }).click();
  await expect(pane.getByTestId("learning-stage-play")).toContainText(
    "AVAILABLE",
  );

  // #2497 (15 Sep review): coaching is secondary, behind the "Coaching (optional)" disclosure
  // beside the primary action. It must still be one step away and still work.
  const coaching = pane.getByTestId("learning-coaching");
  await coaching.locator("summary", { hasText: "Coaching (optional)" }).click();
  await expect(coaching).toHaveAttribute("open", "");
  await pane
    .getByRole("link", { name: "Ask Council to coach this stage" })
    .click();
  await expect(page.getByText(/Nothing sent yet/i)).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: /Ask the Council/i }),
  ).toHaveValue(
    /Coach me through the Governance GSPC learning path at the play stage/i,
  );
  // 6 Oct 2026 (tools-plain-cards): coaching opens on the Get results home, where the answer
  // renders as plain tool cards, instead of in the learning pane's raw-JSON lobby renderer.
  await expect(page).toHaveURL(/\/dashboard\/?\?ask=/);
  await expect(page).not.toHaveURL(/tab=learn/);
});
