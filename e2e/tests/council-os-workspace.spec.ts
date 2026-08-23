import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";

const gspcFixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../fixtures/gspc-board.json"), "utf8"),
);

/**
 * Council OS — OpenRouter-style workspace e2e.
 *
 * Master header → Council OS dock → board / models / routes / tools → AG-UI chat.
 * Run: npm run test:council-os
 */

const ERR_RE =
  /is not defined|is not a function|Cannot read properties of|Unexpected token|Failed to fetch dynamically imported module/;

async function assertNoCriticalErrors(page: Page) {
  const errors: string[] = (page as any).__coaiErrors ?? [];
  const critical = errors.filter((e) => ERR_RE.test(e));
  expect(critical).toEqual([]);
}

async function dismissCookieBanner(page: Page) {
  const essential = page.getByRole("button", { name: "Essential only" });
  if (await essential.isVisible().catch(() => false)) {
    await essential.click();
  }
}

async function mockCouncilApis(page: Page) {
  await page.route("**/api/gspc", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(gspcFixture),
    });
  });

  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON() as { messages?: { content?: string }[] };
    const question = String(body?.messages?.at(-1)?.content ?? "");
    const answer =
      /gspc|axis|board/i.test(question)
        ? "The GSPC board publishes governance, safety, and provenance axes on GET /api/gspc — measured figures only."
        : "Grounded reply for e2e.";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer,
        reply: answer,
        signature: "grounded in published measurement · deterministic · recomputable",
        state: "grounded",
        model: "e2e-fixture",
      }),
    });
  });
}

async function openCouncilOs(page: Page) {
  await expect(page.getByRole("button", { name: "Open Council OS" }).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Open Council OS" }).first().click();
  await expect(page.locator('[data-coai="Council Lobby"]')).toBeVisible({ timeout: 15_000 });
}

test.describe("Council OS workspace", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    (page as any).__coaiErrors = errors;
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await mockCouncilApis(page);
  });

  test("master header exposes workspace groups", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await expect(page.getByRole("button", { name: "Workspace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agents" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Council OS" }).first()).toBeVisible();
    await assertNoCriticalErrors(page);
  });

  test("footer carries full site map", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await page.locator("#footer-site-map-heading").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Explore the site" })).toBeVisible();
    await expect(page.getByText("Regulation", { exact: true }).first()).toBeVisible();
    await assertNoCriticalErrors(page);
  });

  test("master side menu groups expand and open ecosystem pane", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await openCouncilOs(page);

    const menu = page.getByRole("navigation", { name: "Council OS master menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Master menu")).toBeVisible();
    await expect(menu.getByText("Measurement", { exact: true })).toBeVisible();

    await menu.getByRole("tab", { name: "Hive index" }).click();
    await expect(page.getByText("Ecosystem index")).toBeVisible({ timeout: 10_000 });

    await menu.getByRole("tab", { name: "MCP tools" }).click();
    await expect(page.getByText("Eunomia MCP spine")).toBeVisible({ timeout: 10_000 });

    await assertNoCriticalErrors(page);
  });

  test("opens Council OS dock and switches measurement panes", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await openCouncilOs(page);
    await expect(page.getByText("Council OS", { exact: true }).first()).toBeVisible();

    await page.getByRole("tab", { name: "Models" }).click();
    await expect(page.getByRole("columnheader", { name: "Model" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Routes" }).click();
    await expect(page.getByText(/Eunomia|routing/i).first()).toBeVisible();

    await page.getByRole("tab", { name: "MCP tools" }).click();
    await expect(page.getByText("Eunomia MCP spine")).toBeVisible();

    await assertNoCriticalErrors(page);
  });

  test("composer seeds from Try without auto-send", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await openCouncilOs(page);
    await page.getByRole("tab", { name: "Models" }).click();
    await page.getByRole("button", { name: "Try" }).first().click({ timeout: 15_000 });
    await expect(page.getByText("Nothing sent yet")).toBeVisible();
    const box = page.getByLabel("Ask the Council, or name a pane to open");
    await expect(box).not.toHaveValue("");
    await assertNoCriticalErrors(page);
  });

  test("grounded chat lane answers board question", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await openCouncilOs(page);
    const dock = page.locator('[data-coai="Council Lobby"]');
    const box = dock.getByLabel("Ask the Council, or name a pane to open");
    await box.fill("What axes are on GET /api/gspc?");
    await dock.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(page.locator('[aria-live="polite"]').last()).toContainText(/gspc|axis|board|measure/i, {
      timeout: 20_000,
    });
    await assertNoCriticalErrors(page);
  });

  test("measurement hub page loads", async ({ page }) => {
    await page.goto("/dashboard/measurement", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await expect(page.getByRole("heading", { name: /Measurement hub/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Models" })).toBeVisible();
    await assertNoCriticalErrors(page);
  });

  test("agent runbook and AG-UI bridge load", async ({ page }) => {
    for (const route of ["/agent-runbook", "/ag-ui", "/instruments"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await dismissCookieBanner(page);
      await page.waitForTimeout(500);
      await assertNoCriticalErrors(page);
    }
  });
});
