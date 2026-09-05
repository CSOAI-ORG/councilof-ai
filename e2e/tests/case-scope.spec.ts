/**
 * case-scope.spec.ts — the WP-3 intake, walked on a phone, and the link it hands you.
 *
 * WP-3 asks the product to "ask for role, subject/version, jurisdiction, purpose and consent".
 * Nothing did. The blocked half of the case model waits on a remediation runtime another lane
 * owns; scoping never did, and this walks it end to end at 390x844.
 *
 * THE LINK IS THE POINT, and it is the part that was wrong first. The commission door originally
 * pointed at `/dashboard?tab=request`, which renders "No tool is named 'request'" — the pane map
 * keys that surface under `measured`. Caught by loading it rather than by reading the tab list,
 * which is the second time in this lane a plausible tab id turned out to be an alias for
 * something else.
 *
 * The prefill cannot be proven against the local static server: there is no /api/*, so the tool
 * list never loads and no field renders — an absence that would read as "the subject is dropped".
 * PROD_CASE_SCOPE=1 checks it where the API answers. Measured 2026-09-05 on production:
 * ?subject=acme-llm fills the `subject` input, and without it that input is empty.
 */
import { test, expect } from "@playwright/test";

const FILL = {
  subject: "acme-llm",
  version: "1.4.0",
  jurisdiction: "EU",
  purpose: "procurement",
};

test("scope a case on a phone, and get a link that lands", async ({ page }) => {
  await page.goto("/dashboard?tab=fabric", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const scope = page.getByTestId("case-scope");
  await expect(scope, "the intake did not render in the fabric pane").toBeVisible();
  await expect(page.getByTestId("scope-state")).toContainText(/Not scoped yet/i);

  for (const [k, v] of Object.entries(FILL)) await page.getByTestId(`scope-${k}`).fill(v);
  await page.getByTestId("scope-role").selectOption("provider");
  await page.getByTestId("scope-consent-measure").check();
  await page.waitForTimeout(400);

  // Complete, and still explicit that nothing left the browser.
  const state = await page.getByTestId("scope-state").innerText();
  expect(state).toMatch(/Scope complete/i);
  expect(state, "the completed state stopped saying nothing was sent").toMatch(/Nothing has been sent/i);

  // Learning participation must not be required, and must not tick itself.
  expect(await page.getByTestId("scope-consent-learning").isChecked()).toBe(false);

  const href = await page.locator('a:has-text("Commission a card")').getAttribute("href");
  expect(href, "the commission door lost the subject").toContain("subject=acme-llm");
  expect(
    href,
    'the commission door points at tab=request, which renders "No tool is named \'request\'". ' +
      "The pane map keys that surface under `measured`.",
  ).toContain("tab=measured");

  await page.screenshot({
    path: new URL("../../operator/handoffs/2026-09-05/mobile-7-case-scope.jpg", import.meta.url).pathname,
    quality: 80,
    type: "jpeg",
  });

  const { sw, cw } = await page.evaluate(() => {
    const e = document.scrollingElement!;
    return { sw: e.scrollWidth, cw: e.clientWidth };
  });
  expect(sw, `the intake scrolls sideways on a phone: ${sw}px in ${cw}px`).toBeLessThanOrEqual(cw + 2);
});

test("the scope survives a reload and still says nothing was sent", async ({ page }) => {
  await page.goto("/dashboard?tab=fabric", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.getByTestId("scope-subject").fill("acme-llm");
  await page.waitForTimeout(400);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  expect(await page.getByTestId("scope-subject").inputValue()).toBe("acme-llm");
  // Persistence must never read as submission.
  await expect(page.getByTestId("scope-state")).toContainText(/Nothing is sent|Nothing has been sent/i);
});

test("the commission link is a real tab, not an alias that renders nothing", async ({ page }) => {
  await page.goto("/dashboard?tab=measured&subject=acme-llm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  const body = await page.locator("body").innerText();
  expect(body, "tab=measured renders the unknown-workspace state").not.toContain("No tool is named");
  expect(body).toMatch(/Request attestation/i);
});

test("prod: the subject actually reaches the request tool", async ({ page }) => {
  if (!process.env.PROD_CASE_SCOPE) {
    test.skip(true, "PROD_CASE_SCOPE unset — the local static server has no /api, so the tool list never loads");
    return;
  }
  // The input carries NO `name` attribute — it is `id="mcp-commission_card-subject"`. A first
  // pass read `name || placeholder`, matched the placeholder "subject", and reported a pass for
  // a mechanism it had not actually located. Assert the id.
  const SUBJECT = "#mcp-commission_card-subject";
  const read = async (url: string) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    return page.locator(SUBJECT).inputValue();
  };

  expect(
    await read("https://councilof.ai/dashboard?tab=measured&subject=acme-llm"),
    "the subject in the URL did not reach the request tool",
  ).toBe("acme-llm");

  expect(
    await read("https://councilof.ai/dashboard?tab=measured"),
    "the subject field is filled with no subject in the URL — the prefill is not reading the query",
  ).toBe("");
});
