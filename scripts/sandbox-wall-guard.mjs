#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 CSOAI
/**
 * sandbox-wall-guard.mjs: the hard wall between the SovSpace sandbox (proofof.ai) and councilof.ai.
 *
 * Owner rulings, 26 and 28 Sep 2026: every measurement capsule and every claim event gets an equal and opposite
 * reaction in the sandbox. The reaction is a set of predictions, committed before the outcome and scored later.
 * Those records are PREDICTED, never measured, and they never appear on a councilof.ai measurement surface. This
 * gate refuses a build, or a source tree, that carries one.
 *
 *   node scripts/sandbox-wall-guard.mjs [--json] DIR...     scan (deploy: dist/client functions)
 *   node scripts/sandbox-wall-guard.mjs --selftest          plant every marker in a temp dir; each must be caught
 *
 * Refused, in any text file under DIR:
 *   SANDBOX_SCHEMA     any csoai.sov-<name>/<version> schema id except the measurement-side Sov Signal index
 *                      (csoai.sov-signal-index/...). That covers sov-reaction, sov-claim-reaction,
 *                      sov-prediction-commit(-head), sov-score, sov-claim-score, sov-calibration and
 *                      sov-claim-scoreboard, and any sandbox schema added later, by pattern.
 *   SANDBOX_PREDICTOR  a SovSpace predictor id (climatology-hier/..., persistence-laplace/...).
 *   SANDBOX_KEY        the sandbox twin signing key (did:web:proofof.ai#twin-run-...).
 *   SANDBOX_DATA_URL   a data file read from the sandbox host: https://proofof.ai/... ending .json, .jsonl, .ndjson,
 *                      .csv or .gz, or under /towns, /sov, /reactions, /scores, /scoreboard or /api/.
 *                      A plain link to https://proofof.ai is not data and is allowed.
 *
 * KNOWN exceptions are exact strings with a reason. Each one found is reported on every run, never silently, and
 * an exception listed here but no longer present is reported as stale. Exit 0 clean, 1 refused, 2 usage or selftest.
 */
import { readdirSync, readFileSync, statSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

export const RULES = [
  { rule: "SANDBOX_SCHEMA", re: /csoai\.sov-(?!signal-index\/)[a-z0-9]+(?:-[a-z0-9]+)*\/\d[\w.]*/g },
  { rule: "SANDBOX_PREDICTOR", re: /\b(?:climatology-hier|persistence-laplace)\/\d[\w.]*/g },
  { rule: "SANDBOX_KEY", re: /did:web:proofof\.ai#twin-run[\w-]*/g },
];
const URL_RE = /https?:\/\/(?:www\.)?proofof\.ai(?:\/[A-Za-z0-9._~%\/-]*)?/g;
const DATA_EXT = /\.(?:json|jsonl|ndjson|csv|gz)$/i;
const DATA_PATH = /^\/(?:towns|sov|reactions|scores|scoreboard|api)(?:[\/._-]|$)/i;

// Exact strings, with why each is tolerated. Record NAMES, never a count.
export const KNOWN = new Map([
  ["https://proofof.ai/towns/status.json",
    "LEGACY_TOWN_FEED: client/src/pages/ComplianceCommandCenter.tsx reads Council Town simulation counters from the " +
    "sandbox host. It predates the wall (28 Sep 2026). Owner decision pending: remove it, or move the page off councilof.ai."],
  ["https://proofof.ai/towns",
    "LEGACY_TOWN_FEED: client/src/data/sov-town-data.ts (Council Town page) reads town fleet files from the sandbox " +
    "host. It predates the wall (28 Sep 2026). Owner decision pending, as above."],
]);

const TEXT_EXT = new Set([".html", ".htm", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".jsonl", ".ndjson",
  ".txt", ".md", ".xml", ".svg", ".css", ".csv", ".yaml", ".yml", ".webmanifest", ".map", ".toml", ""]);
const TEXT_NAMES = new Set(["_redirects", "_headers", "_routes.json"]);
const SKIP_DIRS = new Set(["node_modules", ".git"]);
const MAX_BYTES = 64 * 1024 * 1024;

function* walk(dir) {
  let ents;
  try {
    ents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(p);
    } else if (e.isFile()) {
      yield p;
    }
  }
}

function isText(p) {
  const n = basename(p);
  return TEXT_NAMES.has(n) || TEXT_EXT.has(extname(n).toLowerCase());
}

export function scanText(text) {
  const hits = [];
  for (const { rule, re } of RULES) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) hits.push({ rule, match: m[0], index: m.index });
  }
  URL_RE.lastIndex = 0;
  for (const m of text.matchAll(URL_RE)) {
    const url = m[0].replace(/[.)]+$/, "");
    const path = url.replace(/^https?:\/\/(?:www\.)?proofof\.ai/, "");
    if (DATA_EXT.test(path) || DATA_PATH.test(path)) hits.push({ rule: "SANDBOX_DATA_URL", match: url, index: m.index });
  }
  return hits;
}

export function scan(dirs) {
  const violations = [];
  const known = new Map();
  let files = 0;
  for (const d of dirs) {
    let st;
    try {
      st = statSync(d);
    } catch {
      throw new Error(`no such directory: ${d}`);
    }
    const list = st.isDirectory() ? walk(d) : [d];
    for (const p of list) {
      if (!isText(p)) continue;
      let s;
      try {
        if (statSync(p).size > MAX_BYTES) continue;
        s = readFileSync(p, "utf8");
      } catch {
        continue;
      }
      files++;
      if (!/sov-|proofof|climatology-hier|persistence-laplace/.test(s)) continue;
      for (const h of scanText(s)) {
        const line = s.slice(0, h.index).split("\n").length;
        const where = `${relative(process.cwd(), p) || p}:${line}`;
        if (KNOWN.has(h.match)) {
          if (!known.has(h.match)) known.set(h.match, []);
          known.get(h.match).push(where);
        } else {
          violations.push({ ...h, where });
        }
      }
    }
  }
  return { files, violations, known };
}

function selftest() {
  const root = mkdtempSync(join(tmpdir(), "sandbox-wall-"));
  const plant = {
    "a/reaction.json": ['{"schema":"csoai.sov-reaction/0.1"}', "SANDBOX_SCHEMA"],
    "a/claim.jsonl": ['{"schema":"csoai.sov-claim-reaction/0.1"}\n', "SANDBOX_SCHEMA"],
    "b/commit.html": ["<pre>csoai.sov-prediction-commit/0.1</pre>", "SANDBOX_SCHEMA"],
    "b/board.js": ['const s="csoai.sov-claim-scoreboard/0.1";', "SANDBOX_SCHEMA"],
    "c/future.json": ['{"schema":"csoai.sov-something-new/2"}', "SANDBOX_SCHEMA"],
    "c/pred.txt": ["predictor climatology-hier/0.2", "SANDBOX_PREDICTOR"],
    "c/legacy.md": ["persistence-laplace/0.1", "SANDBOX_PREDICTOR"],
    "d/key.json": ['{"kid":"did:web:proofof.ai#twin-run-1"}', "SANDBOX_KEY"],
    "d/fetch.tsx": ['fetch("https://proofof.ai/sovspace/latest.json")', "SANDBOX_DATA_URL"],
    "d/api.ts": ['const u = "https://proofof.ai/api/claims/scoreboard";', "SANDBOX_DATA_URL"],
    "e/_redirects": ["/x https://proofof.ai/scores/2026-09-29.jsonl 302", "SANDBOX_DATA_URL"],
  };
  const clean = {
    "ok/signal.json": '{"schema":"csoai.sov-signal-index/1"}',
    "ok/link.html": '<a href="https://proofof.ai">proofof.ai</a> and https://proofof.ai/ and https://www.proofof.ai/receipt',
    "ok/known.tsx": 'fetch("https://proofof.ai/towns/status.json")',
    "ok/logo.png": "csoai.sov-reaction/0.1",  // binary extension: never read
  };
  for (const [f, [body]] of Object.entries(plant)) {
    mkdirSync(join(root, f, ".."), { recursive: true });
    writeFileSync(join(root, f), body);
  }
  for (const [f, body] of Object.entries(clean)) {
    mkdirSync(join(root, f, ".."), { recursive: true });
    writeFileSync(join(root, f), body);
  }
  const r = scan([root]);
  const fails = [];
  for (const [f, [, rule]] of Object.entries(plant)) {
    if (!r.violations.some((v) => v.where.includes(f) && v.rule === rule)) fails.push(`missed ${rule} in ${f}`);
  }
  for (const v of r.violations) if (v.where.includes("/ok/") || v.where.startsWith("ok/")) fails.push(`false positive ${v.rule} ${v.where}`);
  if (!r.known.has("https://proofof.ai/towns/status.json")) fails.push("known exception not reported");
  return { ok: fails.length === 0, planted: Object.keys(plant).length, caught: r.violations.length, fails };
}

function main(argv) {
  const json = argv.includes("--json");
  if (argv.includes("--selftest")) {
    const r = selftest();
    console.log(JSON.stringify({ selftest: r.ok ? "ok" : "FAILED", ...r }));
    return r.ok ? 0 : 2;
  }
  const dirs = argv.filter((a) => !a.startsWith("--"));
  if (!dirs.length) {
    console.error("usage: sandbox-wall-guard.mjs [--json] DIR... | --selftest");
    return 2;
  }
  let r;
  try {
    r = scan(dirs);
  } catch (e) {
    console.error(`sandbox-wall-guard: ${e.message}`);
    return 2;
  }
  const knownOut = Object.fromEntries([...r.known].map(([k, w]) => [k, { reason: KNOWN.get(k), n: w.length, first: w.slice(0, 3) }]));
  const stale = [...KNOWN.keys()].filter((k) => !r.known.has(k));
  for (const v of r.violations.slice(0, 40)) console.log(`REFUSED ${v.rule} ${v.where} ${v.match}`);
  for (const [k, o] of Object.entries(knownOut)) console.log(`KNOWN ${k} x${o.n} (${o.first.join(", ")}): ${o.reason.split(":")[0]}`);
  for (const k of stale) console.log(`STALE_EXCEPTION ${k} (no longer present; remove it from KNOWN)`);
  const summary = { ok: r.violations.length === 0, files: r.files, refused: r.violations.length,
    known: Object.keys(knownOut), stale_exceptions: stale };
  console.log(json ? JSON.stringify({ ...summary, violations: r.violations.slice(0, 200), known_detail: knownOut })
    : `sandbox-wall-guard: ${summary.ok ? "ok" : "REFUSED"} files=${r.files} refused=${r.violations.length} known=${summary.known.length} stale=${stale.length}`);
  return summary.ok ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
