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
const SITE = "https://www.csoai.org";
const GW = "https://os.meok.ai/api";

// region → emulated timezone/locale (drives the "loads local" detection)
const TZ = { EU: ["Europe/Berlin", "de-DE"], UK: ["Europe/London", "en-GB"], US: ["America/New_York", "en-US"], APAC: ["Asia/Singapore", "en-SG"] };
const JUR_TZ = { jp: ["Asia/Tokyo", "ja-JP"], kr: ["Asia/Seoul", "ko-KR"], cn: ["Asia/Shanghai", "zh-CN"], sg: ["Asia/Singapore", "en-SG"], in: ["Asia/Kolkata", "en-IN"], uk: ["Europe/London", "en-GB"], eu: ["Europe/Berlin", "de-DE"], us: ["America/New_York", "en-US"] };
// region → a regime keyword we expect the localized homepage to surface
const REGIME = { EU: /EU AI Act/i, UK: /UK|principles/i, US: /NIST/i, APAC: /MAS|METI|AI Basic Act|ISO/i };

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

const ids = (process.env.ACCOUNTS || "jpmorgan,hsbc,deutschebank,samsung,unitedhealth,airbus,dbs,tcs,nist,mas-sg").split(",");
const all = loadAccounts();
const sample = ids.map((id) => all.find((a) => a.id === id.trim())).filter(Boolean);

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
    const bt = await bp.evaluate(() => document.body.innerText);
    pass.brief = bt.includes(a.name) && !!(a.frameworks || []).find((f) => bt.includes(f));
    if (!pass.brief) gaps.push("brief missing name or frameworks");
    await bp.close();
    // 3. crosswalk pre-framed
    const cp = await ctx.newPage(); await cp.goto(SITE + "/crosswalk?fw=" + encodeURIComponent((a.frameworks || []).join(",")), { waitUntil: "domcontentloaded" }); await cp.waitForTimeout(2000);
    pass.crosswalk = await cp.evaluate(() => /Tailored view|frameworks in scope/i.test(document.body.innerText));
    if (!pass.crosswalk) gaps.push("crosswalk not tailored (no mapped framework?)");
    await cp.close();
  } catch (e) { gaps.push("render error: " + (e.message || "").slice(0, 50)); }
  await ctx.close();
  // 4. Sovereign region+sector question (direct)
  const sov = await ask(`I run a ${a.sector || a.type} in ${a.country}. What AI-governance rules apply and how do I comply?`);
  pass.sovereign = !!sov && /governance|EU AI Act|NIST|ISO|DORA|HIPAA|MAS|METI|risk|framework|compliance/i.test(sov);
  if (!pass.sovereign) gaps.push("Sovereign off-topic/empty for " + (a.sector || a.type));
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
