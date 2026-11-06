// sov-stack-e2e — end-to-end sweep of the unified agentic Sovereign stack (globe + sims + hive).
// Captures console errors, verifies the 3D globe signals ready, exercises real interactions,
// and checks the cross-surface handoffs. Run: E2E_BASE=https://csoai.org node scripts/sov-stack-e2e.mjs
import { createRequire } from "module";
import { installGlobeDriveSpy, readGlobeDriveCommands, waitForGlobeDriveReady } from "./sov-stack-globe-spy.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
// RETARGETED 2026-08-26. The default pointed at a host this repo does not deploy, so a
// local run measured somebody else's site (or, for the Vercel default, a host that has
// been 402-dead since July). This repo deploys the Cloudflare Pages project `councilof-ai`
// at https://councilof.ai, and nothing else. A test aimed elsewhere is not a weaker test —
// it is a test of a different system, reporting on this one.
const BASE = process.env.E2E_BASE || "https://councilof.ai";

const b = await chromium.launch();
const results = [];
// Filters that are NOT our problem. Pages 200, route renders; the warning is
// from a third-party asset (Cesium CDN, Cloudflare WAF rejecting a font/icon
// fetch from a CI runner IP) that does not affect the test's signal.
const NOISE = [
  /Failed to load resource.*403/i,
  /the server responded with a status of 403/i,
  /font-size:0;color:transparent NaN/i, // Cesium canvas font probe
];
function isNoise(text) { return NOISE.some((re) => re.test(text)); }

async function page() {
  const p = await b.newPage();
  const errs = [];
  p.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text().slice(0, 100);
    if (isNoise(t)) return;
    errs.push(t);
  });
  p.on("pageerror", (e) => {
    const t = "PAGEERR:" + String(e.message).slice(0, 90);
    if (isNoise(t)) return;
    errs.push(t);
  });
  return { p, errs };
}
function ok(name, cond, note = "") { results.push({ name, pass: !!cond, note }); }
// Resilient nav: survive transient network blips (ERR_NETWORK_CHANGED etc) with a retry.
// /globe loads heavy Cesium assets from a CDN and never reaches networkidle in the CI
// runner, so we wait for the canvas / iframe element to attach instead.
async function go(p, url) {
  for (let i = 0; i < 3; i++) {
    try {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      // Wait for either the 3D canvas (globe is top-level) or the globe iframe
      // (globe is embedded). Either is the correct "ready" signal.
      await p
        .waitForSelector('canvas, iframe[src*="globe3d"]', { timeout: 30000 })
        .catch(() => null);
      return true;
    } catch (e) { if (i === 2) throw e; await p.waitForTimeout(1500); }
  }
}

// SPA hydration wait: csoai.org is a client-rendered SPA. The route HTML
// (11262 bytes shell) loads immediately, but route content paints after
// the JS bundle hydrates. Wait for body text to grow past the shell.
// Without this, every content check races the bundle and fails.
async function waitForHydration(p, minChars = 800, timeoutMs = 15000) {
  await p
    .waitForFunction(
      (n) => document.body && (document.body.innerText || "").length >= n,
      minChars,
      { timeout: timeoutMs },
    )
    .catch(() => null);
}

// Click the observed action once. The caller waits for application readiness;
// native locator actionability alone cannot prove that React handlers exist.
async function clickWhenActionable(p, selector, timeoutMs = 30000) {
  // Locator.click waits for actionability; failure must reach the assertion.
  // Never report a successful interaction after swallowing a click error.
  await p.locator(selector).first().click({ timeout: timeoutMs });
}

// 1) /globe — 3D globe, mode toggle, agentic ask, threat
{
  const { p, errs } = await page();
  await go(p, BASE + "/globe");
  let ready = false; p.on("console", () => {});
  await p.waitForTimeout(2500);
  // Releases have served both a top-level globe and an embedded globe with a
  // 2D/3D toggle. Check the current surface instead of asserting an old layout.
  const has3d = (await p.$$("canvas")).length > 0 || (await p.$('iframe[src*="globe3d"]')) !== null;
  ok("/globe 3d renders", !!has3d, `url=${p.url()}`);
  ok(
    "/globe shows live anchor data",
    await p.evaluate(() => /FROZEN PROVISIONS|ANCHOR NODES|MCP SERVERS/i.test(document.body.innerText)),
  );
  // SPA hydration wait: route content paints after the bundle hydrates
  await waitForHydration(p);
  // type an agentic ask — be defensive: not all /globe builds expose a fillable input
  try {
    const input = await p.$('input[placeholder*="watchdog"], input[placeholder*="London"], input[placeholder*="ask"], input[type="text"], input:not([type])');
    if (input) {
      const visible = await input.isVisible().catch(() => false);
      if (visible) {
        const errorsBefore = errs.length;
        await input.fill("show the frameworks in Japan");
        await p.keyboard.press("Enter");
        await p.waitForTimeout(1500);
        ok("/globe ask no-crash", errs.length === errorsBefore, "real input interaction");
      } else {
        console.log("~ /globe ask no-crash — SKIPPED: input present but not visible");
      }
    } else {
      console.log("~ /globe ask no-crash — SKIPPED: no ask input on this /globe build");
      // Only a real interaction earns a pass. The unconditional ok(true) that used to sit
      // here asserted nothing and counted toward the green total — a fake pass is worse than
      // a skip, because it makes the number look like evidence when it is not.
    }
  } catch (e) {
    ok("/globe ask no-crash", false, "input fill failed: " + String(e.message).slice(0, 80));
  }
  // toggle to 2D → SVG should appear
  // When the current route has a 2D toggle, exercise it. Otherwise keep the
  // unexercised interaction out of the passing assertion count.
  const toggle = await p.$('button:has-text("2D classic"), button:has-text("3D globe")');
  if (toggle) {
    await toggle.click();
    await p.waitForTimeout(600);
    ok("/globe 2D svg", (await p.$("svg")) != null);
  } else {
    console.log("~ /globe 2D svg — SKIPPED: 2D-classic toggle not present on this route");
  }
  ok("/globe console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 2) /intel — WITHDRAWN 6 Oct 2026. It was an internal sales-target board (named organisations
// scored as "gaps"); internal material is never listed publicly. scripts/generate-redirects.mjs
// 308s /intel and /intel/ to the home page. What is checkable now is the withdrawal itself: the
// old URL must land on the home page, never on the board.
{
  const { p, errs } = await page();
  await go(p, BASE + "/intel");
  await waitForHydration(p);
  const url = new URL(p.url());
  ok("/intel withdrawn (lands on /)", url.pathname === "/", `url=${p.url()}`);
  ok("/intel board gone", !(await p.evaluate(() => /Tour the top gaps|Distribution Hive/i.test(document.body.innerText))));
  ok("/intel console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 3) /simulate — SURFACE RETIRED. The narrated simulator (greeting, ?q= prefill, "Sovereign
// Globe" link, "Run experiment") no longer exists as a route: public/_redirects 308s
// /simulate → /gspc-arena, and App.tsx then gates /gspc-arena (and /simulate) behind
// <DashboardDoor defaultTab="space" />, which lands on /dashboard?tab=space — verified live
// 2026-09-10: https://councilof.ai/simulate?q=… ends at /dashboard?q=…&tab=space with no
// textarea, no globe iframe and no Run experiment button (CouncilSpace is dead code behind
// that door). The old assertions therefore measured a retired surface and could only fail.
// What remains honestly checkable: the retired door must lead somewhere real — the Council
// OS dashboard space tab — not a 404, a shell, or a dead redirect. The drive-command
// capability the two /simulate spy blocks used to assert here moved to /brief (block 8),
// which was withdrawn on 6 Oct 2026; see block 8 for where that coverage stands now.
{
  const { p, errs } = await page();
  await go(p, BASE + "/simulate?q=a%20hiring%20AI%20in%20Germany");
  await waitForHydration(p);
  const url = p.url();
  ok("/simulate redirect contract", /\/dashboard\/?\?/.test(url) && /tab=space/.test(url), `url=${url}`);
  ok("/simulate landing renders", await p.evaluate(() => (document.body.innerText || "").length >= 800));
  ok("/simulate console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 4) /brief — WITHDRAWN 6 Oct 2026. It was the per-account sales brief /intel linked to (a
// named organisation, its "play" and the pitch to lead with): internal sales material, never
// listed publicly. scripts/generate-redirects.mjs 308s /brief and /brief/ to the home page, the
// query string riding along. What is checkable now is the withdrawal itself: the old URL must
// land on the home page, never on a brief.
{
  const { p, errs } = await page();
  await go(p, BASE + "/brief?id=jpmorgan");
  await waitForHydration(p);
  const url = new URL(p.url());
  ok("/brief withdrawn (lands on /)", url.pathname === "/", `url=${p.url()}`);
  ok("/brief page gone", !(await p.evaluate(() => /CSOAI tailored brief|Account not found|Visualize the Council design/i.test(document.title + "\n" + document.body.innerText))));
  ok("/brief console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 5) Sector + GEO pages
for (const [path, needle] of [["/defence-ai-act", "Article 2(3)"], ["/energy-ai-act", "critical infrastructure"], ["/pharma-ai-act", "drug-discovery"], ["/vs/vanta", "measurement, not compliance automation"]]) {
  const { p, errs } = await page();
  try {
    await go(p, BASE + path);
    await waitForHydration(p);
    ok(path + " content", await p.evaluate((n) => document.body.innerText.includes(n) || document.title.includes(n), needle));
    ok(path + " schema", await p.evaluate(() => document.querySelectorAll('script[type="application/ld+json"]').length > 0));
    ok(path + " console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  } catch (e) { ok(path + " load", false, String(e.message).slice(0, 40)); }
  await p.close();
}

// 6) /intel drive-command spy — RETIRED with /intel (withdrawn 6 Oct 2026, see block 2). It only
// ever reported "SKIPPED" there (the board embedded the globe read-only). Cross-frame drive
// delivery was then asserted on /brief (block 8), itself withdrawn the same day.

// 7) DRIVE-COMMAND SPY — /globe threat button drives the 3D globe (flyTo + neutralize).
{
  const { p, errs } = await page();
  await installGlobeDriveSpy(p);
  await go(p, BASE + "/globe");
  await waitForHydration(p);
  // Observe the layout served on this run. Some releases render a top-level globe;
  // others embed it in an iframe that can be replaced during SPA hydration.
  // Instrument before navigation and resolve the current frame when reading delivery.
  if (await p.locator('iframe[src*="globe3d"]').count()) {
    try {
      await waitForGlobeDriveReady(p);
      await clickWhenActionable(p, 'button:has-text("Rogue swarm")');
      await p.getByRole("button", { name: /Council responding|Swarm demo running|Demo complete|Stopped/ })
        .first().waitFor({ state: "visible", timeout: 5000 });
      await p.waitForTimeout(3200);
      const cmds = await readGlobeDriveCommands(p);
      ok("/globe threat drives globe", cmds.includes("flyTo") || cmds.includes("neutralize"), "got: " + JSON.stringify(cmds));
    } catch (e) {
      // Keep the failure and emit the remaining results instead of crashing the run.
      ok("/globe threat drives globe", false, String(e.message).slice(0, 160));
    }
  } else {
    console.log("~ /globe threat drives globe — UNMEASURED: no embedded globe frame found on this run");
  }
  await p.close();
}

// 8) /brief "Convene the council" drive-command spy — RETIRED with /brief (withdrawn 6 Oct 2026,
// see block 4). Its old flyTo + layer0/bftSpiral interaction is no longer exercised.
// Block 7 independently checks command delivery on the current /globe surface.

// 9+10) /simulate drive-command spies — RETIRED with the surface (see block 3). There is no
// globe iframe behind the /simulate door anymore, so these could only ever report
// "no globe frame". What they measured: council drive → block 8 on /brief, itself retired with
// /brief (6 Oct 2026); flyTo on click → retired with /intel (6 Oct 2026); neutralize had no
// surviving live surface as of 2026-09-10 — recorded here so the coverage gap is a visible
// decision, not a silent deletion. If a threat surface returns, reinstate the neutralize spy.



await b.close();
const pass = results.filter((r) => r.pass).length;
console.log(`\n=== Sov stack E2E: ${pass}/${results.length} passed ===`);
for (const r of results) console.log(`${r.pass ? "✓" : "✗"} ${r.name}${r.note ? "  — " + r.note : ""}`);
process.exit(results.every((r) => r.pass) ? 0 : 1);
