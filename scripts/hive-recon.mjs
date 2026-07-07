#!/usr/bin/env node
// hive-recon.mjs — the Distribution Hive per-account TEST harness (§4 fixed rubric).
//
// WHY: Nick's gate — no outreach until the test harness covers the full nameable
// TAM (~2000 leads). This scores CSOAI vs each account's current state on the 7
// fixed axes, assigns a play (align/absorb/integrate/displace), and emits a
// per-account report + an aggregate coverage report. It is DETERMINISTIC and
// asserts honesty invariants (see below), so it doubles as a CI gate.
//
// HONESTY (docs/DISTRIBUTION_HIVE.md §7):
//   - Org-level, public data only. No invented facts.
//   - CSOAI axis scores are sourced to the product/register (constants below).
//   - An account's current-state scores are MODELED from public posture + vendor.
//     Where vendor/posture are "unknown", the row is flagged confidence:"modeled"
//     and NEVER asserted as fact.
//   - A "displace" play is only ever emitted for an account with a KNOWN real
//     competitor vendor — we never fabricate that a company uses Vanta/etc.
//
// INGESTION (scales to 2000): reads client/src/data/ecosystem.ts by default.
//   Point it at JEEVES's full lead export (same schema) via:
//     HIVE_ACCOUNTS=/path/to/leads.json node scripts/hive-recon.mjs
//
// Exit 0 = all assertions pass. Exit 1 = a gate failed.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

// ---- the 7 fixed rubric axes (docs/DISTRIBUTION_HIVE.md §4) ----
const AXES = [
  "frameworkCoverage", // one control set across all in-scope regimes (crosswalk)
  "agenticGovernance", // govern AI agents (cards, oversight, inter-agent risk)
  "verifiableProof",   // signed, reproducible attestations vs screenshots
  "liveTooling",       // tools that actually run, not a dashboard
  "enforcementTiming", // ready for the next deadline (countdown)
  "sovereignty",       // own your data + models
  "integrationEffort", // one command (MCP) vs a project
];

// CSOAI capability per axis (0-3). Sourced to the live product + ground-truth
// register: 13-framework crosswalk, agent cards/council/Article 50, live Ed25519
// (sig len=128), 378 executing tools, live countdowns, MIT self-host, 1-cmd MCP.
const CSOAI = {
  frameworkCoverage: 3, agenticGovernance: 3, verifiableProof: 3, liveTooling: 3,
  enforcementTiming: 3, sovereignty: 3, integrationEffort: 3,
};

// Known competitor current-state profile per axis (0-3), MODELED from the CITED
// battlecards in client/src/data/competitors.ts. Conservative; where a card gives
// them a genuine strength we score it fairly high (no fabricated weaknesses).
const VENDOR_PROFILE = {
  // Vanta: SOC2/ISO strong; AI-Act docs, agentic-native, signed-proof, sovereignty weak.
  vanta:    { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 2, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  drata:    { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 2, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  "credo-ai":{ frameworkCoverage: 2, agenticGovernance: 2, verifiableProof: 1, liveTooling: 1, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  onetrust: { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 1, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  internal: { frameworkCoverage: 1, agenticGovernance: 1, verifiableProof: 1, liveTooling: 1, enforcementTiming: 1, sovereignty: 2, integrationEffort: 1 },
};
const KNOWN_VENDORS = new Set(Object.keys(VENDOR_PROFILE));
// Only COMMERCIAL competitors are "displace" (rip-and-replace). An internal stack is
// "integrate" (CSOAI is the governance layer UNDER it) — never a displace claim.
const COMMERCIAL_VENDORS = new Set(["vanta", "drata", "credo-ai", "onetrust"]);

// Posture → baseline current-state when no known vendor (MODELED, low-confidence).
const POSTURE_BASE = {
  none:     { frameworkCoverage: 0, agenticGovernance: 0, verifiableProof: 0, liveTooling: 0, enforcementTiming: 0, sovereignty: 1, integrationEffort: 0 },
  emerging: { frameworkCoverage: 1, agenticGovernance: 0, verifiableProof: 0, liveTooling: 1, enforcementTiming: 1, sovereignty: 1, integrationEffort: 0 },
  mature:   { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 1, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  unknown:  { frameworkCoverage: 1, agenticGovernance: 0, verifiableProof: 0, liveTooling: 1, enforcementTiming: 1, sovereignty: 1, integrationEffort: 0 },
};

// jurisdiction → regimes in scope (used to backfill frameworks when a row is sparse).
const JURIS_REGIMES = {
  eu: ["eu-ai-act", "gdpr", "dora", "nis2", "cra"],
  us: ["nist-ai-rmf", "us-state-ai"],
  uk: ["uk-principles", "gdpr-uk"],
  sg: ["mas-feat", "iso-42001"],
  kr: ["kr-basic-ai-act"],
  cn: ["tc260", "cn-genai"],
  ca: ["canada-aida"],
};

// sector → sector-specific regimes (merged with jurisdiction regimes). Keyed on an
// optional `sector` field — the ingestion contract for JEEVES's lead export.
const SECTOR_REGIMES = {
  banking:   ["dora", "eu-ai-act", "basel-ai", "nis2"],
  insurance: ["dora", "eu-ai-act", "eiopa-ai", "nis2"],
  finance:   ["dora", "eu-ai-act", "nis2"],
  health:    ["eu-ai-act-highrisk", "hipaa", "mdr-ai", "iso-42001"],
  pharma:    ["eu-ai-act-highrisk", "gxp-ai", "iso-42001"],
  defence:   ["nis2", "eu-ai-act", "nato-ai", "itar-ear"],
  "ai-lab":  ["eu-ai-act-gpai", "frontier-safety", "iso-42001"],
  telecom:   ["nis2", "cra", "eu-ai-act"],
  energy:    ["nis2", "cra", "eu-ai-act"],
  publicsector: ["eu-ai-act-highrisk", "nis2", "iso-42001"],
};

// ---- load accounts (ecosystem.ts by default; JSON export via HIVE_ACCOUNTS) ----
function loadAccounts() {
  const ext = process.env.HIVE_ACCOUNTS;
  if (ext) {
    const rows = JSON.parse(readFileSync(ext, "utf8"));
    return { rows: Array.isArray(rows) ? rows : rows.accounts || [], src: ext };
  }
  const ts = readFileSync(resolve(ROOT, "client/src/data/ecosystem.ts"), "utf8");
  const arr = ts.slice(ts.indexOf("export const ECOSYSTEM"));
  const rows = [];
  for (const m of arr.matchAll(/\{[^{}]*\}/g)) {
    try {
      const json = m[0]
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":') // quote keys
        .replace(/,\s*}/g, "}");
      rows.push(JSON.parse(json));
    } catch { /* skip non-account braces */ }
  }
  return { rows: rows.filter((r) => r.id && r.name), src: "client/src/data/ecosystem.ts" };
}

// ---- score one account ----
function scoreAccount(a) {
  const posture = a.posture || "unknown";
  const vendor = (a.currentVendor || "unknown").toLowerCase();
  // Frameworks in scope = explicit row value, else derived from jurisdiction + sector.
  const derived = [
    ...(a.jurisdictions || []).flatMap((j) => JURIS_REGIMES[j] || []),
    ...(a.sector ? (SECTOR_REGIMES[String(a.sector).toLowerCase()] || []) : []),
  ];
  const frameworks = (a.frameworks && a.frameworks.length)
    ? [...new Set([...a.frameworks, ...(a.sector ? (SECTOR_REGIMES[String(a.sector).toLowerCase()] || []) : [])])]
    : [...new Set(derived)];

  // Regulators/governments AUTHOR the rules → the "test" is IMPLEMENTATION coverage,
  // not gap-selling. Play = align; we measure that CSOAI implements their framework.
  const isAuthority = posture === "sets-rules" || a.type === "regulator" || a.type === "government";

  let current, confidence, play;
  if (isAuthority) {
    // Not a displace/absorb target — alignment coverage of their own regime.
    current = null;
    confidence = "n/a-authority";
    play = "align";
  } else if (KNOWN_VENDORS.has(vendor)) {
    current = VENDOR_PROFILE[vendor];
    confidence = "verified"; // vendor is a public/known fact for this row
    play = COMMERCIAL_VENDORS.has(vendor) ? "displace" : "integrate"; // internal stack → integrate under, not displace
  } else {
    current = POSTURE_BASE[posture] || POSTURE_BASE.unknown;
    confidence = "modeled"; // no known vendor → current state is a conservative model
    play = posture === "none" ? "absorb" : "integrate";
  }

  const perAxis = {};
  let totalGap = 0;
  for (const ax of AXES) {
    const csoai = CSOAI[ax];
    const cur = current ? current[ax] : csoai; // authority: assume parity (we implement them)
    const gap = Math.max(0, csoai - cur);
    perAxis[ax] = { csoai, current: cur, gap };
    totalGap += gap;
  }
  // Top USPs = axes with the biggest gap (what to lead the demo with).
  const topUsps = AXES.filter((ax) => perAxis[ax].gap > 0)
    .sort((x, y) => perAxis[y].gap - perAxis[x].gap).slice(0, 3);

  return { id: a.id, name: a.name, type: a.type, region: a.region, country: a.country,
    hq: a.hq || null, jurisdictions: a.jurisdictions || [], frameworks, posture, vendor,
    play, confidence, totalGap, maxGap: AXES.length * 3, perAxis, topUsps,
    source: a.source || null };
}

// ---- run ----
const { rows, src } = loadAccounts();
const reports = rows.map(scoreAccount);

// aggregate
const byPlay = {};
const byType = {};
const byConfidence = {};
let gapSum = 0;
for (const r of reports) {
  byPlay[r.play] = (byPlay[r.play] || 0) + 1;
  byType[r.type] = (byType[r.type] || 0) + 1;
  byConfidence[r.confidence] = (byConfidence[r.confidence] || 0) + 1;
  gapSum += r.totalGap;
}
const summary = {
  generated: new Date().toISOString().slice(0, 10),
  source: src,
  accounts: reports.length,
  byPlay, byType, byConfidence,
  avgGap: reports.length ? +(gapSum / reports.length).toFixed(2) : 0,
  dataCompleteness: {
    verifiedOrAuthority: (byConfidence["verified"] || 0) + (byConfidence["n/a-authority"] || 0),
    modeled: byConfidence["modeled"] || 0,
    note: "modeled rows need per-account recon (public web) to fill currentVendor+posture with cited facts before outreach",
  },
};

// ---- ASSERTIONS (the gate) ----
const fails = [];
for (const r of reports) {
  if (!r.frameworks.length) fails.push(`${r.id}: no in-scope frameworks (bad jurisdiction/sector data)`);
  for (const ax of AXES) {
    const v = r.perAxis[ax];
    if ([v.csoai, v.current, v.gap].some((n) => typeof n !== "number" || Number.isNaN(n) || n < 0 || n > 3 && ax !== "gap"))
      fails.push(`${r.id}: axis ${ax} out of range`);
  }
  // HONESTY GATE: never "displace" without a known real vendor.
  if (r.play === "displace" && !COMMERCIAL_VENDORS.has(r.vendor))
    fails.push(`${r.id}: HONESTY VIOLATION — displace play without a known COMMERCIAL vendor`);
  if (!["align", "absorb", "integrate", "displace"].includes(r.play))
    fails.push(`${r.id}: invalid play ${r.play}`);
}
// determinism: re-run scoring, must match
const rerun = JSON.stringify(rows.map(scoreAccount));
if (rerun !== JSON.stringify(reports)) fails.push("non-deterministic scoring");

// ---- output ----
const outDir = resolve(ROOT, "docs");
const reportPath = resolve(outDir, "hive-recon-report.json");

// REGRESSION GUARD: docs/hive-recon-report.json tracks the outreach-gate coverage number
// (Nick's rule: "no outreach until the harness covers the full ~2000-lead TAM"). A run against
// the default ecosystem.ts-only set (27/39 accounts) must never silently clobber a prior run
// that covered more accounts -- that happened twice (2026-07-07, fixed) when commits that only
// meant to touch ecosystem.ts / the public overlay ran the default path and dropped the internal
// coverage number. Refuse to overwrite the INTERNAL report unless FORCE=1 or accounts didn't
// shrink -- but this must NOT block the public overlay refresh below, which is an independent,
// always-safe, public-only artifact (a default-path run is often exactly how ecosystem.ts edits
// are meant to reach the public overlay). Learned the hard way: the first version of this guard
// called process.exit(1) here, which also skipped the public-overlay write further down --
// silently leaving public/hive-coverage.json stale after legitimate ecosystem.ts edits.
let skipInternalReportWrite = false;
try {
  const prev = JSON.parse(readFileSync(reportPath, "utf8"));
  const prevN = prev?.summary?.accounts ?? 0;
  if (summary.accounts < prevN && !process.env.FORCE) {
    console.error(`\n⚠️  SKIPPING internal report write (${reportPath}): this run scored`);
    console.error(`   ${summary.accounts} accounts, but it already covers ${prevN}. Continuing to`);
    console.error(`   refresh the PUBLIC overlay only (safe, always-current). To also update the`);
    console.error(`   internal outreach-gate number, re-run with the full export:`);
    console.error(`   HIVE_ACCOUNTS=docs/handoff/hive_full_export_1952.json npm run hive:recon\n`);
    skipInternalReportWrite = true;
  }
} catch { /* no prior report — first run, nothing to guard */ }

if (!skipInternalReportWrite) {
  writeFileSync(reportPath, JSON.stringify({ summary, reports }, null, 2));
}

// Public coverage overlay for the globe (Hive §5) — PUBLIC seed ONLY. When the internal
// lead export is scored (HIVE_ACCOUNTS set), we do NOT write to public/ (boundary guard).
if (!process.env.HIVE_ACCOUNTS) {
  const coverage = reports.filter((r) => Array.isArray(r.hq) && r.hq.length === 2).map((r) => ({
    id: r.id, name: r.name, type: r.type, region: r.region, country: r.country,
    hq: r.hq, play: r.play, gap: r.totalGap, maxGap: r.maxGap, confidence: r.confidence,
    topUsp: r.topUsps[0] || null,
  }));
  writeFileSync(resolve(ROOT, "public/hive-coverage.json"),
    JSON.stringify({ generated: summary.generated, note: "public seed — org-level, cited; internal leads excluded", accounts: coverage.length, coverage }, null, 2));
  console.log(`Public overlay: public/hive-coverage.json (${coverage.length} pins)`);
}

console.log(`\n# Distribution Hive — recon/scoring test  (source: ${src})\n`);
console.log(`Accounts scored : ${summary.accounts}`);
console.log(`By play         : ${Object.entries(byPlay).map(([k, v]) => `${k}=${v}`).join("  ")}`);
console.log(`By confidence   : ${Object.entries(byConfidence).map(([k, v]) => `${k}=${v}`).join("  ")}`);
console.log(`Avg CSOAI gap   : ${summary.avgGap} / ${AXES.length * 3}`);
console.log(`Coverage        : ${summary.dataCompleteness.verifiedOrAuthority} verified/authority · ${summary.dataCompleteness.modeled} modeled (need recon)`);
console.log(`\nSample (first 3 non-authority):`);
for (const r of reports.filter((x) => x.play !== "align").slice(0, 3)) {
  console.log(`  · ${r.name} → play=${r.play} (${r.confidence}), gap=${r.totalGap}/${r.maxGap}, lead-with: ${r.topUsps.join(", ") || "n/a"}`);
}
console.log(skipInternalReportWrite
  ? `\ndocs/hive-recon-report.json: NOT written (would regress coverage — see warning above)`
  : `\nReport written: docs/hive-recon-report.json`);

if (fails.length) {
  console.log(`\n❌ ${fails.length} GATE FAILURE(S):`);
  fails.slice(0, 20).forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log(`\n✅ ALL GATES PASS — ${summary.accounts} accounts scored, honesty invariants hold, deterministic.`);
console.log(`   Outreach gate: ready to ingest the full lead export via HIVE_ACCOUNTS=<leads.json>.`);
