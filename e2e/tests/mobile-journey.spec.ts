/**
 * mobile-journey.spec.ts — the Council OS shell on a real phone viewport.
 *
 * WP-5 asks for responsive layouts, accessible keyboard controls and recoverable loading/error
 * states. Every screenshot in this lane's handoff was taken at desktop width, so "responsive"
 * was an untested word in a document. The Chrome automation available here pins its viewport at
 * 1152 CSS px and will not go narrower, so a mobile screenshot could not be taken that way at
 * all — Playwright's device emulation is the only honest route, and it is already a dependency.
 *
 * THE ASSERTION THAT MATTERS is horizontal overflow. A three-column shell (job nav · canvas ·
 * workspaces) that does not collapse produces a page the user must scroll sideways to read,
 * which is the single most common way a desktop-designed shell fails on a phone — and it is
 * invisible at desktop width, so nothing else in this repo would catch it.
 *
 * Runs against a BUILT dist/client. No /api/* functions exist on the static server, so every
 * pane is exercised in its honest no-data state and nothing here asserts a number.
 *
 *   npm run build:client && npx playwright test --config e2e/playwright.mobile.config.ts
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHOTS = path.join(ROOT, "operator/handoffs/2026-09-05");

/** The journey a phone user actually walks, in order. */
const STEPS = [
  { name: "home", url: "/", shot: "mobile-1-home.jpg" },
  { name: "shell", url: "/dashboard", shot: "mobile-2-shell.jpg" },
  { name: "board", url: "/dashboard?tab=board", shot: "mobile-3-board.jpg" },
  { name: "results", url: "/dashboard?tab=results", shot: "mobile-4-results.jpg" },
  { name: "fabric", url: "/dashboard?tab=fabric", shot: "mobile-5-fabric.jpg" },
];

/** Page-level sideways scroll. A wide table inside its own overflow container is fine. */
async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });
}

for (const step of STEPS) {
  test(`mobile journey — ${step.name} fits the viewport and renders`, async ({ page }) => {
    await page.goto(step.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);

    const text = (await page.locator("body").innerText()).trim();
    expect(text.length, `${step.name} rendered no visible text`).toBeGreaterThan(80);

    await page.screenshot({ path: path.join(SHOTS, step.shot), quality: 80, type: "jpeg" });

    const { scrollWidth, clientWidth } = await horizontalOverflow(page);
    expect(
      scrollWidth,
      `${step.name} (${step.url}) scrolls sideways on a phone: content is ${scrollWidth}px in a ` +
        `${clientWidth}px viewport. A shell that does not collapse its columns makes the user ` +
        `drag the page horizontally to read it, and that is invisible at desktop width.`,
    ).toBeLessThanOrEqual(clientWidth + 2);
  });
}

test("mobile journey — the floating Workspace button does not sit on top of the content", async ({
  page,
}) => {
  // FOUND BY THIS SPEC, 2026-09-05. The Workspace toggle is `absolute right-3 top-3 ... xl:hidden`,
  // so below xl it floats over the canvas. The no-pane branch allowed for it with `mt-12 xl:mt-0`;
  // the activePane branch did not, and it landed on real text on three of four tabs:
  //
  //   /dashboard?tab=board     H2 "GSPC board"                              2994px2
  //   /dashboard?tab=results   P  "The published Hub results could not..."  2078px2
  //   /dashboard?tab=fabric    P  "Council of AI · governed capability..."  2590px2
  //
  // Invisible at desktop width, because at xl the button is hidden and the rail is docked.
  const OVERLAP_LIMIT = 200; // px^2 — anti-aliasing and rounded corners, not a covered word
  const offenders: string[] = [];

  for (const url of ["/dashboard", "/dashboard?tab=board", "/dashboard?tab=results", "/dashboard?tab=fabric"]) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const hits = await page.evaluate((limit) => {
      const btn = [...document.querySelectorAll("button,a")].find((b) =>
        /workspace/i.test(b.textContent || ""),
      );
      if (!btn) return [];
      const br = btn.getBoundingClientRect();
      const out: string[] = [];
      for (const el of document.querySelectorAll("h1,h2,h3,p,span")) {
        const text = (el.textContent || "").trim();
        if (!text || text.length > 90 || el.contains(btn)) continue;
        const er = el.getBoundingClientRect();
        if (er.width === 0 || er.height === 0) continue;
        const area =
          Math.max(0, Math.min(br.right, er.right) - Math.max(br.left, er.left)) *
          Math.max(0, Math.min(br.bottom, er.bottom) - Math.max(br.top, er.top));
        if (area > limit) out.push(`${el.tagName} "${text.slice(0, 50)}" ${Math.round(area)}px2`);
      }
      return out;
    }, OVERLAP_LIMIT);
    for (const h of hits) offenders.push(`${url}: ${h}`);
  }

  expect(
    offenders,
    `the Workspace button is covering page text on a phone:\n  ${offenders.join("\n  ")}\n` +
      `Either give the pane room for it (the activePane container carries pt-14 xl:pt-0 for ` +
      `exactly this) or move the control into the header row.`,
  ).toEqual([]);
});

test("mobile journey — the keyboard reaches a control and focus is visible", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    return {
      tag: el.tagName,
      outline: s.outlineStyle !== "none" && parseFloat(s.outlineWidth || "0") > 0,
      ring: s.boxShadow !== "none",
    };
  });
  expect(focused, "Tab from the shell reached nothing focusable — the page is unusable by keyboard").not.toBeNull();
  expect(
    focused!.outline || focused!.ring,
    `the first keyboard-focused element (${focused!.tag}) shows no outline and no focus ring. ` +
      `A focusable control with no visible focus state is reachable and invisible, which is ` +
      `worse than not being reachable.`,
  ).toBe(true);
});

test("mobile journey — a blocked stage names its endpoint rather than offering a button", async ({ page }) => {
  await page.goto("/dashboard?tab=fabric", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const text = await page.locator("body").innerText();
  // The case model's blocked half must stay described, never offered. Same rule as the desktop
  // guard, checked here because a phone layout is where a stage most easily loses its label and
  // keeps its affordance.
  expect(text).toMatch(/\/api\/(ras|remediation|receipts|jobs)/);
});
