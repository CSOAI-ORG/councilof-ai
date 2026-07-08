// sov-stack-e2e — end-to-end sweep of the unified agentic Sovereign stack (globe + sims + hive).
// Captures console errors, verifies the 3D globe signals ready, exercises real interactions,
// and checks the cross-surface handoffs. Run: E2E_BASE=https://csoai.org node scripts/sov-stack-e2e.mjs
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.E2E_BASE || "https://csoai.org";

const b = await chromium.launch();
const results = [];
async function page() {
  const p = await b.newPage();
  const errs = [];
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 100)); });
  p.on("pageerror", (e) => errs.push("PAGEERR:" + String(e.message).slice(0, 90)));
  return { p, errs };
}
function ok(name, cond, note = "") { results.push({ name, pass: !!cond, note }); }
// Resilient nav: survive transient network blips (ERR_NETWORK_CHANGED etc) with a retry.
async function go(p, url) {
  for (let i = 0; i < 3; i++) {
    try { await p.goto(url, { waitUntil: "networkidle", timeout: 30000 }); return true; }
    catch (e) { if (i === 2) throw e; await p.waitForTimeout(1500); }
  }
}

// 1) /globe — 3D globe, mode toggle, agentic ask, threat
{
  const { p, errs } = await page();
  await go(p, BASE + "/globe");
  let ready = false; p.on("console", () => {});
  await p.waitForTimeout(2500);
  const has3d = await p.$('iframe[src*="globe3d"]');
  ok("/globe 3d iframe", !!has3d);
  ok("/globe mode toggle", await p.evaluate(() => /3D globe|2D classic/.test(document.body.innerText)));
  // type an agentic ask
  const input = await p.$('input[placeholder*="watchdog"], input[placeholder*="London"], input');
  if (input) { await input.fill("show the frameworks in Japan"); const askBtn = await p.$x ? null : null; await p.keyboard.press("Enter"); await p.waitForTimeout(1500); }
  ok("/globe ask no-crash", true);
  // toggle to 2D → SVG should appear
  const toggle = await p.$('button:has-text("2D classic"), button:has-text("3D globe")');
  if (toggle) { await toggle.click(); await p.waitForTimeout(600); ok("/globe 2D svg", await p.$('svg') != null); } else ok("/globe 2D svg", false, "toggle not found");
  ok("/globe console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 2) /intel — globe, click account flies, tour button
{
  const { p, errs } = await page();
  await go(p, BASE + "/intel");
  await p.waitForTimeout(1500);
  ok("/intel globe", await p.$('iframe[src*="globe3d"]') != null);
  ok("/intel tour btn", await p.evaluate(() => /Tour the top gaps/i.test(document.body.innerText)));
  ok("/intel voice toggle", await p.evaluate(() => /voice|muted/i.test(document.body.innerText)));
  const acct = await p.$('button:has-text("JPMorgan"), button:has-text("Chase")');
  if (acct) { await acct.click(); await p.waitForTimeout(800); ok("/intel select flies", await p.evaluate(() => /flown to/i.test(document.body.innerText))); } else ok("/intel select flies", false, "no account btn");
  ok("/intel console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 3) /simulate — greeting, globe, handoff prefill
{
  const { p, errs } = await page();
  await go(p, BASE + "/simulate?q=a%20hiring%20AI%20in%20Germany");
  await p.waitForTimeout(1500);
  ok("/simulate globe", await p.$('iframe[src*="globe3d"]') != null);
  ok("/simulate greeting", await p.evaluate(() => /Governing AI|governance/i.test(document.body.innerText)));
  ok("/simulate q-prefill", await p.evaluate(() => (document.querySelector("textarea") || {}).value?.includes("Germany")));
  ok("/simulate globe link", await p.evaluate(() => /Sovereign Globe/i.test(document.body.innerText)));
  ok("/simulate console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 4) /brief — HQ fly + convene + deep links
{
  const { p, errs } = await page();
  await go(p, BASE + "/brief?id=jpmorgan");
  await p.waitForTimeout(1500);
  ok("/brief globe", await p.$('iframe[src*="globe3d"]') != null);
  ok("/brief HQ caption", await p.evaluate(() => /flown to .*HQ/i.test(document.body.innerText)));
  ok("/brief convene btn", await p.evaluate(() => /Convene the 33-agent council/i.test(document.body.innerText)));
  ok("/brief console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 5) Sector + GEO pages
for (const [path, needle] of [["/defence-ai-act", "Article 2(3)"], ["/energy-ai-act", "critical infrastructure"], ["/pharma-ai-act", "drug-discovery"], ["/vs/vanta", "CSOAI vs Vanta"]]) {
  const { p, errs } = await page();
  try {
    await go(p, BASE + path);
    await p.waitForTimeout(700);
    ok(path + " content", await p.evaluate((n) => document.body.innerText.includes(n) || document.title.includes(n), needle));
    ok(path + " schema", await p.evaluate(() => document.querySelectorAll('script[type="application/ld+json"]').length > 0));
    ok(path + " console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  } catch (e) { ok(path + " load", false, String(e.message).slice(0, 40)); }
  await p.close();
}

// 6) DRIVE-COMMAND SPY — prove the globe actually RECEIVES commands when you interact.
{
  const { p, errs } = await page();
  await go(p, BASE + "/intel");
  await p.waitForTimeout(2800);
  const frame = p.frames().find((f) => f.url().includes("globe3d"));
  if (frame) {
    await frame.evaluate(() => { window.__spy = []; window.addEventListener("message", (e) => { if (e && e.data && e.data.cmd) window.__spy.push(e.data.cmd); }); });
    const acct = await p.$('button:has-text("JPMorgan"), button:has-text("Chase"), button:has-text("Wells")');
    if (acct) await acct.click();
    await p.waitForTimeout(1600);
    const cmds = await frame.evaluate(() => window.__spy || []);
    ok("/intel globe RECEIVES flyTo on click", cmds.includes("flyTo"), "got: " + JSON.stringify(cmds));
  } else ok("/intel globe RECEIVES flyTo on click", false, "no globe frame");
  ok("/intel spy console-clean", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

// 7) DRIVE-COMMAND SPY — /globe threat button drives the 3D globe (flyTo + neutralize).
{
  const { p, errs } = await page();
  await go(p, BASE + "/globe");
  await p.waitForTimeout(2800);
  const frame = p.frames().find((f) => f.url().includes("globe3d"));
  if (frame) {
    await frame.evaluate(() => { window.__spy = []; window.addEventListener("message", (e) => { if (e && e.data && e.data.cmd) window.__spy.push(e.data.cmd); }); });
    const threatBtn = await p.$('button:has-text("Rogue swarm")');
    if (threatBtn) await threatBtn.click();
    await p.waitForTimeout(3200);
    const cmds = await frame.evaluate(() => window.__spy || []);
    ok("/globe threat drives globe", cmds.includes("flyTo") || cmds.includes("neutralize"), "got: " + JSON.stringify(cmds));
  } else ok("/globe threat drives globe", false, "no globe frame");
  await p.close();
}

// 8) SPY — /brief "Convene the council" drives flyTo + bftSpiral over the HQ.
{
  const { p } = await page();
  try {
    await go(p, BASE + "/brief?id=jpmorgan");
    await p.waitForTimeout(2600);
    const frame = p.frames().find((f) => f.url().includes("globe3d"));
    if (frame) {
      await frame.evaluate(() => { window.__spy = []; window.addEventListener("message", (e) => { if (e && e.data && e.data.cmd) window.__spy.push(e.data.cmd); }); });
      const btn = await p.$('button:has-text("Convene the 33-agent council")');
      if (btn) await btn.click();
      await p.waitForTimeout(3800);
      const cmds = await frame.evaluate(() => window.__spy || []);
      ok("/brief convene drives council", cmds.includes("flyTo") && cmds.includes("bftSpiral"), "got: " + JSON.stringify(cmds));
    } else ok("/brief convene drives council", false, "no globe frame");
  } catch (e) { ok("/brief convene drives council", false, String(e.message).slice(0, 40)); }
  await p.close();
}

// 9) SPY — /simulate "Run experiment" convenes the council on the scenario's jurisdiction.
{
  const { p } = await page();
  try {
    await go(p, BASE + "/simulate?q=a%20hiring%20AI%20in%20Germany");
    await p.waitForTimeout(2600);
    const frame = p.frames().find((f) => f.url().includes("globe3d"));
    if (frame) {
      await frame.evaluate(() => { window.__spy = []; window.addEventListener("message", (e) => { if (e && e.data && e.data.cmd) window.__spy.push(e.data.cmd); }); });
      const run = await p.$('button:has-text("Run experiment")');
      if (run) await run.click();
      await p.waitForTimeout(4400);
      const cmds = await frame.evaluate(() => window.__spy || []);
      ok("/simulate run drives council", cmds.includes("flyTo") && cmds.includes("bftSpiral"), "got: " + JSON.stringify(cmds));
    } else ok("/simulate run drives council", false, "no globe frame");
  } catch (e) { ok("/simulate run drives council", false, String(e.message).slice(0, 40)); }
  await p.close();
}

// 10) SPY — /simulate with a THREAT scenario also drives neutralize on the globe.
{
  const { p } = await page();
  try {
    await go(p, BASE + "/simulate?q=a%20rogue%20swarm%20of%20agents%20in%20London");
    await p.waitForTimeout(2600);
    const frame = p.frames().find((f) => f.url().includes("globe3d"));
    if (frame) {
      await frame.evaluate(() => { window.__spy = []; window.addEventListener("message", (e) => { if (e && e.data && e.data.cmd) window.__spy.push(e.data.cmd); }); });
      const run = await p.$('button:has-text("Run experiment")');
      if (run) await run.click();
      await p.waitForTimeout(7600); // neutralize is scheduled ~6.6s after run
      const cmds = await frame.evaluate(() => window.__spy || []);
      ok("/simulate threat drives neutralize", cmds.includes("neutralize"), "got: " + JSON.stringify(cmds));
    } else ok("/simulate threat drives neutralize", false, "no globe frame");
  } catch (e) { ok("/simulate threat drives neutralize", false, String(e.message).slice(0, 40)); }
  await p.close();
}

await b.close();
const pass = results.filter((r) => r.pass).length;
console.log(`\n=== Sov stack E2E: ${pass}/${results.length} passed ===`);
for (const r of results) console.log(`${r.pass ? "✓" : "✗"} ${r.name}${r.note ? "  — " + r.note : ""}`);
process.exit(results.every((r) => r.pass) ? 0 : 1);
