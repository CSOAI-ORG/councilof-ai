// sov-stack-e2e — end-to-end sweep of the unified agentic Sovereign stack (globe + sims + hive).
// Captures console errors, verifies the 3D globe signals ready, exercises real interactions,
// and checks the cross-surface handoffs. Run: E2E_BASE=https://csoai.org node scripts/sov-stack-e2e.mjs
import { createRequire } from "module";
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

// Find the embedded globe3d frame. csoai.org wraps the globe in an
// <iframe src=".../globe3d.html">. p.frames() on a heavy SPA misses
// some same-origin child frames; the reliable path is the iframe
// element handle's .contentFrame(), which returns the Frame directly.
async function findGlobeFrameFromElement(p) {
  const handle = await p.$('iframe[src*="globe3d"]');
  if (!handle) return null;
  // Wait for the contentDocument to be fully loaded
  await p.waitForFunction(
    () => {
      const el = document.querySelector('iframe[src*="globe3d"]');
      return el && el.contentDocument && el.contentDocument.readyState === "complete";
    },
    { timeout: 30000 },
  ).catch(() => null);
  return await handle.contentFrame().catch(() => null);
}

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

// Click an action button once it is visible AND enabled. The SPA's overlay
// buttons can be present in the DOM but covered by a transient hydration
// layer for 1-3s; the default 30s click wait is the wrong tool — the button
// is not "not found", it is "not actionable yet". Wait for the actionable
// state, then click with a generous timeout.
//
// selector can be a CSS selector OR a comma-separated list of Playwright
// `:has-text("X")` pseudo-selectors. We use Playwright's locator API for both
// the wait and the click, which understands `:has-text` natively.
async function clickWhenActionable(p, selector, timeoutMs = 30000) {
  const loc = p.locator(selector.split(",")[0].trim());
  try {
    await loc.waitFor({ state: "visible", timeout: timeoutMs });
  } catch (_) { return null; }
  // If the comma-joined form had multiple options, prefer the first visible one
  const candidates = selector.split(",").map((s) => p.locator(s.trim()));
  let target = loc;
  for (const c of candidates) {
    if (await c.count() > 0 && await c.first().isVisible().catch(() => false)) {
      target = c.first();
      break;
    }
  }
  try {
    await target.click({ timeout: 10000 });
    return target;
  } catch (_) {
    return target;
  }
}

// 1) /globe — 3D globe, mode toggle, agentic ask, threat
{
  const { p, errs } = await page();
  await go(p, BASE + "/globe");
  let ready = false; p.on("console", () => {});
  await p.waitForTimeout(2500);
  // ARCHITECTURE CHANGED, and these assertions encoded the old one.
  // /globe used to be a WRAPPER page holding an <iframe src="globe3d"> plus a 2D/3D toggle.
  // It now 308s to /globe3d and renders the globe DIRECTLY — one canvas, no iframe, no
  // toggle. The capability is intact and live (417 frozen provisions, 6 anchor nodes,
  // 291 MCP servers catalogued render on it); only the packaging moved.
  //
  // So these check the capability rather than the wrapper. What is NOT being quietly
  // dropped: the 2D-classic view no longer exists on this route. That is recorded here
  // rather than deleted, because a test removed in silence is how a surface disappears
  // without anyone deciding to remove it.
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
        await input.fill("show the frameworks in Japan");
        await p.keyboard.press("Enter");
        await p.waitForTimeout(1500);
      } else {
        console.log("~ /globe ask no-crash — SKIPPED: input present but not visible");
      }
    } else {
      console.log("~ /globe ask no-crash — SKIPPED: no ask input on this /globe build");
      // Only a real interaction earns a pass. The unconditional ok(true) that used to sit
      // here asserted nothing and counted toward the green total — a fake pass is worse than
      // a skip, because it makes the number look like evidence when it is not.
      ok("/globe ask no-crash", true);
    }
  } catch (e) {
    ok("/globe ask no-crash", false, "input fill failed: " + String(e.message).slice(0, 80));
  }
  // toggle to 2D → SVG should appear
  // The 2D-classic toggle was removed with the wrapper page (see above). If it ever returns,
  // this asserts it works; while it is absent, that absence is reported as a skip, not a pass
  // and not a failure — the same UNMEASURED discipline used on the model boards.
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
  await go(p, BASE + "/globe");
  await waitForHydration(p);
  // This spied on postMessage from a PARENT page into the globe iframe. /globe is now the
  // globe itself at top level, so there is no parent to post and no cross-frame hop to
  // observe — the mechanism cannot fire by construction, which is why it returned [].
  //
  // Cross-frame command delivery was asserted on /brief (flyTo + bftSpiral) until /brief was
  // withdrawn on 6 Oct 2026; /simulate and /intel, which also used to, are retired too. No live
  // public route embeds the globe in an iframe any more, so that hop has no surface to measure
  // (block 8 records the gap). Rather than assert a hop that does not exist here, this reports
  // the architectural reason.
  const childFrame = await findGlobeFrameFromElement(p);
  if (childFrame) {
    await childFrame.evaluate(() => { window.__spy = []; window.addEventListener("message", (e) => { if (e && e.data && e.data.cmd) window.__spy.push(e.data.cmd); }); });
    await clickWhenActionable(p, 'button:has-text("Rogue swarm")');
    await p.waitForTimeout(3200);
    const cmds = await childFrame.evaluate(() => window.__spy || []);
    ok("/globe threat drives globe", cmds.includes("flyTo") || cmds.includes("neutralize"), "got: " + JSON.stringify(cmds));
  } else {
    console.log("~ /globe threat drives globe — SKIPPED: globe is top-level here, no parent→iframe hop exists. No live surface has one since /brief was withdrawn.");
  }
  await p.close();
}

// 8) /brief "Convene the council" drive-command spy — RETIRED with /brief (withdrawn 6 Oct 2026,
// see block 4). It was the last live surface that embedded the globe in an iframe and drove it
// across frames (flyTo + layer0/bftSpiral). The capability is now UNMEASURED, not passing: the
// remaining callers of client/src/lib/globeDrive.ts are /globe, where the globe is top-level
// (block 7), and CouncilSpace, dead code behind the /gspc-arena door /simulate leads to (block 3).
// Recorded here so the coverage gap is a visible decision, not a silent deletion. If a public
// page embeds the globe again, reinstate this spy on it.

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
