// SPDX-License-Identifier: Apache-2.0
// TypeScript error ratchet.
//
// `npm run check` currently reports 249 errors across 114 files while `vite build` still
// succeeds — which is exactly the false sense of health the seven-month briefing flagged as P0:
// the build being green tells you nothing about whether the types hold.
//
// Fixing 249 errors in one pass is not realistic and would block every other repair. A ratchet
// is: the count may go DOWN, never UP. New work cannot add type debt, and the number walks to
// zero as errors are burned down. When it reaches zero, flip this to a hard gate.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const BASELINE = "scripts/.ts-error-baseline";
let out = "";
try {
  out = execSync("npx tsc --noEmit -p tsconfig.json 2>&1", { encoding: "utf8" });
} catch (e) {
  out = String(e.stdout ?? "") + String(e.stderr ?? "");
}
const count = (out.match(/error TS\d+/g) ?? []).length;
const prev = existsSync(BASELINE) ? parseInt(readFileSync(BASELINE, "utf8").trim(), 10) : Infinity;

if (!Number.isFinite(prev)) {
  writeFileSync(BASELINE, String(count) + "\n");
  console.log(`ts-ratchet: baseline set at ${count} errors`);
  process.exit(0);
}
if (count > prev) {
  console.error(`ts-ratchet: FAIL — errors rose ${prev} -> ${count}. Type debt may not increase.`);
  process.exit(1);
}
if (count < prev) {
  writeFileSync(BASELINE, String(count) + "\n");
  console.log(`ts-ratchet: improved ${prev} -> ${count}. Baseline tightened.`);
} else {
  console.log(`ts-ratchet: holding at ${count} errors (no regression).`);
}
