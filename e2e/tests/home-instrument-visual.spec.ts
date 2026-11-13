import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const fixturePath = path.resolve(
  process.cwd(),
  "extensions/chrome-gspc-verify/fixtures/api-gspc.snapshot.json",
);
const boardFixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const sizes = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const size of sizes) {
  test(`home instrument visual integrity — ${size.name}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.route("**/api/gspc", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(boardFixture),
      });
    });

    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.getByTestId("home-verify")).toBeVisible();
    await expect(page.getByTestId("home-instrument-rail")).toBeVisible();
    await expect(page.getByTestId("supply-led-entry")).toBeVisible();
    await expect(page.getByTestId("home-btn-verify")).toBeVisible();
    await expect(page.getByTestId("carousel-toggle")).toBeVisible();

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);

    const workflowLinks = page.getByTestId("supply-led-entry").locator("a");
    await expect(workflowLinks).toHaveCount(4);

    const seriousConsoleErrors = consoleErrors.filter(
      (entry) =>
        !entry.includes("favicon") &&
        !entry.includes("Failed to load resource"),
    );
    expect(seriousConsoleErrors).toEqual([]);
  });
}
