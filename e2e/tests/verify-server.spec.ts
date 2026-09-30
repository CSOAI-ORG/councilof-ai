/**
 * /verify-server on the BUILT, prerendered site (not the dev server): at a 390 px phone and a 1440 px
 * desktop viewport. Run against a local `wrangler pages dev dist/client` before a deploy:
 *
 *   BASE_URL=http://127.0.0.1:8799 SHOTS_DIR=/tmp/shots \
 *     npx playwright test -c e2e/playwright.config.ts e2e/tests/verify-server.spec.ts --project=chromium --reporter=list
 *
 * What it holds: the doctrine line and the /census link are on the page; an unknown URL answers
 * NOT_MEASURED (never "clean"); host case and a trailing slash normalise to one endpoint; a published
 * capsule re-derives to PASS in the browser; the same capsule with one field changed in the shard
 * FAILs; keyboard-only use works; nothing scrolls sideways at 390 px.
 */
import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SHOTS = process.env.SHOTS_DIR || "test-results/verify-server";
mkdirSync(SHOTS, { recursive: true });
const OWN_DOOR = "https://councilof.ai/mcp";

for (const [w, h] of [[390, 844], [1440, 900]] as const) {
  test.describe(`/verify-server at ${w}px`, () => {
    test.use({ viewport: { width: w, height: h } });
    test.setTimeout(240_000);

    test("doctrine, form, unknown → NOT_MEASURED by keyboard, no sideways scroll", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto("/verify-server/", { waitUntil: "networkidle" });
      await expect(page.getByTestId("doctrine")).toContainText("Measurement, not endorsement");
      await expect(page.locator('a[href="/census"]').first()).toBeVisible();
      await expect(page.getByText(/Reference \/ archive/i)).toHaveCount(0);
      await expect(page).toHaveTitle(/^Verify a server/);
      await page.screenshot({ path: `${SHOTS}/verify-server-${w}-empty.png`, fullPage: true });

      await page.getByLabel("Endpoint URL").focus();
      await page.keyboard.type("https://never-measured.example/mcp");
      await page.keyboard.press("Enter");
      const ev = page.getByTestId("evidence");
      await expect(ev).toHaveAttribute("data-state", "NOT_MEASURED");
      await expect(ev).toContainText("not a finding about the server");
      await expect(ev).not.toContainText(/\bclean\b(?! or unclean)/i); // "clean or unclean" is the disclaimer, not a finding
      expect(await page.evaluate(() => document.activeElement?.id)).toBe("results-heading");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${SHOTS}/verify-server-${w}-not-measured.png`, fullPage: true });
      expect(errors).toEqual([]);
    });

    test("known endpoint: normalised, capsules render, a published capsule verifies PASS", async ({ page }) => {
      await page.goto("/verify-server/", { waitUntil: "networkidle" });
      await page.getByLabel("Endpoint URL").fill("HTTPS://COUNCILOF.AI/mcp/");
      await page.getByRole("button", { name: "Look up" }).click();
      const ev = page.getByTestId("evidence");
      await expect(ev).toHaveAttribute("data-state", "MEASURED");
      await expect(ev).toContainText(OWN_DOOR);
      expect(await page.getByTestId("capsule").count()).toBeGreaterThan(0);
      await page.getByTestId("verify-capsule").first().click();
      await expect(page.getByTestId("verify-result").first()).toHaveAttribute("data-outcome", "PASS", { timeout: 120_000 });
      await page.getByTestId("capsule").first().locator("summary", { hasText: "Declared vs observed" }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${SHOTS}/verify-server-${w}-measured-pass.png`, fullPage: true });
    });

    test("a tampered capsule in the shard → the verify button reports FAIL", async ({ page }) => {
      await page.route("**/measurement-capsules/v0.2/endpoints/*.json", async (route) => {
        const r = await route.fetch();
        const j = (await r.json()) as { endpoints: Record<string, { endpoint: string; capsules: Array<{ capsule_json?: string }> }> };
        for (const ent of Object.values(j.endpoints))
          if (ent.endpoint === OWN_DOOR)
            for (const c of ent.capsules)
              c.capsule_json = c.capsule_json?.replace(/"measurement_state":"[A-Z_]+"/, '"measurement_state":"INCONSISTENT"');
        await route.fulfill({ response: r, body: JSON.stringify(j) });
      });
      await page.goto(`/verify-server/?url=${encodeURIComponent(OWN_DOOR)}`, { waitUntil: "networkidle" });
      await page.getByTestId("verify-capsule").first().click();
      await expect(page.getByTestId("verify-result").first()).toHaveAttribute("data-outcome", "FAIL", { timeout: 120_000 });
      await page.screenshot({ path: `${SHOTS}/verify-server-${w}-tampered-fail.png` });
    });
  });
}
