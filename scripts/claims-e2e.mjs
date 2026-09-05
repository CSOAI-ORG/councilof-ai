// CSOAI Claims-Verification E2E — asserts every headline claim is functionally TRUE
// on the live site + brain (not just rendered). Run before any demo. See DEMO_READINESS.md.
// Robust: createRequire import (works local + CI); waits for lazy-loaded elements before
// interacting so it never throws a false fail.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// RETARGETED 2026-08-26. The default pointed at a host this repo does not deploy, so a
// local run measured somebody else's site (or, for the Vercel default, a host that has
// been 402-dead since July). This repo deploys the Cloudflare Pages project `councilof-ai`
// at https://councilof.ai, and nothing else. A test aimed elsewhere is not a weaker test —
// it is a test of a different system, reporting on this one.
const SITE = process.env.SITE || "https://councilof.ai";
const BRAIN = process.env.BRAIN || "https://os.meok.ai/api";
const R = [];
const pass = (c, d) => R.push(`✅ ${c} — ${d}`);
const fail = (c, d) => R.push(`❌ ${c} — ${d}`);
// Three states, not two — the same rule the estate applies to every card. A dependency that is
// GONE did not fail a check; the check never ran. Reporting that as ❌ says the signing is broken
// when the truth is that nothing was measured, and four identical "Unexpected end of JSON input"
// lines say neither.
const unchecked = (c, d) => R.push(`⚠️  ${c} — UNCHECKABLE: ${d}`);

// Is there an API at BRAIN at all? os.meok.ai answers HTTP 200 on EVERY path — /api/health,
// /api/mcp, /api/sign and / all return the same SPA index.html — so a status-code check passes
// against a host that has no API deployed. Content-type is what distinguishes them.
async function brainState() {
  try {
    const r = await fetch(BRAIN + "/health", { headers: { accept: "application/json" } });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("html")) {
      return { up: false, why: `${BRAIN} answers HTTP ${r.status} with ${ct} on /health — the SPA catch-all, not an API. No brain is deployed at this host.` };
    }
    return { up: true, why: `content-type ${ct}` };
  } catch (e) {
    return { up: false, why: `${BRAIN} unreachable: ${e.message}` };
  }
}

async function rpc(method, params) {
  const r = await fetch(BRAIN + "/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  return r.json();
}

async function apiTruth() {
  // Catalog count is expected to GROW as new governed MCPs are registered (e.g. csoai-governance-mcp
  // took it 377→378 on 2026-07-07) — check it's a sane, growing number, not frozen at one exact value.
  // The 377 baseline was never reproducible from this estate. It counted MCP SERVER repos and
  // printed them as TOOLS — the unit flip our own Refutation Ledger already records ("no 9-tool
  // manifest exists; claims-only, with a tools<->servers unit flip in the same page"). The
  // endpoint it pointed at now serves the SPA, so the assertion was failing on a missing route
  // rather than on a real count. Asserting a number we cannot reproduce is the failure this
  // organisation exists to catch, so the check is now on the CONTRACT: real JSON, a derived
  // total, and tools counted as tools.
  try {
    // CONTRACT CHANGED 2026-08-26. This asserted `total > 0` for `?q=governance`, and the
    // only reason it ever passed was that the old handler served five INVENTED tool rows
    // exposed by no reachable server. The real fleet has 4 probed tools, none matching
    // "governance", so 0 is the correct answer to that query — a search returning no match
    // is a result, not a fault. The test now checks what actually matters: that the
    // catalogue is non-empty, and that `total` is DERIVED from the array rather than
    // asserted alongside it. Do not restore the invented rows to make this green.
    const d = await (await fetch(SITE + "/api/tools?q=governance")).json();
    const okShape = typeof d.total === "number" && Array.isArray(d.tools) &&
      typeof d.server_count === "number" && typeof d.catalogue_total === "number";
    const derived = okShape && d.total === d.tools.length;
    // The pass condition deliberately does NOT require d.total > 0: "governance" matches none of
    // the eight tools (measure, verify, jail-probe, enter-arena, board_totals, get_axis,
    // verify_card, list_cards), and a query matching nothing is a result, not a fault. I tried
    // requiring it and it fails against a correct system.
    //
    // What the check genuinely lacked is any proof that search FILTERS at all — with `q` ignored
    // entirely, shape and derivation both still hold and this goes green. So the filter is now
    // exercised with a term taken from the catalogue itself rather than a hard-coded guess: a
    // real tool name must match, and a string no tool can contain must not.
    (okShape && derived && d.catalogue_total > 0)
      ? pass('CLAIM "MCP tool catalogue"', `/api/tools total=${d.total} matched of catalogue_total=${d.catalogue_total}, ${d.server_count} probed server(s) (derived, not asserted)`)
      : fail('CLAIM "MCP tool catalogue"', `shape=${okShape} derived=${derived} catalogue_total=${d.catalogue_total}`);

    // Search actually filters — proven from the catalogue, not from a guess about its contents.
    const all = await (await fetch(SITE + "/api/tools")).json();
    const sample = (all.tools || [])[0]?.name;
    if (!sample) {
      fail("MCP tool search", "catalogue is empty, so the filter cannot be exercised");
    } else {
      const hit = await (await fetch(SITE + "/api/tools?q=" + encodeURIComponent(sample))).json();
      const miss = await (await fetch(SITE + "/api/tools?q=zzzz-no-tool-can-match-this")).json();
      (hit.total > 0 && miss.total === 0)
        ? pass("MCP tool search filters", `q="${sample}" → ${hit.total}, q="zzzz…" → ${miss.total}`)
        : fail("MCP tool search filters", `q="${sample}" → ${hit.total} (expected >0), q="zzzz…" → ${miss.total} (expected 0) — the q parameter is not filtering`);
    }
  } catch (e) { fail("MCP tool catalogue", e.message); }
  const brain = await brainState();
  if (!brain.up) {
    // One clear sentence instead of four "Unexpected end of JSON input" lines that named the
    // symptom and hid the cause. These claims are not refuted; they are unmeasured.
    unchecked("Brain host", brain.why);
    for (const c of ["Live MCP tools", "meok_govern executes", 'CLAIM "Ed25519 signing"', "Brain health"]) {
      unchecked(c, "depends on the brain host above; not probed");
    }
  } else {
    try { const d = await rpc("tools/list"); const n = (d.result?.tools || []).length; n >= 5 ? pass("Live MCP tools", `${n} execute server-side`) : fail("Live MCP tools", `only ${n}`); } catch (e) { fail("tools/list", e.message); }
    try { const d = await rpc("tools/call", { name: "meok_govern", arguments: { industry: "a bank" } }); const t = d.result?.content?.map((c) => c.text).join(" ") || ""; /EU AI Act|DORA|GDPR/.test(t) ? pass("meok_govern executes", t.slice(0, 55)) : fail("meok_govern", "no framework output"); } catch (e) { fail("meok_govern", e.message); }
    try { const r = await fetch(BRAIN + "/sign", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: "claims-test" }) }); const d = await r.json(); (d.signature && d.publicKey) ? pass('CLAIM "Ed25519 signing"', `real sig len=${String(d.signature).length}, alg=${d.alg || "?"}`) : fail("Ed25519 signing", "no signature — the signed claim would be FALSE"); } catch (e) { fail("Ed25519 signing", e.message); }
    try { const d = await (await fetch(BRAIN + "/health")).json(); d.ok ? pass("Brain health", d.service) : fail("Brain health", "not ok"); } catch (e) { fail("health", e.message); }
  }
  try { const r = await fetch(SITE + "/api/og?title=Test"); (r.status === 200 && (r.headers.get("content-type") || "").includes("image")) ? pass("Dynamic OG", "image/png 200") : fail("Dynamic OG", r.status + ""); } catch (e) { fail("OG", e.message); }
}

async function open(b, path) {
  const p = await b.newPage();
  await p.goto(SITE + path, { waitUntil: "networkidle", timeout: 30000 });
  return p;
}

// SOV3 release-infrastructure pages (2026-07-12) — confirm each renders its
// own real title (not the SPA's generic fallback) and non-trivial content,
// so a future change can't silently break one without CI catching it.
async function sov3Pages(b) {
  const checks = [
    { path: "/sov3-model-card", titleRe: /Model Card/i, bodyRe: /governed sovereign substrate|Oracle GenAI|Qwen3-MoE/i },
    { path: "/sov3-system-card", titleRe: /System.*Safety Card/i, bodyRe: /care-floor|Containment|governance signal/i },
    { path: "/sov3-whitepaper", titleRe: /Growth by Accretion/i, bodyRe: /accretion|frozen base|invariant/i },
    { path: "/research-transparency", titleRe: /Research.*Transparency/i, bodyRe: /CONFIRMED|RETRACTED|wrong turns/i },
  ];
  for (const c of checks) {
    try {
      const p = await open(b, c.path);
      await p.waitForTimeout(1500);
      const title = await p.title();
      const body = await p.innerText("body");
      const ok = c.titleRe.test(title) && c.bodyRe.test(body);
      ok ? pass(`CLAIM "${c.path} renders"`, `title="${title.slice(0, 40)}"`) : fail(c.path, `title="${title}" bodyMatch=${c.bodyRe.test(body)}`);
      await p.close();
    } catch (e) { fail(c.path, e.message.slice(0, 45)); }
  }
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
  // Report — fail closed while the write endpoint is not implemented.
  try { const p = await open(b, "/report"); await p.waitForTimeout(1200);
    const body = await p.innerText("body");
    /review|not (?:currently )?(?:live|implemented)|withdrawn/i.test(body) && !/Submit \+ seal/i.test(body)
      ? pass('CLAIM "incident submission is unavailable"', "withdrawn surface fails closed")
      : fail("report", "unavailable intake was presented as live"); await p.close(); } catch (e) { fail("report", e.message.slice(0, 45)); }
  // Workbench
  try { const p = await open(b, "/workbench"); await p.waitForSelector("input", { timeout: 12000 });
    await p.locator("input").first().fill("Classify an EU AI Act risk tier for a credit model"); await p.getByText(/Run \+ seal/).first().click(); await p.waitForTimeout(7000);
    const body = await p.innerText("body"); /seal|Ed25519|Layer 0|council/i.test(body) ? pass('CLAIM "signed artifacts"', "sealed artifact produced") : fail("workbench", "no artifact"); await p.close(); } catch (e) { fail("workbench", e.message.slice(0, 45)); }
  // Council design — the page must not present the proposed 33 seats as live BFT.
  try { const p = await open(b, "/council"); await p.waitForTimeout(1200);
    const body = await p.innerText("body"); /DESIGN.{0,20}not a live system/is.test(body) && /n_eff\s*=\s*1/i.test(body)
      ? pass('CLAIM "Council is a design"', "n_eff=1 boundary rendered")
      : fail("council", "design/live boundary missing"); await p.close(); } catch (e) { fail("council", e.message.slice(0, 45)); }
  // Globe
  try { const p = await b.newPage(); await p.goto(SITE + "/globe3d.html", { waitUntil: "domcontentloaded", timeout: 25000 }); await p.waitForTimeout(4500);
    (await p.evaluate(() => !!document.querySelector("canvas"))) ? pass('CLAIM "live globe"', "Cesium canvas rendered") : fail("globe", "no canvas"); await p.close(); } catch (e) { fail("globe", e.message.slice(0, 45)); }
}

const b = await chromium.launch();
await apiTruth();
await interactive(b);
await sov3Pages(b);
await b.close();
const passes = R.filter((x) => x[0] === "✅").length, fails = R.filter((x) => x[0] === "❌").length;
const unknowns = R.filter((x) => x.startsWith("⚠️")).length;
console.log("# CSOAI Claims-Verification E2E — " + SITE + "\n");
console.log(R.join("\n"));
console.log(`\nRESULT: ${passes} pass · ${fails} FAIL · ${unknowns} UNCHECKABLE`);
// An UNCHECKABLE headline claim still fails the run. A claim the site makes that nobody can
// verify is not in better standing than one that failed — it is in worse standing, because the
// failure is at least legible. What changes is that the report now says which of the two it is,
// instead of printing four JSON parse errors that named the symptom and hid the cause.
if (unknowns > 0 && fails === 0) {
  console.log("\nNothing was refuted. Something could not be measured — treat it as unshipped, not as working.");
}
process.exit(fails > 0 || unknowns > 0 ? 1 : 0);
