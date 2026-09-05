import { chromium, expect } from "@playwright/test";

const origin = process.env.PREVIEW_ORIGIN || "http://127.0.0.1:51026";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname)) {
  throw new Error("Run against a local preview; this test never submits a paid or model job.");
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    const posts = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
      if (request.method() === "POST") posts.push(new URL(request.url()).pathname);
    });
    await page.goto(origin);
    const essential = page.getByRole("button", { name: "Essential only", exact: true });
    if (await essential.isVisible()) await essential.click();
    await expect(page.getByRole("button", { name: "Next slide", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The signed record lives on the Hub" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Printers of the live board" })).toHaveCount(0);
    const showcase = page.locator("#coliseum");
    await showcase.scrollIntoViewIfNeeded();
    await expect(showcase.getByText("In development", { exact: true })).toHaveCount(2);
    for (const img of await showcase.locator("img").all()) {
      await img.evaluate(node => node.decode());
      expect(await img.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: `/tmp/council-coliseum-${width}.png` });
    await showcase.getByTestId("home-play-boss-chair").click();
    await expect(page).toHaveURL(/tab=play&game=boss-chair/);
    const game = page.getByTestId("boss-chair-practice");
    await expect(game).toBeVisible();
    await expect(game.getByRole("button", { name: "Next scenario" })).toBeDisabled();
    // Shell discovery may POST /mcp. Practice must not send model/payment/mutation calls.
    const decisions = ["Resolve within bounds", "Resolve within bounds", "Escalate for human approval", "Resolve within bounds", "Escalate for human approval", "Resolve within bounds", "Escalate for human approval", "Resolve within bounds"];
    for (const [index, answer] of decisions.entries()) {
      await expect(game.getByText(`Scenario ${index + 1} of 8`, { exact: true })).toBeVisible();
      await game.getByRole("button", { name: answer, exact: false }).click();
      if (index === 0) await expect(game.getByRole("alert")).toContainText("Not quite.");
      await game.getByRole("button", { name: index === 7 ? "See practice result" : "Next scenario", exact: true }).click();
    }
    await expect(game.getByRole("heading")).toContainText("7 of 8");
    await game.getByRole("button", { name: "Retry all scenarios" }).click();
    await expect(game.getByText("Scenario 1 of 8", { exact: true })).toBeVisible();

    await page.goto(`${origin}/dashboard?tab=explore`);
    const roles = page.getByRole("tablist", { name: "Choose your role" });
    await expect(roles.getByRole("tab")).toHaveCount(7);
    for (const role of ["Enterprises", "Model builders", "Insurers", "Regulators", "Bonds & ledgers", "COBOL & legacy", "Everyone"]) {
      await roles.getByRole("tab", { name: role, exact: true }).click();
      const panel = page.getByRole("tabpanel", { name: role, exact: true });
      await expect(panel.locator("ol a")).toHaveCount(3);
      for (const link of await panel.locator("ol a").all()) {
        expect(await link.getAttribute("href")).toMatch(/^\/dashboard\?tab=/);
      }
      await expect(panel).toContainText("You review it before sending");
    }
    await roles.getByRole("tab", { name: "Everyone", exact: true }).press("Home");
    await expect(roles.getByRole("tab", { name: "Enterprises", exact: true })).toBeFocused();
    await page.getByRole("tabpanel", { name: "Enterprises", exact: true }).getByRole("link", { name: "Start with the Council" }).click();
    await expect(page.getByRole("textbox", { name: "Ask the Council, or name a pane to open" })).toHaveValue(/Help me scope the evidence/);
    expect(posts.filter(path => path !== "/mcp")).toEqual([]);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    console.log(`PASS ${width}px: original hero, removed directories, artwork, home → game, 8 rounds/error/retry, 7 role tabs, keyboard navigation, unsent prompt; no model/payment POST or overflow`);
    await context.close();
  }
} finally {
  await browser.close();
}
