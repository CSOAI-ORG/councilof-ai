import { expect, test } from "@playwright/test";

test("switching from a linked card to another published card drops the old source label", async ({ page }) => {
  await page.route("**/signed/cards/linked-source-fixture.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"id":"linked-source-fixture"}' }),
  );
  await page.route("**/signed/chain.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ links: [{ id: "other-source-fixture", card_url: "/signed/cards/other-source-fixture.json", body_published: true }] }),
    }),
  );
  await page.route("**/signed/cards/other-source-fixture.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"id":"other-source-fixture"}' }),
  );

  await page.goto("/gspc-verify/?card=%2Fsigned%2Fcards%2Flinked-source-fixture.json");
  await expect(page.getByTestId("linked-card")).toHaveAttribute("data-state", "loaded");
  await expect(page.getByTestId("linked-card")).toContainText("linked-source-fixture.json");
  await expect(page.getByLabel("Record JSON")).toHaveValue(/linked-source-fixture/);

  await page.getByTestId("try-published-card").click();
  await expect(page.getByLabel("Record JSON")).toHaveValue(/other-source-fixture/);
  await expect(page.getByTestId("linked-card")).toHaveCount(0);

  await page.getByLabel("Record JSON").fill('{"id":"reader-edited-fixture"}');
  await expect(page.getByTestId("linked-card")).toHaveCount(0);
});

test("editing a linked card removes its source label before the next check", async ({ page }) => {
  await page.route("**/signed/cards/linked-source-fixture.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"id":"linked-source-fixture"}' }),
  );
  await page.goto("/gspc-verify/?card=%2Fsigned%2Fcards%2Flinked-source-fixture.json");
  await expect(page.getByTestId("linked-card")).toHaveAttribute("data-state", "loaded");

  await page.getByLabel("Record JSON").fill('{"id":"reader-edited-fixture"}');
  await expect(page.getByTestId("linked-card")).toHaveCount(0);
  await expect(page.getByText("Input changed. This text has not been checked.")).toBeVisible();
});
