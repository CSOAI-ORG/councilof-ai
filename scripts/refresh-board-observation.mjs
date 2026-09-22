#!/usr/bin/env node
/**
 * refresh-board-observation — the ONE producer of
 * client/src/data/facts.json -> counts.axis_count.observed.
 *
 * That block is a RECORDED OBSERVATION of GET /api/gspc totals, not an authority:
 * it exists so a surface that has not yet received the fetch renders the last
 * observed state (dated, `live: false`) instead of a zero — and so no shipped
 * file types a board number by hand. Until 2026-09-22 the block was hand-edited,
 * which is exactly how it sat at "22 axes · 22 measured" for six days after the
 * board moved to 23 (drift-draft D-2026-09-22T14-01..03). A number a script
 * reads off the endpoint cannot be typed wrong; a number a person copies can.
 *
 * Every field is copied VERBATIM from totals; nothing is composed here. The lid,
 * public_count and the four counts are the endpoint's own derived strings and
 * integers (functions/api/gspc.ts), covered by the board signature.
 *
 * Usage:
 *   node scripts/refresh-board-observation.mjs            # rewrite the block from the live endpoint
 *   node scripts/refresh-board-observation.mjs --check    # exit 1 if the block disagrees with live
 *   node scripts/refresh-board-observation.mjs --from <gspc.json>   # read a saved response instead
 *
 * Measurement, not certification. UNMEASURED stays first-class: unmeasured_axes is
 * copied as published, never clamped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FACTS_PATH = resolve(REPO, "client/src/data/facts.json");

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const fromIdx = args.indexOf("--from");
const FROM = fromIdx >= 0 ? args[fromIdx + 1] : null;

/** The totals fields this observation records, and what each one is. */
const OBSERVED_FIELDS = [
  ["value", "public_count", "string"],
  ["axes", "axes", "number"],
  ["measured_axes", "measured_axes", "number"],
  ["unmeasured_axes", "unmeasured_axes", "number"],
  ["quotable_axes", "quotable_axes", "number"],
  ["public_leader_count", "public_leader_count", "number"],
  ["model_fleets", "model_fleets", "number"],
  ["fact_runs", "fact_runs", "number"],
  ["items", "items", "number"],
  ["lid", "lid", "string"],
];

const facts = JSON.parse(readFileSync(FACTS_PATH, "utf8"));
const axisCount = facts?.counts?.axis_count;
if (!axisCount?.endpoint) {
  console.error("refresh-board-observation: facts.json has no counts.axis_count.endpoint");
  process.exit(2);
}

async function loadTotals() {
  if (FROM) return JSON.parse(readFileSync(resolve(FROM), "utf8"))?.totals;
  const r = await fetch(axisCount.endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!r.ok || !(r.headers.get("content-type") || "").includes("application/json")) {
    throw new Error(`board endpoint unavailable (HTTP ${r.status}); no historical fallback`);
  }
  return (await r.json())?.totals;
}

const totals = await loadTotals();
if (!totals || typeof totals.axes !== "number" || typeof totals.measured_axes !== "number") {
  console.error("refresh-board-observation: response carries no totals.axes / totals.measured_axes");
  process.exit(2);
}

const next = {};
for (const [key, src, type] of OBSERVED_FIELDS) {
  const v = totals[src];
  if (typeof v === type && (type !== "string" || v.trim())) next[key] = type === "string" ? v.trim() : v;
}
const prev = axisCount.observed ?? {};

const drift = OBSERVED_FIELDS.map(([k]) => k).filter((k) => k in next && prev[k] !== next[k]);

if (CHECK) {
  if (drift.length) {
    console.error(`refresh-board-observation --check: observed block disagrees with ${axisCount.endpoint} on ${drift.length} field(s):`);
    for (const k of drift) console.error(`  ${k}: recorded ${JSON.stringify(prev[k])} -> live ${JSON.stringify(next[k])}`);
    console.error("  run: node scripts/refresh-board-observation.mjs");
    process.exit(1);
  }
  console.log(`refresh-board-observation --check OK: observed block (observed_at ${prev.observed_at}) agrees with the endpoint.`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
axisCount.observed = {
  ...next,
  observed_at: today,
  binding: false,
  producer: "scripts/refresh-board-observation.mjs — every field is copied verbatim from the endpoint's totals; never hand-edited.",
  note:
    "Observation only, recorded so a surface that has not yet fetched the board can render the last observed " +
    "state, dated, and so the gate can detect drift. If this disagrees with the endpoint, the ENDPOINT wins " +
    "and this block is stale: run `node scripts/refresh-board-observation.mjs` (or `--check` to fail on drift). " +
    "The slot count and the measured count are different kinds and travel together; quote `value` " +
    "(totals.public_count) or `lid`, never one integer alone.",
};

writeFileSync(FACTS_PATH, JSON.stringify(facts, null, 2) + "\n");
if (drift.length) {
  console.log(`refresh-board-observation: rewrote observed block (observed_at ${today}); ${drift.length} field(s) moved:`);
  for (const k of drift) console.log(`  ${k}: ${JSON.stringify(prev[k])} -> ${JSON.stringify(next[k])}`);
} else {
  console.log(`refresh-board-observation: observed block already agreed with the endpoint; re-dated observed_at ${today}.`);
}
