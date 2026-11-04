#!/usr/bin/env node
/**
 * build-daily-signal.mjs — the daily bind: regulations × deadlines × measured axes × claims.
 *
 * Joins four REAL artifacts that already exist on disk — never invents a mapping:
 *   1. public/regulatory-clock.json          — dated obligations w/ jurisdiction + confidence + sell note
 *   2. tui3-crosswalk/regulatory-crosswalk-*.json — frameworks → provisions → gspc_axes (the join key)
 *   3. board state (card matrix snapshot, or --board <file>) — MEASURED per axis
 *   4. public/spec/claim-maintenance/register.json — corrections ledger as_of
 *
 * Emits (deterministic, canonical JSON, stable across runs on unchanged inputs):
 *   public/signal/daily/<YYYY-MM-DD>.json   — that day's signal
 *   public/signal/daily/latest.json         — rolling latest
 *
 * NOTE: output lives under public/signal/ (NOT public/reports/) because the axis-reports
 * builder owns and orphan-sweeps the whole public/reports/ tree.
 *
 * Every emitted file carries `as_of`, `inputs` (paths + sha256), and `unmapped` sections
 * that state absences rather than papering over them. No prices, no tiers, no payment-
 * processor names (owner ruling 2026-09-06). Machine access is sold per-call via the live
 * 402 challenge; the rendered artifact on the site is free.
 *
 * Usage:
 *   node scripts/build-daily-signal.mjs                 # write today's signal + latest
 *   node scripts/build-daily-signal.mjs --check         # CI: committed files must match
 *   node scripts/build-daily-signal.mjs --as-of <ISO>   # deterministic rerun (tests)
 *   node scripts/build-daily-signal.mjs --board <file>  # board snapshot JSON ({axis: status})
 *   node scripts/build-daily-signal.mjs --horizon 90    # days-ahead window (default 90)
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLOCK = join(ROOT, "public/regulatory-clock.json");
const CROSSWALK_DIR = join(ROOT, "tui3-crosswalk");
const CLAIMS_REGISTER = join(ROOT, "public/spec/claim-maintenance/register.json");
const OUT_DIR = join(ROOT, "public/signal/daily");

function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
}
const CHECK = process.argv.includes("--check");
const HORIZON = Number(flag("horizon") ?? 90);
const AS_OF = flag("as-of") ?? new Date().toISOString().slice(0, 10);

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const canonical = (o) => JSON.stringify(o, null, 1) + "\n";

function loadJson(p) {
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

function shaOfFile(p) {
  return existsSync(p) ? sha256(readFileSync(p, "utf8")) : null;
}

// ---- inputs --------------------------------------------------------------
const clock = loadJson(CLOCK);
if (!clock) {
  console.error("✗ daily-signal: public/regulatory-clock.json missing — nothing to bind");
  process.exit(1);
}

const crosswalkFiles = readdirSync(CROSSWALK_DIR)
  .filter((f) => f.startsWith("regulatory-crosswalk-") && f.endsWith(".json"))
  .sort();
const crosswalkPath = join(CROSSWALK_DIR, crosswalkFiles[crosswalkFiles.length - 1] ?? "");
const crosswalk = loadJson(crosswalkPath);

let board = null;
const boardFlag = flag("board");
const matrixPath = join(ROOT, "public/signed/card-matrix.json");
if (boardFlag && existsSync(boardFlag)) board = loadJson(boardFlag);
else if (existsSync(matrixPath)) {
  const m = loadJson(matrixPath);
  board = {};
  for (const cell of m.cells ?? []) {
    const axis = (cell.axis ?? "").replace(/^gspc-/, "");
    board[axis] = board[axis] === "MEASURED" || cell.card ? "MEASURED" : board[axis] ?? null;
  }
}

const claimsReg = loadJson(CLAIMS_REGISTER);
const claimsAsOf = claimsReg?.as_of ?? null;
const claimsSubjects = Array.isArray(claimsReg?.subjects) ? claimsReg.subjects.length : null;

// ---- the join ------------------------------------------------------------
const fwIndex = [];
for (const f of crosswalk?.frameworks ?? []) {
  fwIndex.push({ ...f, _short: (f.short_name ?? "").toLowerCase() });
}
function matchFramework(event) {
  const instr = (event.instrument ?? "").toLowerCase();
  if (!instr) return null;
  const hit = fwIndex.find(
    (f) => instr.includes(f._short) || (f.instrument && instr.includes(f.instrument.toLowerCase().slice(0, 24)))
  );
  return hit ?? null;
}

const today = new Date(AS_OF + "T00:00:00Z");
const horizonDate = new Date(today.getTime() + HORIZON * 86400000);
const daysUntil = (date) => Math.round((new Date(date + "T00:00:00Z") - today) / 86400000);

const signals = [];
const unmapped = [];
for (const ev of clock.events ?? []) {
  const du = daysUntil(ev.date);
  if (du < 0 || du > HORIZON) continue;
  const fw = matchFramework(ev);
  const axes = [];
  const provisions = [];
  if (fw) {
    for (const p of fw.provisions ?? []) {
      provisions.push({ id: p.id, title: p.title, effective: p.effective, status: p.status });
      for (const ax of p.gspc_axes ?? []) if (!axes.includes(ax)) axes.push(ax);
    }
  }
  const axisStates = axes.map((ax) => ({
    axis: ax,
    board: board?.[ax] ?? "UNMEASURED",
  }));
  const measured = axisStates.filter((a) => a.board === "MEASURED").length;
  const signal = {
    date: ev.date,
    days_until: du,
    jurisdiction: ev.jur ?? null,
    instrument: ev.instrument ?? null,
    provision: ev.provision ?? null,
    binds: ev.binds ?? null,
    requires: ev.requires ?? null,
    confidence: ev.confidence ?? null,
    framework_matched: fw ? { short_name: fw.short_name ?? null, legal_status: fw.legal_status ?? null, source_url: fw.source_url ?? null } : null,
    gspc_axes: axisStates,
    evidence_coverage: axes.length ? `${measured}/${axes.length} MEASURED` : "UNMAPPED",
    signal: ev.sell ?? null,
    tier: ev.tier ?? null,
  };
  if (fw || axes.length) signals.push(signal);
  else unmapped.push({ date: ev.date, instrument: ev.instrument, reason: "no crosswalk framework match" });
}

const corrections = claimsAsOf
  ? { register_as_of: claimsAsOf, subjects_maintained: claimsSubjects }
  : { register: "absent" };

const inputs = {
  "public/regulatory-clock.json": shaOfFile(CLOCK),
  [`tui3-crosswalk/${crosswalkFiles[crosswalkFiles.length - 1] ?? "none"}`]: shaOfFile(crosswalkPath),
  "public/signed/card-matrix.json": shaOfFile(matrixPath),
  "public/spec/claim-maintenance/register.json": shaOfFile(CLAIMS_REGISTER),
};

const out = {
  schema: "csoai.daily-signal/0.1",
  as_of: AS_OF,
  horizon_days: HORIZON,
  generated_from: inputs,
  headline: {
    obligations_in_horizon: signals.length,
    unmapped_events: unmapped.length,
    axes_measured: Object.values(board ?? {}).filter((s) => s === "MEASURED").length,
    corrections_ledger_as_of: claimsAsOf,
  },
  signals: signals.sort((a, b) => a.days_until - b.days_until),
  unmapped,
  corrections,
  ruling_note: "Rendered copy carries no prices, tiers, or payment-processor names. Machine access to this artifact is sold per-call via the live 402 challenge.",
};

const bytes = canonical(out);
const dayFile = join(OUT_DIR, `${AS_OF}.json`);
const latestFile = join(OUT_DIR, "latest.json");

if (CHECK) {
  const a = existsSync(dayFile) ? readFileSync(dayFile, "utf8") : null;
  const b = existsSync(latestFile) ? readFileSync(latestFile, "utf8") : null;
  if (a === bytes && b === bytes) {
    console.log(`✓ daily-signal --check: current (${signals.length} signals, ${unmapped.length} unmapped)`);
    process.exit(0);
  }
  console.error(`✗ daily-signal --check: committed files do not match a rerun — run node scripts/build-daily-signal.mjs`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(dayFile, bytes);
writeFileSync(latestFile, bytes);
console.log(`✓ daily-signal: ${AS_OF} — ${signals.length} obligations in ${HORIZON}-day horizon, ${unmapped.length} unmapped, evidence coverage per event; wrote ${AS_OF}.json + latest.json`);
