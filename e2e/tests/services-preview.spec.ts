import { expect, test } from "@playwright/test";

test("RWA preview asks for an asset and preserves the free-preview route", async ({ page }) => {
  await page.route("**/.well-known/x402.json", route => route.fulfill({
    json: { mode: "test", resources: [{
      method: "GET",
      url: "https://councilof.ai/api/rwa/evidence?asset=<symbol>",
      free_preview: "https://councilof.ai/api/rwa/evidence?asset=<symbol>&preview=1",
      note: "Fixture RWA evidence",
    }] },
  }));
  await page.goto("/services/");
  const input = page.getByLabel("Asset symbol or XRPL address");
  await expect(input).toBeVisible();
  const preview = page.getByRole("link", { name: "Free preview →" });
  await expect(preview).toHaveCount(0);
  await input.fill("RLUSD");
  await expect(preview).toHaveAttribute("href", "https://councilof.ai/api/rwa/evidence?asset=RLUSD&preview=1");
  await input.fill("");
  await expect(preview).toHaveCount(0);
});
