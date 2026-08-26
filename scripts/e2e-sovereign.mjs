// Deep persona-driven visual E2E against PRODUCTION with the live Sovereign brain.
// Sovereign-first: tests the OS the way an end user actually drives it.
// Captures a screenshot per tool layer to /tmp/e2e-shots and logs PASS/FAIL + reasons.
import { chromium } from "playwright";
import fs from "fs";

// RETARGETED 2026-08-26. The default pointed at a host this repo does not deploy, so a
// local run measured somebody else's site (or, for the Vercel default, a host that has
// been 402-dead since July). This repo deploys the Cloudflare Pages project `councilof-ai`
// at https://councilof.ai, and nothing else. A test aimed elsewhere is not a weaker test —
// it is a test of a different system, reporting on this one.
const BASE = process.env.BASE || "https://councilof.ai";
const DIR = "/tmp/e2e-shots";
fs.mkdirSync(DIR, { recursive: true });
const results = [];
function log(name, ok, detail) { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push("PE: " + e.message));

async function shot(n) { try { await page.screenshot({ path: `${DIR}/${n}.png`, fullPage: false }); } catch (e) {} }
async function type(sel, text) { const el = page.locator(sel).first(); await el.click(); await el.fill(""); await el.pressSequentially(text, { delay: 8 }); }
async function waitGrow(getText, min = 40, ms = 28000) {
  const start = (await getText()) || ""; const t0 = Date.now();
  while (Date.now() - t0 < ms) { await page.waitForTimeout(700); const now = (await getText()) || ""; if (now.length > start.length + min) return now; }
  return (await getText()) || "";
}

// 1) SOVEREIGN DOCK — awareness (answers) + capability (navigates)
try {
  await page.goto(BASE + "/", { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  await page.locator('button[aria-label="Open your Sovereign"]').click();
  await page.waitForTimeout(600);
  const dockText = () => page.locator('div.flex-1.space-y-3').first().innerText().catch(() => "");
  await type('input[placeholder="Ask me anything..."]', "what governs a fintech in the EU");
  await page.locator('button:has-text("Send")').click();
  const reply = await waitGrow(dockText, 40, 28000);
  await shot("01-dock-answer");
  log("Sovereign dock answers (awareness)", reply.length > 60, `reply ${reply.length} chars`);
} catch (e) { await shot("01-dock-answer-ERR"); log("Sovereign dock answers (awareness)", false, e.message); }

try {
  await type('input[placeholder="Ask me anything..."]', "open the governance graph");
  await page.locator('button:has-text("Send")').click();
  await page.waitForTimeout(9000);
  const url = page.url();
  await shot("02-dock-navigate");
  log("Sovereign dock navigates (capability)", /\/graph/.test(url), `url ${url}`);
} catch (e) { await shot("02-dock-navigate-ERR"); log("Sovereign dock navigates (capability)", false, e.message); }

// 2) GOVERNANCE GRAPH — compliance officer persona
try {
  await page.goto(BASE + "/graph", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  const inp = page.locator('input, textarea').first();
  await inp.click(); await inp.fill(""); await inp.pressSequentially("a hospital in Texas using AI for patient triage", { delay: 8 });
  const btn = page.locator('button:has-text("Map"), button:has-text("Ask"), button:has-text("Govern")').first();
  await btn.click().catch(() => page.keyboard.press("Enter"));
  await page.waitForTimeout(16000);
  const body = await page.innerText("body");
  await shot("03-graph-compliance");
  const okJuris = /Texas|United States|US\b/i.test(body);
  const okFw = /(EU AI Act|NIST|HIPAA|ISO|framework|Layer 0)/i.test(body);
  log("Governance Graph (compliance officer)", okJuris && okFw, `jurisdiction:${okJuris} frameworks:${okFw}`);
} catch (e) { await shot("03-graph-ERR"); log("Governance Graph (compliance officer)", false, e.message); }

// 3) COUNCIL /try — policymaker persona
try {
  await page.goto(BASE + "/try", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  const inp = page.locator('input, textarea').first();
  await inp.click(); await inp.fill(""); await inp.pressSequentially("We use AI to screen job applicants", { delay: 8 });
  await page.locator('button:has-text("Convene"), button:has-text("Run"), button:has-text("Ask"), button:has-text("Deliberate")').first().click().catch(() => page.keyboard.press("Enter"));
  await page.waitForTimeout(20000);
  const body = await page.innerText("body");
  await shot("04-council-policymaker");
  const ok = /(verdict|approve|reject|conditional|risk|vote|agent)/i.test(body);
  log("BFT Council /try (policymaker)", ok, ok ? "verdict produced" : "no verdict text");
} catch (e) { await shot("04-council-ERR"); log("BFT Council /try (policymaker)", false, e.message); }

// 4) SOV SPACE — researcher persona
try {
  await page.goto(BASE + "/sov-space", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  const inp = page.locator('input, textarea').first();
  await inp.click().catch(()=>{}); await inp.pressSequentially("An EU fintech deploying an AI credit-scoring model", { delay: 8 }).catch(()=>{});
  await page.locator('button:has-text("Run"), button:has-text("Simulate"), button:has-text("Seal")').first().click().catch(() => {});
  await page.waitForTimeout(16000);
  const body = await page.innerText("body");
  await shot("05-sovspace-researcher");
  const ok = /(verdict|hash|sha|signed|Layer 0|simulat)/i.test(body);
  log("Sov Space (researcher)", ok, ok ? "sim/verdict present" : "no sim output");
} catch (e) { await shot("05-sovspace-ERR"); log("Sov Space (researcher)", false, e.message); }

// 5) WATCHDOG MAP — citizen persona
try {
  await page.goto(BASE + "/watchdog-map", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
  const body = await page.innerText("body");
  await shot("06-watchdog-citizen");
  const ok = /(watchdog|report|signal|incident|heat)/i.test(body);
  log("Watchdog map (citizen)", ok, ok ? "map + intake present" : "missing");
} catch (e) { await shot("06-watchdog-ERR"); log("Watchdog map (citizen)", false, e.message); }

// 6) POC — defence operator (rogue-swarm stop)
try {
  await page.goto(BASE + "/poc", { waitUntil: "networkidle" }); await page.waitForTimeout(1500);
  await page.locator('button:has-text("Run")').first().click();
  await page.waitForTimeout(14000);
  const body = await page.innerText("body");
  await shot("07-poc-defence");
  const ok = /STOPPED|halt|quarantine|re-govern|signed/i.test(body);
  log("ONE OS POC rogue-swarm stop (defence)", ok, ok ? "intervention signed" : "no stop");
} catch (e) { await shot("07-poc-ERR"); log("ONE OS POC rogue-swarm stop (defence)", false, e.message); }

// 7) WORLD globe — public rogue-swarm stop
try {
  await page.goto(BASE + "/world", { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
  await page.locator('button:has-text("Rogue swarm")').first().click();
  await page.waitForTimeout(9000);
  const body = await page.innerText("body");
  await shot("08-world-rogue-stop");
  const ok = /STOPPED|Sovereign responding|governed|ledger/i.test(body);
  log("World globe rogue-stop (public)", ok, ok ? "stop shown" : "no stop");
} catch (e) { await shot("08-world-ERR"); log("World globe rogue-stop (public)", false, e.message); }

// 8) FUNNEL — buyer: pricing Operator -> signup plan banner
try {
  await page.goto(BASE + "/pricing", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  await shot("09-pricing");
  await page.locator('a:has-text("Become an Operator")').first().click();
  await page.waitForTimeout(2500);
  const body = await page.innerText("body");
  await shot("10-signup-operator");
  const ok = /Selected plan: Operator/i.test(body) && /249/.test(body);
  log("Funnel pricing→signup (buyer, Operator)", ok, ok ? "plan carried" : "intent dropped; url " + page.url());
} catch (e) { await shot("10-funnel-ERR"); log("Funnel pricing→signup (buyer, Operator)", false, e.message); }

// 9) DEMO — first-timer: tour boots with Sovereign
try {
  await page.goto(BASE + "/demo", { waitUntil: "networkidle" }); await page.waitForTimeout(3500);
  const body = await page.innerText("body");
  await shot("11-demo-firsttimer");
  const ok = /(Sovereign|Layer 0|governed|Continue|tour|welcome)/i.test(body);
  log("Demo/tour boot (first-timer)", ok, ok ? "boots" : "blank");
} catch (e) { await shot("11-demo-ERR"); log("Demo/tour boot (first-timer)", false, e.message); }

// summary
const pass = results.filter((r) => r.ok).length;
console.log(`\n=== SOVEREIGN E2E: ${pass}/${results.length} PASS ===`);
console.log("console/page errors captured:", errs.length);
if (errs.length) console.log(errs.slice(0, 12).map((e) => "  - " + e).join("\n"));
console.log("screenshots:", DIR);
await browser.close();

// ─────────────────────────────────────────────────────────────────────────────
// EXIT CONTRACT (added 2026-08-26). This suite printed its tally and exited 0 no
// matter what it found, so a run where every check failed — or where the harness
// crashed before a single check ran — was indistinguishable from a clean pass to
// CI, to a shell, and to a reader skimming the log. A suite that cannot report
// failure is worse than no suite: it converts an unknown into a false assurance.
// Both an empty run and any failed check now exit non-zero.
// ─────────────────────────────────────────────────────────────────────────────
if (!results.length) {
  console.error("SOVEREIGN E2E: FAIL — zero checks ran; the harness died before measuring anything.");
  process.exit(1);
}
const down = results.filter((r) => !r.ok);
if (down.length) {
  console.error(`SOVEREIGN E2E: FAIL — ${down.length}/${results.length} surface(s) failed: ${down.map((r) => r.name).join(", ")}`);
  process.exit(1);
}
console.log("SOVEREIGN E2E: PASS — every persona-driven surface answered.");
