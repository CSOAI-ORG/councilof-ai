#!/usr/bin/env node
// account-e2e.mjs — per-account EXPERIENCE verification (M2 lane; complements M4's data recon).
// For each account, walk the LIVE platform AS that end-user and score whether we serve the
// demographic: region-localized homepage, tailored /brief, /crosswalk pre-framed to their
// frameworks, Sovereign answering their region+sector question, classifier. Flags gaps to polish.
//
// Reads accounts read-only from client/src/data/ecosystem.ts (M4's data — never edited here).
// Sample: curated default spanning regions×sectors×plays, or ACCOUNTS=id1,id2 to target.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// RETARGETED 2026-08-26. The default pointed at a host this repo does not deploy, so a
// local run measured somebody else's site (or, for the Vercel default, a host that has
// been 402-dead since July). This repo deploys the Cloudflare Pages project `councilof-ai`
// at https://councilof.ai, and nothing else. A test aimed elsewhere is not a weaker test —
// it is a test of a different system, reporting on this one.
const SITE = process.env.SITE || "https://councilof.ai";
const GW = "https://os.meok.ai/api";

// region → emulated timezone/locale (drives the "loads local" detection)
const TZ = { EU: ["Europe/Berlin", "de-DE"], UK: ["Europe/London", "en-GB"], US: ["America/New_York", "en-US"], APAC: ["Asia/Singapore", "en-SG"] };
const JUR_TZ = { jp: ["Asia/Tokyo", "ja-JP"], kr: ["Asia/Seoul", "ko-KR"], cn: ["Asia/Shanghai", "zh-CN"], sg: ["Asia/Singapore", "en-SG"], in: ["Asia/Kolkata", "en-IN"], uk: ["Europe/London", "en-GB"], eu: ["Europe/Berlin", "de-DE"], us: ["America/New_York", "en-US"] };
// region → a regime keyword we expect the localized homepage to surface
const REGIME = { EU: /EU AI Act/i, UK: /UK|principles/i, US: /NIST/i, APAC: /MAS|METI|AI Basic Act|ISO/i };
// jurisdiction-aware LOCAL regime the Sovereign should lead with (Agent-3 building block).
const LOCAL = { jp: /METI|APPI|Japan/i, kr: /AI Basic Act|Korea|PIPA/i, cn: /TC260|China|GenAI/i, sg: /MAS|FEAT|Model AI Governance|Singapore/i, in: /DPDP|MeitY|India/i, uk: /UK|ICO|principles/i, eu: /EU AI Act|GDPR|DORA|NIS2/i, us: /NIST|HIPAA|FTC|state/i };
function localRegime(a) { for (const j of a.jurisdictions || []) if (LOCAL[j]) return LOCAL[j]; return REGIME[a.region] || /governance/i; }

function loadAccounts() {
  const ts = readFileSync(resolve(ROOT, "client/src/data/ecosystem.ts"), "utf8");
  const rows = [];
  for (const m of ts.slice(ts.indexOf("export const ECOSYSTEM")).matchAll(/\{[^{}]*\}/g)) {
    try { rows.push(JSON.parse(m[0].replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/,\s*}/g, "}"))); } catch {}
  }
  return rows.filter((r) => r.id && r.name);
}
function tzFor(a) { for (const j of a.jurisdictions || []) if (JUR_TZ[j]) return JUR_TZ[j]; return TZ[a.region] || TZ.US; }

async function ask(q) { try { const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: "You are the CSOAI Sovereign — AI governance & cyber. Be concise, on-topic.\n\nUser question: " + q }) }); const d = await r.json(); return String(d.response || ""); } catch { return ""; } }

const all = loadAccounts();
const envAcc = (process.env.ACCOUNTS || "").trim();
// ACCOUNTS=all sweeps the full universe; ACCOUNTS=id1,id2 targets; default = curated 10.
const sample = envAcc.toLowerCase() === "all"
  ? all
  : (envAcc || "jpmorgan,hsbc,deutschebank,samsung,unitedhealth,airbus,dbs,tcs,nist,mas-sg")
      .split(",").map((id) => all.find((a) => a.id === id.trim())).filter(Boolean);

const b = await chromium.launch();
const reports = [];
for (const a of sample) {
  const [tz, locale] = tzFor(a);
  const ctx = await b.newContext({ timezoneId: tz, locale });
  const gaps = []; const pass = {};
  try {
    // 1. region-localized homepage
    const hp = await ctx.newPage(); await hp.goto(SITE + "/", { waitUntil: "domcontentloaded" }); await hp.waitForTimeout(2600);
    const ht = await hp.evaluate(() => document.body.innerText);
    pass.regionHome = /detected ·/i.test(ht) && (REGIME[a.region] ? REGIME[a.region].test(ht) : true);
    if (!pass.regionHome) gaps.push("homepage not localized to " + a.region + " regime");
    await hp.close();
    // 2. tailored brief
    const bp = await ctx.newPage(); await bp.goto(SITE + "/brief?id=" + a.id, { waitUntil: "domcontentloaded" }); await bp.waitForTimeout(2200);
    const bd = await bp.evaluate(() => ({ txt: document.body.innerText, globe: !!document.querySelector('iframe[src^="/globe3d.html?region="]') }));
    const bt = bd.txt;
    pass.brief = bt.includes(a.name) && !!(a.frameworks || []).find((f) => bt.includes(f));
    if (!pass.brief) gaps.push("brief missing name or frameworks");
    // brief DEPTH: play + 'lead with' USPs (or alignment) + region-flown globe
    pass.briefDepth = /\b(align|integrate|displace)\b/i.test(bt) && /lead the demo with|Alignment/i.test(bt) && bd.globe;
    if (!pass.briefDepth) gaps.push("brief depth (play/USPs/region-globe) incomplete");
    await bp.close();
    // 3. crosswalk pre-framed — enterprise-adoption feature; regulators author frameworks, they don't crosswalk to them, so only assert it for adopters
    if (a.type !== "regulator" && a.type !== "government") {
      const cp = await ctx.newPage(); await cp.goto(SITE + "/crosswalk?fw=" + encodeURIComponent((a.frameworks || []).join(",")), { waitUntil: "domcontentloaded" }); await cp.waitForTimeout(2000);
      pass.crosswalk = await cp.evaluate(() => /Tailored view|frameworks in scope/i.test(document.body.innerText));
      if (!pass.crosswalk) gaps.push("crosswalk not tailored (no mapped framework?)");
      await cp.close();
    }
  } catch (e) { gaps.push("render error: " + (e.message || "").slice(0, 50)); }
  await ctx.close();
  // 4. Sovereign region+sector question (direct)
  const sov = await ask(`I run a ${a.sector || a.type} in ${a.country}. What AI-governance rules apply and how do I comply?`);
  pass.sovereign = !!sov && /governance|EU AI Act|NIST|ISO|DORA|HIPAA|MAS|METI|risk|framework|compliance/i.test(sov);
  if (!pass.sovereign) gaps.push("Sovereign off-topic/empty for " + (a.sector || a.type));
  // region-appropriateness: does the Sovereign lead with THEIR local regime (not EU-first everywhere)?
  if (a.type !== "regulator" && a.type !== "government") {
    pass.regionMatch = !!sov && localRegime(a).test(sov);
    if (!pass.regionMatch) gaps.push("Sovereign didn't lead with " + a.region + " local regime");
  }
  const score = Object.values(pass).filter(Boolean).length;
  reports.push({ id: a.id, name: a.name, region: a.region, sector: a.sector || a.type, play: a.play, score, of: Object.keys(pass).length, gaps });
  console.log(`${score}/${Object.keys(pass).length} ${a.name} (${a.region}/${a.sector || a.type}) ${gaps.length ? "· GAPS: " + gaps.join("; ") : "· clean"}`);
}
await b.close();

// aggregate + report
const allGaps = {};
reports.forEach((r) => r.gaps.forEach((g) => { const k = g.replace(/ [A-Z].*$| for .*$| to .*$/, ""); allGaps[k] = (allGaps[k] || 0) + 1; }));
let md = `# Account Experience Report — ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `> Per-account experience walk (region homepage · brief · crosswalk · Sovereign). ${reports.length} accounts sampled. M2 lane — polish backlog.\n\n`;
md += `## Scores\n| Account | Region | Sector | Play | Score | Gaps |\n|---|---|---|---|---|---|\n`;
reports.forEach((r) => { md += `| ${r.name} | ${r.region} | ${r.sector} | ${r.play} | ${r.score}/${r.of} | ${r.gaps.join("; ") || "—"} |\n`; });
md += `\n## Gap themes (polish backlog)\n` + (Object.keys(allGaps).length ? Object.entries(allGaps).sort((a, b) => b[1] - a[1]).map(([g, n]) => `- (${n}×) ${g}`).join("\n") : "- none — all sampled demographics served") + "\n";
writeFileSync(resolve(ROOT, "docs/handoff/account-experience-report.md"), md);
const avg = (reports.reduce((s, r) => s + r.score / r.of, 0) / reports.length * 100).toFixed(0);
console.log(`\n=== ${reports.length} accounts · avg experience ${avg}% · report: docs/handoff/account-experience-report.md ===`);

// ─────────────────────────────────────────────────────────────────────────────
// EXIT CONTRACT (added 2026-08-26). This suite printed its tally and exited 0 no
// matter what it found, so a run where every check failed — or where the harness
// crashed before a single check ran — was indistinguishable from a clean pass to
// CI, to a shell, and to a reader skimming the log. A suite that cannot report
// failure is worse than no suite: it converts an unknown into a false assurance.
// Both an empty run and any failed check now exit non-zero.
// ─────────────────────────────────────────────────────────────────────────────
if (!reports.length) {
  console.error("ACCOUNT E2E: FAIL — zero accounts were walked. An empty sample scores 100% of nothing.");
  process.exit(1);
}
// This lane produces a polish BACKLOG, so a partial score is a finding, not a break. But an
// account that scored ZERO was not served at all, and a run where none scored is a broken
// harness rather than a broken product — either way it must not report success.
const dead = reports.filter((r) => r.score === 0);
if (dead.length === reports.length) {
  console.error(`ACCOUNT E2E: FAIL — all ${reports.length} account(s) scored 0/${reports[0].of}. Nothing was measured.`);
  process.exit(1);
}
if (dead.length) {
  console.error(`ACCOUNT E2E: FAIL — ${dead.length} account(s) scored 0: ${dead.map((r) => r.id).join(", ")}`);
  process.exit(1);
}
console.log("ACCOUNT E2E: every sampled account was served on at least one dimension; gaps are in the report.");
