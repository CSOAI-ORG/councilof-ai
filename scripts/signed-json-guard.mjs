#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when a machine-readable signed artifact is broken.
 *
 * WHY THIS EXISTS (2026-08-25): an automation pushed public/signed/card_index.json
 * as the literal one-line string "__LOAD_FROM__/tmp/card_index_content.json" —
 * its push tooling passed a filename POINTER where the file CONTENT belonged.
 * The commit message claimed "ATOMIC restore card_index 335 (75578B, len=335)";
 * the actual payload was 41 bytes. It deployed, and the public signed-card index
 * served that stub to every consumer. A second automation kept reverting it and
 * the two fought on master for two days (>15 commits).
 *
 * The estate rule: a component must be STRUCTURALLY UNABLE to report success on
 * a path it did not complete. This guard is that structure for /signed/*.json:
 * every file must parse as JSON, must not carry stub markers, and card_index
 * must hold a sane number of card entries. A stub can no longer go live.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2] || "dist/client";
const dir = join(dist, "signed");
const STUB_MARKERS = ["__LOAD_FROM__", "PLACEHOLDER_WILL_REPLACE", "LOAD_FROM__"];
let failures = [];

let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory — nothing to guard`); process.exit(0); }

for (const f of files) {
  const p = join(dir, f);
  const raw = readFileSync(p, "utf8");
  const size = statSync(p).size;
  for (const m of STUB_MARKERS) if (raw.includes(m))
    failures.push(`${f}: contains stub marker ${JSON.stringify(m)} (${size}B) — a push tool passed a pointer as content`);
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) { failures.push(`${f}: not valid JSON (${size}B): ${e.message.slice(0, 80)}`); continue; }
  if (f === "card_index.json") {
    const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? parsed.items ?? []);
    if (!Array.isArray(cards) || cards.length < 50)
      failures.push(`card_index.json: only ${Array.isArray(cards) ? cards.length : 0} cards — below the 50-card floor (stub or truncation)`);
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
