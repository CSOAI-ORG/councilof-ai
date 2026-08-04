// SPDX-License-Identifier: Apache-2.0
// The refutation count must agree with the ledger, everywhere.
//
// The seven-month briefing flagged the live copy saying "eight refutations" while the ledger
// page said nine. The real spread was worse: FIVE different numbers across six surfaces —
// 8, 9, "eight", 10, 10, 7 — on a product whose entire promise is exact public truth. A
// governance company that cannot count its own published refutations has no business
// counting anyone else's controls.
//
// Ground truth is LEDGER.length in RefutationLedger.tsx. Nothing else is allowed to disagree.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "client/src";
const LEDGER_FILE = join(SRC, "pages/RefutationLedger.tsx");

// Count entries by their `id:` / `title:` keys inside the LEDGER array literal.
const ledgerSrc = readFileSync(LEDGER_FILE, "utf8");
const arr = ledgerSrc.slice(ledgerSrc.indexOf("const LEDGER = ["));
let depth = 0, end = 0;
for (let i = arr.indexOf("["); i < arr.length; i++) {
  if (arr[i] === "[") depth++;
  else if (arr[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
}
const body = arr.slice(0, end);
const truth = (body.match(/^\s{2,}(title|claim|hypothesis):/gm) ?? []).length;
if (truth === 0) {
  console.error("refutation-lint: could not read LEDGER entries — refusing to pass blindly");
  process.exit(1);
}

const WORDS = { seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 };
const RX = /\b(\d{1,3}|seven|eight|nine|ten|eleven)\s+(?:published\s+)?refutations?\b/gi;

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : [];
});

const bad = [];
for (const file of walk(SRC)) {
  if (file === LEDGER_FILE) continue;   // derives from LEDGER.length by construction
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(RX)) {
    const raw = m[1].toLowerCase();
    const n = WORDS[raw] ?? parseInt(raw, 10);
    if (n !== truth) bad.push(`${file}: "${m[0]}" (ledger has ${truth})`);
  }
}

if (bad.length) {
  console.error(`refutation-lint: FAIL — ${bad.length} surface(s) disagree with the ledger:`);
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log(`refutation-lint: OK — every surface agrees with the ledger (${truth}).`);
