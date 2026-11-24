#!/usr/bin/env node
/**
 * build-control-room-series — collects the dated files already in the repo into ONE small raw file
 * for the /status control-room strip: public/interop/control-room/series.json.
 *
 * It reads only:
 *   public/interop/silent-route-canary-2026-09/baseline.jsonl   (one row per endpoint per day)
 *   public/interop/watchdog-intake/<run>.json                    (one file per run)
 *   public/interop/x402-trust/<round>.json                       (one file per round)
 * It keeps each file's own values verbatim. It does no smoothing, no rounding, no filling of gaps and
 * no arithmetic. A file it cannot read is listed under `skipped`, never dropped silently or zeroed.
 * It signs nothing and measures nothing; the series is a copy of dated files, with their paths.
 *
 * The site build writes the file itself (the csoai-control-room-series step in client/vite.config.ts),
 * which keeps package.json, and so the dependency inventory made from it, unchanged.
 *
 *   node scripts/build-control-room-series.mjs            write the file
 *   node scripts/build-control-room-series.mjs --check    exit 1 if the file on disk is out of date
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA = "csoai.control-room-series/0.1";
const CANARY = "public/interop/silent-route-canary-2026-09/baseline.jsonl";
const WATCHDOG_DIR = "public/interop/watchdog-intake";
const X402_DIR = "public/interop/x402-trust";
const OUT = "public/interop/control-room/series.json";

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
/** Round files are named by date or by timestamp; latest.json, index.html and v2-* are not rounds. */
const ROUND_NAME = /^(\d{4}-\d{2}-\d{2}|\d{8}T\d{6}Z)\.json$/;

export function collectCanary(text, skipped = []) {
  const rows = [];
  text.split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const r = JSON.parse(line);
      if (typeof r.date === "string" && typeof r.endpoint_id === "string" && typeof r.status === "string") {
        rows.push({ date: r.date, endpoint_id: r.endpoint_id, status: r.status });
      } else skipped.push({ path: CANARY, line: i + 1, reason: "row lacks date, endpoint_id or status" });
    } catch {
      skipped.push({ path: CANARY, line: i + 1, reason: "row is not JSON" });
    }
  });
  return rows;
}

export function collectWatchdog(file, doc) {
  const t = doc && doc.totals;
  if (!t || !isNum(t.sources_probed) || !isNum(t.reachable) || typeof doc.as_of !== "string") return null;
  return {
    path: `/interop/watchdog-intake/${file}`,
    as_of: doc.as_of,
    sources_probed: t.sources_probed,
    reachable: t.reachable,
    unreachable: isNum(t.unreachable) ? t.unreachable : null,
    uncheckable: isNum(t.uncheckable) ? t.uncheckable : null,
  };
}

export function collectX402(file, doc) {
  const c = doc && doc.counts;
  if (!c || typeof c !== "object" || typeof doc.as_of !== "string") return null;
  const counts = {};
  for (const [k, v] of Object.entries(c)) if (isNum(v)) counts[k] = v;
  return { path: `/interop/x402-trust/${file}`, as_of: doc.as_of, counts };
}

export function collectSeries(root) {
  const skipped = [];
  const canaryPath = join(root, CANARY);
  const canary = existsSync(canaryPath) ? collectCanary(readFileSync(canaryPath, "utf8"), skipped) : [];
  if (!existsSync(canaryPath)) skipped.push({ path: CANARY, reason: "file missing" });
  const rounds = (dir, fn) => {
    const out = [];
    for (const f of readdirSync(join(root, dir)).filter((n) => ROUND_NAME.test(n)).sort()) {
      try {
        const v = fn(f, readJson(join(root, dir, f)));
        if (v) out.push(v);
        else skipped.push({ path: `${dir}/${f}`, reason: "file lacks the fields this series reads" });
      } catch {
        skipped.push({ path: `${dir}/${f}`, reason: "file is not JSON" });
      }
    }
    return out.sort((a, b) => a.as_of.localeCompare(b.as_of));
  };
  return {
    schema: SCHEMA,
    note: "A copy of dated files in this repository, values verbatim. No smoothing, no rounding, no gap filling. Not a score. Measurement, not certification.",
    sources: { canary: `/${CANARY.replace("public/", "")}`, watchdog_intake: "/interop/watchdog-intake/", x402_trust: "/interop/x402-trust/" },
    canary: canary.sort((a, b) => a.date.localeCompare(b.date) || a.endpoint_id.localeCompare(b.endpoint_id)),
    watchdog_runs: rounds(WATCHDOG_DIR, collectWatchdog),
    x402_rounds: rounds(X402_DIR, collectX402),
    skipped,
  };
}

/** The exact text of the series file for this checkout. */
export function seriesText(root) {
  return JSON.stringify(collectSeries(root), null, 1) + "\n";
}

/** Writes the series file under `root` and returns its repo-relative path. The site build calls this
 *  (client/vite.config.ts) just before the public folder is copied, so the deployed history is the
 *  dated files of that build. */
export function writeSeries(root) {
  const out = join(root, OUT);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, seriesText(root));
  return OUT;
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(here, "..");
  if (process.argv.includes("--check")) {
    const out = join(root, OUT);
    const ok = existsSync(out) && readFileSync(out, "utf8") === seriesText(root);
    console.log(ok ? "control-room series is current" : "control-room series is out of date: run node scripts/build-control-room-series.mjs");
    process.exit(ok ? 0 : 1);
  }
  console.log(`wrote ${writeSeries(root)}`);
}
