/**
 * contrast-aa.spec.ts — the panes this lane added are legible on the ground they render on.
 *
 * FOUND BY LOOKING AT THE EVIDENCE, 2026-09-05. `HubResultsPane` was written in a fixed dark
 * palette — text-emerald-100, text-emerald-100/70, text-rose-300, bg-black/20 — and it renders
 * on `bg-background`, which is rgb(250,250,247). Measured on an iPhone 13 viewport:
 *
 *   "The published Hub results could not be read."   1.83:1   (AA needs 4.5:1)
 *   "GET /api/hub-cards did not answer: ..."         1.07:1   (AA needs 4.5:1)
 *
 * 1.07:1 is text you cannot see. It was on the ERROR path, which is the one WP-5 explicitly
 * names, and the whole pane had the same disease.
 *
 * WORSE: the desktop screenshot already shipped in this lane's handoff
 * (hub-results-unmeasured-withheld.jpg) SHOWS the pane washed out — heading, provenance and the
 * honesty block all pale-on-pale. It was handed over as evidence because the content was read
 * out of the DOM and never looked at. Every other pane measured clean, so this was one
 * component's mistake, not the theme's.
 *
 * A first attempt at measuring this reported 19.95:1 and 8.33:1 and would have closed the case.
 * getComputedStyle returns `oklch()`/`oklab()` here, and parsing those three numbers as sRGB
 * produces a confident, meaningless ratio. Colours are normalised through a canvas below for
 * that reason — a contrast check that cannot read the colour is worse than none.
 *
 *   npx playwright test --config e2e/playwright.mobile.config.ts
 */
import { test, expect } from "@playwright/test";

/** Enough shape to render the data path; the static server has no /api/* at all. */
const HUB_FIXTURE = {
  population: "third-party models on the Hub — NOT the CSOAI fleet",
  source: "huggingface.co/datasets/csoai/gspc-hub-cards",
  as_of: "2026-09-05T05:14:04.920Z",
  schema: "csoai.hub-cards/0.1",
  honesty: {
    a: "Each row's status is exactly as published. This endpoint never upgrades a cell.",
    b: "These cells are not the 22-axis board. The board is GET /api/gspc.",
  },
  counts: { cells: 699, measured: 629, unmeasured: 70 },
  cells: [
    { model: "Qwen/Qwen2.5-Coder-32B-Instruct", axis: "safety", status: "UNMEASURED", unmeasured: ["signed-pending-verify"], accuracy: 0.61, n: 30, card_sha256: "05e3f2c82a6f0000", card_url: "https://example.invalid/c1" },
    { model: "meta-llama/Llama-3.1-8B-Instruct", axis: "safety", status: "MEASURED", accuracy: 0.7412, n: 30, card_sha256: "169ac11b14d90000", card_url: "https://example.invalid/c2" },
  ],
};

const MEASURE = `(() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  // Canvas normalises any CSS colour — including oklch()/oklab() — to real sRGB bytes.
  const toRGBA = (css) => { ctx.clearRect(0,0,1,1); ctx.fillStyle = "#000"; ctx.fillStyle = css; ctx.clearRect(0,0,1,1); ctx.fillRect(0,0,1,1); const d = ctx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2],d[3]/255]; };
  const lum = (c) => { const f = c.slice(0,3).map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2]; };
  const bgOf = (el) => { let e = el; while (e) { const b = toRGBA(getComputedStyle(e).backgroundColor); if (b[3] > 0.5) return b; e = e.parentElement; } return [255,255,255,1]; };
  const fails = []; let checked = 0;
  for (const el of document.querySelectorAll("p, span, dd, dt, h2, h3, li, td, th, a, caption")) {
    const text = (el.textContent || "").trim();
    if (!text || el.children.length) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    checked++;
    const s = getComputedStyle(el);
    const fg = toRGBA(s.color), bg = bgOf(el);
    const eff = [0,1,2].map(i => fg[i]*fg[3] + bg[i]*(1-fg[3]));
    const L1 = lum(eff), L2 = lum(bg);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px = parseFloat(s.fontSize), bold = parseInt(s.fontWeight,10) >= 700;
    const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) fails.push(text.slice(0,48) + " -> " + (Math.round(ratio*100)/100) + ":1 (needs " + need + ":1, " + s.fontSize + ")");
  }
  return { checked, fails };
})()`;

test("results pane, data path: every string meets WCAG AA on its own background", async ({ page }) => {
  await page.route("**/api/hub-cards*", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(HUB_FIXTURE) }),
  );
  await page.goto("/dashboard?tab=results", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const body = await page.locator("body").innerText();
  expect(body, "the data path did not render — the fixture or the route pattern is wrong, and " +
    "a contrast check over an empty pane passes without checking anything").toContain("Published Hub results");
  expect(body).toContain("not a measurement");

  // Handed over as evidence, because the previous screenshot of this pane was illegible and
  // nobody could tell from the DOM dump that accompanied it.
  await page.screenshot({
    path: new URL("../../operator/handoffs/2026-09-05/mobile-6-results-readable.jpg", import.meta.url).pathname,
    quality: 80,
    type: "jpeg",
  });

  const { checked, fails } = (await page.evaluate(MEASURE)) as { checked: number; fails: string[] };
  expect(checked, `only ${checked} text nodes measured — the walk is matching nothing`).toBeGreaterThan(20);
  expect(fails, `text below WCAG AA in the results pane:\n  ${fails.join("\n  ")}`).toEqual([]);
});

test("results pane, error path: the failure message is readable", async ({ page }) => {
  // The path WP-5 names. It renders its own bare container, so it inherits nothing that would
  // rescue a wrong colour — and it is the state a user is in when they most need to read.
  await page.route("**/api/hub-cards*", (r) => r.fulfill({ status: 500, body: "boom" }));
  await page.goto("/dashboard?tab=results", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const body = await page.locator("body").innerText();
  expect(body).toContain("could not be read");

  const { fails } = (await page.evaluate(MEASURE)) as { checked: number; fails: string[] };
  expect(fails, `the error state is unreadable:\n  ${fails.join("\n  ")}`).toEqual([]);
});

/**
 * Desktop, at the width the original handoff screenshot was taken. That image
 * (hub-results-unmeasured-withheld.jpg) shows the pane washed out and was handed over as
 * evidence anyway. Regenerated here so the handoff carries a legible one, and asserted so it
 * cannot go back.
 */
test.describe("desktop", () => {
  // Only the fixture options that may be overridden per-describe; spreading a whole
  // device descriptor here fails, because defaultBrowserType is config-level.
  test.use({ viewport: { width: 1400, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  test("results pane is legible at desktop width too", async ({ page }) => {
    await page.route("**/api/hub-cards*", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(HUB_FIXTURE) }),
    );
    await page.goto("/dashboard?tab=results", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const body = await page.locator("body").innerText();
    expect(body).toContain("Published Hub results");

    await page.screenshot({
      path: new URL("../../operator/handoffs/2026-09-05/desktop-results-readable.jpg", import.meta.url).pathname,
      quality: 80,
      type: "jpeg",
    });

    const { checked, fails } = (await page.evaluate(MEASURE)) as { checked: number; fails: string[] };
    expect(checked).toBeGreaterThan(20);
    expect(fails, `text below WCAG AA at desktop width:\n  ${fails.join("\n  ")}`).toEqual([]);
  });
});
