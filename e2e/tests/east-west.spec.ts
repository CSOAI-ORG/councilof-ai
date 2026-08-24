import { test, expect, type Page } from "@playwright/test";

async function dismissCookie(page: Page) {
  const essential = page.getByRole("button", { name: /Essential only/i });
  if (await essential.isVisible().catch(() => false)) await essential.click();
}

test.describe("East-West — flagship + grammar", () => {
  test("flagship renders pitch, grammar, empty ledger, and doctrine banner", async ({ page }) => {
    await page.goto("/east-west");
    await dismissCookie(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One signed measurement");
    await expect(page.getByText("13 measured of 14").first()).toBeVisible();
    await expect(page.getByText(/determination stays with authorities/i).first()).toBeVisible();
    await expect(page.getByText(/0 published rows/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Verify the card/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Evidence packs/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Pay rail — OWNER-BLOCKED/i })).toBeVisible();
    await expect(page.getByText(/Jail is UNMEASURED/i).first()).toBeVisible();
    await expect(page.getByText(/Signature: UNSIGNED/i).first()).toBeVisible();
  });

  test("in-page nav reaches verify", async ({ page }) => {
    await page.goto("/east-west");
    await dismissCookie(page);
    await page.getByRole("navigation", { name: "East-West" }).getByRole("link", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/east-west\/verify/);
    await expect(page.getByLabel("Measurement card JSON")).toBeVisible();
  });
});

test.describe("East-West — verify fail-closed", () => {
  test("frozen card verifies VALID then tamper fails closed", async ({ page }) => {
    await page.goto("/east-west/verify");
    await dismissCookie(page);
    const box = page.getByLabel("Measurement card JSON");
    await expect(box).toBeVisible();
    await expect.poll(async () => (await box.inputValue()).length).toBeGreaterThan(40);
    await page.getByRole("button", { name: /Verify locally/i }).click();
    await expect(page.getByText("VALID")).toBeVisible();
    const raw = await box.inputValue();
    const tampered = raw.replace("13 measured of 14", "14 measured of 14");
    expect(tampered).not.toEqual(raw);
    await box.fill(tampered);
    await page.getByRole("button", { name: /Verify locally/i }).click();
    await expect(page.getByText(/INVALID/i)).toBeVisible();
  });
});

test.describe("East-West — challenge door", () => {
  test("measured-subject redress mints a RECEIVED receipt", async ({ page }) => {
    await page.goto("/challenge");
    await dismissCookie(page);
    await expect(page.getByText(/Measured-subject redress/i)).toBeVisible();
    await page.getByLabel("Challenge text").fill("Cell eu-art9 mapping is wrong.");
    await page.getByRole("button", { name: /Submit challenge/i }).click();
    await expect(page.getByText(/RECEIVED/i)).toBeVisible();
  });
});

test.describe("East-West — packs, desks, ledger", () => {
  test("three pack formats and not-a-determination banner", async ({ page }) => {
    await page.goto("/east-west/packs");
    await dismissCookie(page);
    await expect(page.getByRole("heading", { name: /Multinational evidence pack/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Insurer evidence pack/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Law-firm exhibit pack/i })).toBeVisible();
    await expect(page.getByText(/Not a compliance determination/i).first()).toBeVisible();
    await expect(page.getByText(/Not a certification/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Download sample JSON/i }).first()).toBeVisible();
  });

  test("regulator desks are free forever", async ({ page }) => {
    await page.goto("/east-west/desks");
    await dismissCookie(page);
    await expect(page.getByText(/free forever/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /EU desk/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /UK desk/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Illinois desk/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /China desk/i })).toBeVisible();
    await page.getByRole("link", { name: "Open desk" }).first().click();
    await expect(page).toHaveURL(/\/east-west\/desks\/eu/);
    await expect(page.getByText(/EU desk/i).first()).toBeVisible();
  });

  test("US honesty desk does not invent a federal statute", async ({ page }) => {
    await page.goto("/east-west/desks/us");
    await dismissCookie(page);
    await expect(page.getByText(/No federal US AI-measurement statute/i)).toBeVisible();
    await expect(page.getByText(/sufficiency:\s*OPEN/i)).toBeVisible();
    await expect(page.getByText(/Texas TRAIGA/i).first()).toBeVisible();
  });

  test("ledger published count is 0", async ({ page }) => {
    await page.goto("/east-west/ledger");
    await dismissCookie(page);
    await expect(page.getByText(/Published rows:\s*0/i)).toBeVisible();
  });
});

test.describe("East-West — revenue-ready honesty", () => {
  test("buyer screen + commerce firewall", async ({ page }) => {
    await page.goto("/east-west/buyers");
    await dismissCookie(page);
    await expect(page.getByText("Who is the buyer?")).toBeVisible();
    await expect(page.getByText(/Regulators are never billed/i)).toBeVisible();
    await expect(page.getByText(/Scores and rankings are never sold/i).first()).toBeVisible();
    await expect(page.getByText(/Published count is 0/i).first()).toBeVisible();
  });

  test("license is a template, not executable", async ({ page }) => {
    await page.goto("/east-west/license");
    await dismissCookie(page);
    await expect(page.getByText(/OWNER-BLOCKED/i).first()).toBeVisible();
    await expect(page.getByText(/template only/i).first()).toBeVisible();
    await expect(page.getByText(/trust root never white-labels/i).first()).toBeVisible();
    await expect(page.getByText(/Sell scores, rankings, or certifications/i)).toBeVisible();
  });

  test("one-pagers are samples, not sent outreach", async ({ page }) => {
    await page.goto("/east-west/briefs");
    await dismissCookie(page);
    await expect(page.getByText(/not as sent outreach/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Multinational counsel/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Insurer underwriter/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Law-firm partner/i })).toBeVisible();
    await expect(page.getByText(/Verify any of it without asking us/i).first()).toBeVisible();
  });

  test("pay rail invents no amount", async ({ page }) => {
    await page.goto("/east-west/pay");
    await dismissCookie(page);
    await expect(page.getByText(/OWNER-BLOCKED/i).first()).toBeVisible();
    await expect(page.getByText(/No amount is invented/i)).toBeVisible();
    await expect(page.getByText(/not live/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /GET \/api\/east-west\/pay\/demo/i })).toBeVisible();
  });

  test("pricing ruling unpublished — scores £0 forever", async ({ page }) => {
    await page.goto("/east-west/pricing");
    await dismissCookie(page);
    await expect(page.getByText(/OWNER-BLOCKED/i).first()).toBeVisible();
    await expect(page.getByText(/£0 forever/i).first()).toBeVisible();
    await expect(page.getByText(/pricing pending a published ruling/i)).toBeVisible();
  });
});

test.describe("East-West — method, not, press, crosswalk", () => {
  test("method names source tiers and forbids silent edits", async ({ page }) => {
    await page.goto("/east-west/method");
    await dismissCookie(page);
    await expect(page.getByText(/named provision or published principle/i)).toBeVisible();
    await expect(page.getByText(/Silent edits are forbidden/i)).toBeVisible();
    await expect(page.getByText(/never certified/i).first()).toBeVisible();
  });

  test("what this is not refuses certification and score sales", async ({ page }) => {
    await page.goto("/east-west/not");
    await dismissCookie(page);
    await expect(page.getByText(/Not a certification/i).first()).toBeVisible();
    await expect(page.getByText(/Scores are never sold/i)).toBeVisible();
  });

  test("press drafts are unsent", async ({ page }) => {
    await page.goto("/east-west/press");
    await dismissCookie(page);
    await expect(page.getByText(/draft/i).first()).toBeVisible();
    await expect(page.getByText(/First cross-border measurement card/i)).toBeVisible();
  });

  test("crosswalk tables include four regimes", async ({ page }) => {
    await page.goto("/east-west/crosswalk");
    await dismissCookie(page);
    await expect(page.getByRole("heading", { name: /EU AI Act/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^UK$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Illinois SB 315/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /China GB\/T/i })).toBeVisible();
    await expect(page.getByText(/mapped/i).first()).toBeVisible();
  });
});
