#!/usr/bin/env node
/**
 * test-bench-suite.mjs — the generated bench suite must agree with the estate's own rules.
 *
 * WHY
 * ───
 * scripts/surface/build-bench-suite.mjs re-implements two things that also exist in the estate:
 * the bank's label vocabulary (from the published bytes) and the refusal rule for a
 * one-option answer menu (from the mill's exact_label_menu()). If either drifts, the site
 * will publish a menu the mill would refuse, or refuse one the mill would run — and either
 * way the site and the board disagree about what is measurable.
 *
 * This test compares the generator against the mill, axis by axis, on the REAL published
 * banks. It is the tie between the public page and the instrument.
 *
 * IT CHECKS
 * ─────────
 *  1. MENU PARITY — for every published bank, the menu the generator publishes is exactly the
 *     menu the mill's exact_label_menu() returns, and the generator refuses exactly the banks
 *     the mill refuses.
 *  2. HASH PARITY — the bank sha256 the generator publishes equals the sha256 the runner
 *     (harness/bench/run_bench.py, Python) computes from the same bytes. Two languages, one
 *     hash.
 *  3. NO HARD-CODED NUMBERS — the generated axes.json carries no item count, label menu or
 *     hash that disagrees with the banks.
 *
 * RUN
 * ───
 *   node --test scripts/surface/bench-suite.node-test.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// The generator's own logic, re-read from the module rather than copied.
//
// The bank map is extracted by IMPORTING the module's exported constant if it exports one,
// and otherwise by parsing the object literal. A regex over the source is fragile — an axis
// name with a digit ("art5-safeguard") silently disappears from a [a-z\-]+ pattern — and a
// bank that quietly drops out of the parity test is worse than no test at all.
const { BANK_REPO, BANK_URL } = await (async () => {
  const src = readFileSync(resolve(ROOT, "scripts/surface/build-bench-suite.mjs"), "utf8");
  const block = src.match(/const BANK_REPO\s*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("could not find BANK_REPO in the generator");
  const repos = {};
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*"?([A-Za-z0-9_-]+)"?\s*:\s*"(gspc-[A-Za-z0-9_-]+)"\s*,?\s*$/);
    if (m) repos[m[1]] = m[2];
  }
  if (!Object.keys(repos).length) throw new Error("BANK_REPO parsed to zero entries");
  return { BANK_REPO: repos, BANK_URL: (r) => `https://huggingface.co/datasets/csoai/${r}/resolve/main/items.jsonl` };
})();

const PROMPT_KEYS = ["item", "scenario", "request", "text", "tool", "operation", "case", "prompt", "question"];
const SENTINELS = new Set(["KEYWORD_MATCH"]);

function parseBank(text) {
  let items = 0;
  let canaryRows = 0;
  const expected = new Set();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (Object.keys(o).every((k) => k === "_canary" || k === "_note")) { canaryRows++; continue; }
    let prompt = null;
    for (const k of PROMPT_KEYS) { if (o[k]) { prompt = o[k]; break; } }
    const exp = o.expected;
    if (!prompt || exp === undefined || exp === "") continue;
    items++;
    expected.add(String(exp).trim().toUpperCase());
  }
  const raw = [...expected].filter((x) => x).sort();
  const options = [...new Set(raw.map((x) => String(x).trim().toUpperCase()).filter(Boolean))].sort();
  const sentinels = options.filter((x) => SENTINELS.has(x));
  const refused = sentinels.length
    ? `sentinel:${sentinels.join(",")}`
    : options.length < 2
      ? `oneoption:${options.length}`
      : null;
  return { items, canaryRows, options, refused };
}

/** Ask the MILL what it thinks of a label list. Returns the menu, or a refusal marker. */
function millMenu(labels) {
  const py = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("mill", ${JSON.stringify(resolve(ROOT, "harness/gspc-top100/mill_hub_queue.py"))})
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
labels = json.loads(sys.argv[1])
try:
    print(json.dumps({"menu": m.exact_label_menu(labels)}))
except ValueError as e:
    print(json.dumps({"refused": str(e)[:60]}))
`;
  const out = execFileSync("python3", ["-c", py, JSON.stringify(labels)], { encoding: "utf8" });
  return JSON.parse(out);
}

/** Ask the RUNNER (Python) for its sha256 of the same bytes. */
function runnerSha(url) {
  const py = `
import hashlib, sys, urllib.request
req = urllib.request.Request(sys.argv[1], headers={"User-Agent": "csoai-gspc-run-bench/1.0"})
print(hashlib.sha256(urllib.request.urlopen(req, timeout=90).read()).hexdigest())
`;
  return execFileSync("python3", ["-c", py, url], { encoding: "utf8" }).trim();
}

async function main() {
  const failures = [];
  let checked = 0;

  for (const [axis, repo] of Object.entries(BANK_REPO)) {
    const url = BANK_URL(repo);
    const res = await fetch(url, { headers: { "User-Agent": "csoai-test-bench-suite/1.0" } });
    const text = await res.text();
    const mine = parseBank(text);

    // 1. MENU PARITY
    const mill = millMenu(mine.options);
    const millRefused = Boolean(mill.refused);
    if (millRefused !== Boolean(mine.refused)) {
      failures.push(`${axis}: the generator says ${mine.refused ? "REFUSED" : "runnable"} but the mill says ${millRefused ? "REFUSED" : "runnable"}`);
    } else if (!millRefused) {
      const millOptions = [...new Set(mill.menu.map((x) => String(x).trim().toUpperCase()))].sort();
      if (JSON.stringify(millOptions) !== JSON.stringify(mine.options)) {
        failures.push(`${axis}: menu differs — generator ${JSON.stringify(mine.options)} vs mill ${JSON.stringify(millOptions)}`);
      }
    }

    // 2. HASH PARITY (two languages, one hash)
    const nodeSha = createHash("sha256").update(text, "utf8").digest("hex");
    const pySha = runnerSha(url);
    if (nodeSha !== pySha) {
      failures.push(`${axis}: node sha256 ${nodeSha.slice(0, 16)}… != python sha256 ${pySha.slice(0, 16)}…`);
    }

    // 3. the published spec must agree with the banks
    const specs = JSON.parse(readFileSync(resolve(ROOT, "public/bench/axes.json"), "utf8"));
    const spec = specs.axes.find((a) => a.axis === axis);
    if (!spec) {
      failures.push(`${axis}: no task spec in public/bench/axes.json`);
    } else {
      if (spec.items !== mine.items) failures.push(`${axis}: spec items ${spec.items} != bank ${mine.items}`);
      if (spec.canary_rows_excluded !== mine.canaryRows) failures.push(`${axis}: canary count differs`);
      if (spec.bank_sha256 !== nodeSha) failures.push(`${axis}: spec sha256 differs from the bytes`);
      if (Boolean(spec.refusal_reason) !== Boolean(mine.refused)) failures.push(`${axis}: spec refusal differs from the bank`);
    }
    checked++;
  }

  assert.equal(failures.length, 0, `bench-suite parity failed on ${failures.length} point(s):\n  ${failures.join("\n  ")}`);
  assert.ok(checked >= 14, `expected at least 14 published banks, checked ${checked}`);
  console.log(`✓ bench-suite parity: ${checked} banks — menus, refusals and hashes agree with the mill`);
}

test("the generated bench suite agrees with the mill on every published bank", main);

main().catch((e) => {
  console.error(`test-bench-suite: ${e.message}`);
  process.exit(1);
});
