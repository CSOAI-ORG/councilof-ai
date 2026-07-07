#!/usr/bin/env node
// merge-hive-accounts.mjs — reconciles ecosystem.ts (public seed) with the internal SEC lead
// export into one full-coverage account list for hive-recon.mjs.
//
// WHY THIS EXISTS: ecosystem.ts and the internal lead export have grown independently at least
// 3 times this session (each time someone added accounts to ecosystem.ts, the merged internal
// coverage report silently fell out of sync until manually re-merged). This script makes that
// reconciliation a single repeatable command instead of a one-off Python/node script in /tmp.
//
// Usage:
//   node scripts/merge-hive-accounts.mjs <path-to-sec-or-internal-leads.json> <output-path>
//   FORCE=1 HIVE_ACCOUNTS=<output-path> node scripts/hive-recon.mjs   # then update the internal report
//   node scripts/hive-recon.mjs                                       # then refresh the public overlay

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , internalPath, outPath] = process.argv;
if (!internalPath || !outPath) {
  console.error("Usage: node scripts/merge-hive-accounts.mjs <internal-leads.json> <output.json>");
  process.exit(1);
}

const ts = readFileSync(resolve("client/src/data/ecosystem.ts"), "utf8");
const arr = ts.slice(ts.indexOf("export const ECOSYSTEM"));
const rows = [];
for (const m of arr.matchAll(/\{[^{}]*\}/g)) {
  try {
    const json = m[0]
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/,\s*}/g, "}");
    rows.push(JSON.parse(json));
  } catch { /* skip non-account braces (e.g. the type interface) */ }
}
const ecosystemRows = rows.filter((r) => r.id && r.name);
console.log(`ecosystem.ts (public seed): ${ecosystemRows.length} accounts`);

const internalRows = JSON.parse(readFileSync(internalPath, "utf8"));
console.log(`internal leads (${internalPath}): ${internalRows.length} accounts`);

// Dedup by name (case-insensitive) — ecosystem.ts entries win (they're hand-curated/richer).
const ecoNames = new Set(ecosystemRows.map((r) => r.name.toLowerCase()));
const deduped = internalRows.filter((r) => !ecoNames.has(r.name.toLowerCase()));
const dropped = internalRows.length - deduped.length;
if (dropped) console.log(`dropped ${dropped} internal row(s) duplicating an ecosystem.ts account`);

const merged = [...ecosystemRows, ...deduped];
writeFileSync(outPath, JSON.stringify(merged));
console.log(`merged total: ${merged.length} -> ${outPath}`);
console.log(`\nNext: FORCE=1 HIVE_ACCOUNTS=${outPath} node scripts/hive-recon.mjs`);
console.log(`Then: node scripts/hive-recon.mjs   # refreshes the public overlay from ecosystem.ts alone`);
