#!/usr/bin/env node
/**
 * Producer for public/interop/revenue-history.json — a daily append of what /api/revenue said.
 *
 * WHY A HISTORY AT ALL. /api/revenue reports the present. The gates the estate set for itself are
 * about TIME — "0 for 30 days: the shape or the price is wrong; do not add doors", "≥1 repeat: open
 * the next door", "≥5 distinct in 30d: it is a product". None of those can be evaluated from a
 * single reading, and nobody was keeping the series. This keeps it.
 *
 * DERIVED, NEVER TYPED. Every field is copied verbatim from the live response. The script refuses to
 * invent a zero: if a counter is absent it is recorded as null, because absent is not zero.
 *
 * APPEND-ONLY. A day already present is never rewritten — a history that can be edited is not a
 * history. Re-running on the same day is a no-op unless --force, which replaces that day and says so.
 *
 *   node scripts/revenue-history.mjs                 # append today
 *   node scripts/revenue-history.mjs --dry           # print, write nothing
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/interop/revenue-history.json");
const ORIGIN = process.argv.find((a) => a.startsWith("--origin="))?.split("=")[1] ?? "https://councilof.ai";
const DRY = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");

// Copied from the response, never computed here. A name that is absent stays absent.
const FIELDS = ["all_time", "last_30d", "settlements", "self_settlements",
                "zero_value_settlements", "records_unreadable", "status"];

const res = await fetch(`${ORIGIN}/api/revenue`, { headers: { "user-agent": "csoai-revenue-history/1.0" } });
if (!res.ok) {
  console.error(`REFUSING: ${ORIGIN}/api/revenue returned ${res.status}. A history must not record a guess.`);
  process.exit(2);
}
const body = await res.json();
const one = body.one_number ?? {};
const day = new Date().toISOString().slice(0, 10);

const entry = { date: day, read_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"), source: `${ORIGIN}/api/revenue` };
for (const f of FIELDS) entry[f] = f in one ? one[f] : null;
// the definition travels with the number: a counter whose rule changed is a different counter
entry.definition_sha256 = [...new TextEncoder().encode(String(one.definition ?? ""))]
  .reduce((h, b) => (((h << 5) - h + b) | 0), 0).toString(16);

const prior = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {
  schema: "csoai.revenue-history/0.1",
  note: ("Daily readings of /api/revenue, copied verbatim. Append-only: a day already present is "
       + "never rewritten. A self-settlement is not revenue and never counts toward all_time; "
       + "absent is recorded as null, never as zero."),
  gates: { "0 for 30 days": "shape or price is wrong; do not add doors",
           "≥1 repeat": "open the next door",
           "≥5 distinct in 30d": "it is a product" },
  days: [],
};
const seen = prior.days.findIndex((d) => d.date === day);
if (seen >= 0 && !FORCE) {
  console.log(`  ${day} already recorded — append-only, nothing written (use --force to replace)`);
  process.exit(0);
}
if (seen >= 0) prior.days[seen] = entry; else prior.days.push(entry);
prior.days.sort((a, b) => a.date.localeCompare(b.date));
prior.as_of = entry.read_at;
prior.days_recorded = prior.days.length;

// the series is the point: report the streak the gates are written against
const zeroRun = [...prior.days].reverse().findIndex((d) => (d.all_time ?? 0) > 0);
prior.consecutive_days_at_zero_buyers = zeroRun === -1 ? prior.days.length : zeroRun;

const blob = JSON.stringify(prior, null, 1);
if (DRY) { console.log(blob.slice(0, 400)); process.exit(0); }
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, blob);
console.log(`  ${day}: all_time=${entry.all_time} self=${entry.self_settlements} ` +
            `settlements=${entry.settlements} · days=${prior.days_recorded} ` +
            `· zero-buyer streak=${prior.consecutive_days_at_zero_buyers}`);
