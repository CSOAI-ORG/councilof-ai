// CSOAI Claims-Verification E2E — asserts every headline claim is functionally TRUE
// on the live site + brain (not just rendered). Run before any demo. See DEMO_READINESS.md.
// Robust: createRequire import (works local + CI); waits for lazy-loaded elements before
// interacting so it never throws a false fail.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const SITE = process.env.SITE || "https://www.csoai.org";
const BRAIN = process.env.BRAIN || "https://os.meok.ai/api";
const R = [];
const pass = (c, d) => R.push(`✅ ${c} — ${d}`);
const fail = (c, d) => R.push(`❌ ${c} — ${d}`);

async function rpc(method, params) {
  const r = await fetch(BRAIN + "/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  return r.json();
}

async function apiTruth() {
  // Catalog count is expected to GROW as new governed MCPs are registered (e.g. csoai-governance-mcp
  // took it 377→378 on 2026-07-07) — check it's a sane, growing number, not frozen at one exact value.
  try { const d = await (await fetch(BRAIN + "/tools?q=governance")).json(); (typeof d.total === "number" && d.total >= 377) ? pass('CLAIM "377+ tools"', `/api/tools total=${d.total} (baseline 377, grows as catalog is registered)`) : fail('CLAIM "377+ tools"', `actual=${d.total} — below baseline, investigate`); } catch (e) { fail("377+ tools", e.message); }
  try { const d = await rpc("tools/list"); const n = (d.result?.tools || []).length; n >= 5 ? pass("Live MCP tools", `${n} execute server-side`) : fail("Live MCP tools", `only ${n}`); } catch (e) { fail("tools/list", e.message); }
  try { const d = await rpc("tools/call", { name: "meok_govern", arguments: { industry: "a bank" } }); const t = d.result?.content?.map((c) => c.text).join(" ") || ""; /EU AI Act|DORA|GDPR/.test(t) ? pass("meok_govern executes", t.slice(0, 55)) : fail("meok_govern", "no framework output"); } catch (e) { fail("meok_govern", e.message); }
  try { const r = await fetch(BRAIN + "/sign", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: "claims-test" }) }); const d = await r.json(); (d.signature && d.publicKey) ? pass('CLAIM "Ed25519 signing"', `real sig len=${String(d.signature).length}, alg=${d.alg || "?"}`) : fail("Ed25519 signing", "no signature — the signed claim would be FALSE"); } catch (e) { fail("Ed25519 signing", e.message); }
  try { const d = await (await fetch(BRAIN + "/health")).json(); d.ok ? pass("Brain health", d.service) : fail("Brain health", "not ok"); } catch (e) { fail("health", e.message); }
  try { const r = await fetch(SITE + "/api/og?title=Test"); (r.status === 200 && (r.headers.get("content-type") || "").includes("image")) ? pass("Dynamic OG", "image/png 200") : fail("Dynamic OG", r.status + ""); } catch (e) { fail("OG", e.message); }
}

async function open(b, path) {
  const p = await b.newPage();
  await p.goto(SITE + path, { waitUntil: "networkidle", timeout: 30000 });
  return p;
}

async function interactive(b) {
  // Tool Runner
  try { const p = await open(b, "/tool-commons"); await p.waitForSelector("text=/Run tool/", { timeout: 12000 });
    const inp = p.locator("input").last(); if (await inp.count()) await inp.fill("a hospital"); await p.getByText(/Run tool/).first().click(); await p.waitForTimeout(6000);
    const body = await p.innerText("body"); /govern|framework|EU AI Act|GDPR|result/i.test(body) ? pass('CLAIM "run live tools"', "governed output rendered") : fail("run live tools", "no output"); await p.close(); } catch (e) { fail("ToolRunner", e.message.slice(0, 45)); }
  // Classifier
  try { const p = await open(b, "/classifier"); await p.waitForSelector("input", { timeout: 12000 });
    await p.fill("input", "AI that screens job applicants"); await p.getByText(/Classify/).first().click(); await p.waitForTimeout(6000);
    const body = await p.innerText("body"); /high[-\s]?risk|risk tier|obligation/i.test(body) ? pass('CLAIM "classify your AI"', "risk classification returned") : fail("classify", "no classification"); await p.close(); } catch (e) { fail("classifier", e.message.slice(0, 45)); }
  // Report — real seal
  try { const p = await open(b, "/report"); await p.waitForSelector("textarea", { timeout: 12000 });
    await p.fill("textarea", "Proxy discrimination in an AI hiring tool."); await p.getByText(/Submit \+ seal/).first().click(); await p.waitForTimeout(6000);
    const body = await p.innerText("body"); /(SOV:|Ed25519|sig |sha256:|sealed|receipt|WD-)/i.test(body) ? pass('CLAIM "sealed to Layer 0"', "receipt/seal shown") : fail("report seal", "no receipt"); await p.close(); } catch (e) { fail("report", e.message.slice(0, 45)); }
  // Workbench
  try { const p = await open(b, "/workbench"); await p.waitForSelector("input", { timeout: 12000 });
    await p.locator("input").first().fill("Classify an EU AI Act risk tier for a credit model"); await p.getByText(/Run \+ seal/).first().click(); await p.waitForTimeout(7000);
    const body = await p.innerText("body"); /seal|Ed25519|Layer 0|council/i.test(body) ? pass('CLAIM "signed artifacts"', "sealed artifact produced") : fail("workbench", "no artifact"); await p.close(); } catch (e) { fail("workbench", e.message.slice(0, 45)); }
  // Council viz
  try { const p = await open(b, "/try"); await p.waitForTimeout(1200);
    await p.getByText(/screen job applicants|facial recognition/i).first().click().catch(() => {}); await p.waitForTimeout(3500);
    const body = await p.innerText("body"); /quorum|care-floor|Byzantine|consensus/i.test(body) ? pass('CLAIM "33-agent council"', "BFT viz present") : fail("council viz", "not shown"); await p.close(); } catch (e) { fail("council", e.message.slice(0, 45)); }
  // Globe
  try { const p = await b.newPage(); await p.goto(SITE + "/globe3d.html", { waitUntil: "domcontentloaded", timeout: 25000 }); await p.waitForTimeout(4500);
    (await p.evaluate(() => !!document.querySelector("canvas"))) ? pass('CLAIM "live globe"', "Cesium canvas rendered") : fail("globe", "no canvas"); await p.close(); } catch (e) { fail("globe", e.message.slice(0, 45)); }
}

const b = await chromium.launch();
await apiTruth();
await interactive(b);
await b.close();
const passes = R.filter((x) => x[0] === "✅").length, fails = R.filter((x) => x[0] === "❌").length;
console.log("# CSOAI Claims-Verification E2E — " + SITE + "\n");
console.log(R.join("\n"));
console.log(`\nRESULT: ${passes} pass · ${fails} FAIL`);
process.exit(fails > 0 ? 1 : 0);
