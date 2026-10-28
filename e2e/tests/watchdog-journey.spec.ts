import { test, expect } from "@playwright/test";

/**
 * Public Watchdog journey (/watchdog). Pick a real claim → dated evidence and history → verify
 * (three separate results) → the stable link re-fetches the same record. Structure only, never a
 * number: totals are read from the committed register, and the static server has no /api/*, so
 * the corrections read must show UNCHECKABLE rather than an empty "no corrections".
 */
test.describe("watchdog journey", () => {
  test("pick a claim, verify it, and reopen it by its stable link", async ({ page }) => {
    await page.route(/hf\.space/, (r) => r.abort());
    await page.goto("/watchdog/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ask a question. Inspect the evidence.");
    await expect(page.getByTestId("watchdog-totals")).toContainText("subjects");

    await page.getByTestId("watchdog-journey").locator("details summary").first().click();
    await page.getByTestId("watchdog-claim-link").first().click();
    await expect(page).toHaveURL(/\/watchdog\/\?registry=[^&]+&claim=[^&]+/);
    const detail = page.getByTestId("watchdog-claim-detail");
    await expect(detail.getByTestId("watchdog-history").locator("li").first()).toContainText("20");

    // No /api/corrections on the static server: the failure is shown as UNCHECKABLE, with a time.
    await expect(detail.getByTestId("watchdog-uncheckable")).toContainText("UNCHECKABLE");

    await detail.getByTestId("watchdog-verify").click();
    const three = detail.getByTestId("watchdog-three-results");
    await expect(three.getByTestId("watchdog-result-signature")).toBeVisible();
    await expect(three.getByTestId("watchdog-result-inclusion")).toContainText("INCLUDED");
    await expect(three.getByTestId("watchdog-result-conclusion")).toBeVisible();

    const href = await detail.getByTestId("watchdog-stable-link").getAttribute("href");
    expect(href).toMatch(/^\/watchdog\/\?registry=/);
    const title = await detail.locator("h2").textContent();
    await page.goto(href!);
    await expect(page.getByTestId("watchdog-claim-detail").locator("h2")).toHaveText(title!);
    await page.getByTestId("watchdog-refetch").click();
    await expect(page.getByTestId("watchdog-claim-detail").locator("h2")).toHaveText(title!);
  });

  test("research library says indexed by NLM and marks deleted Zenodo records UNCHECKABLE", async ({ page }) => {
    await page.goto("/watchdog/?view=library");
    const lib = page.getByTestId("watchdog-library");
    await expect(lib).toContainText("indexed by NLM");
    await expect(lib).not.toContainText(/endorsed/i);
    await expect(page.getByTestId("watchdog-zenodo-note")).toContainText("UNCHECKABLE");
    await expect(page.locator("main")).toHaveCount(1);
  });
});
