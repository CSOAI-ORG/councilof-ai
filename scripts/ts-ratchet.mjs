// SPDX-License-Identifier: Apache-2.0
// TypeScript error ratchet.
//
// The repository still carries legacy type debt, so a clean `tsc` is not yet a
// practical release gate. This ratchet makes the debt explicit: CI checks the
// committed ceiling without modifying it, while maintainers deliberately
// tighten the ceiling after removing errors.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = resolve(ROOT, "scripts/.ts-error-baseline");
const TSC = resolve(ROOT, "node_modules/typescript/bin/tsc");
const MODES = new Set(["--check", "--update", "--selftest"]);

function fail(message, detail = "") {
  console.error(`ts-ratchet: FAIL — ${message}`);
  if (detail.trim()) console.error(detail.trim());
  process.exit(1);
}

function parseBaseline(text) {
  const value = text.trim();
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  return Number(value);
}

function compare(current, baseline) {
  if (current > baseline) return "regression";
  if (current < baseline) return "improvement";
  return "holding";
}

function runSelftest() {
  const cases = [
    [200, 199, "regression"],
    [198, 199, "improvement"],
    [199, 199, "holding"],
  ];
  for (const [current, baseline, expected] of cases) {
    const actual = compare(current, baseline);
    if (actual !== expected) {
      fail(`selftest expected ${expected}, received ${actual}`);
    }
  }
  if (parseBaseline("199\n") !== 199 || parseBaseline("not-a-number") !== null) {
    fail("selftest baseline parser did not enforce an integer ceiling");
  }
  console.log("ts-ratchet: selftest OK");
}

function readBaseline() {
  if (!existsSync(BASELINE)) {
    fail("baseline is missing; restore scripts/.ts-error-baseline");
  }
  const baseline = parseBaseline(readFileSync(BASELINE, "utf8"));
  if (baseline === null) {
    fail("baseline must contain one non-negative integer");
  }
  return baseline;
}

function runTypeScript() {
  if (!existsSync(TSC)) {
    fail("local TypeScript compiler is missing; run npm install first");
  }

  const result = spawnSync(
    process.execPath,
    [TSC, "--noEmit", "-p", "tsconfig.json", "--pretty", "false"],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const diagnostics = output.match(/error TS\d+:/g) ?? [];
  const sourceFiles = new Set(
    [...output.matchAll(/^(.+?)\(\d+,\d+\): error TS\d+:/gm)].map((match) => match[1]),
  );
  const globalDiagnostics = output.match(/^error TS\d+:/gm) ?? [];

  if (result.error) fail(`could not execute TypeScript: ${result.error.message}`);
  if (result.status === null) fail("TypeScript did not return an exit status", output);
  if (globalDiagnostics.length > 0) {
    fail("TypeScript reported a project/configuration error", globalDiagnostics.join("\n"));
  }
  if (result.status !== 0 && diagnostics.length === 0) {
    fail(`TypeScript exited ${result.status} without diagnostics`, output);
  }
  if (result.status === 0 && diagnostics.length > 0) {
    fail("TypeScript returned success while reporting diagnostics", output);
  }

  return { count: diagnostics.length, files: sourceFiles.size };
}

const args = process.argv.slice(2);
if (args.length !== 1 || !MODES.has(args[0])) {
  console.error("Usage: node scripts/ts-ratchet.mjs --check|--update|--selftest");
  process.exit(2);
}

const mode = args[0];
if (mode === "--selftest") {
  runSelftest();
  process.exit(0);
}

const baseline = readBaseline();
const current = runTypeScript();
const state = compare(current.count, baseline);

if (state === "regression") {
  fail(
    `errors rose ${baseline} -> ${current.count} across ${current.files} files; type debt may not increase`,
  );
}

if (mode === "--check") {
  if (state === "improvement") {
    fail(
      `baseline is stale ${baseline} -> ${current.count}; run npm run ts-ratchet:update and commit the tightened baseline`,
    );
  }
  console.log(
    `ts-ratchet: check OK — holding at ${current.count} errors across ${current.files} files`,
  );
  process.exit(0);
}

if (state === "improvement") {
  writeFileSync(BASELINE, `${current.count}\n`);
  console.log(
    `ts-ratchet: baseline tightened ${baseline} -> ${current.count} errors across ${current.files} files`,
  );
} else {
  console.log(
    `ts-ratchet: update not needed — holding at ${current.count} errors across ${current.files} files`,
  );
}
