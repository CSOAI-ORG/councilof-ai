#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when a machine-readable signed artifact is broken.
 *
 * Verified board is 335 signed cards (mine MANIFEST n_cards=335 signed_count=335).
 * Blocks stubs/pointers/truncated boards; allows the verified 335 index.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2] || "dist/client";
const dir = join(dist, "signed");
const STUB_MARKERS = [
  "__LOAD_FROM__",
  "PLACEHOLDER_WILL_REPLACE",
  "LOAD_FROM__",
  "LOAD_FROM_FILE",
  "__CURSOR_LOAD__",
  "__FULL_CONTENT_FROM_",
  "$load:",
  "@file:",
  "@file://",
  "file://",
  "data:application",
  "test data uri",
];
const VERIFIED_CARD_COUNT = 335;
const VERIFIED_SIZE_FLOOR = 70000;
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
    const nField = (!Array.isArray(parsed) && typeof parsed.n_cards === "number") ? parsed.n_cards : null;
    if (!Array.isArray(cards)) {
      failures.push(`card_index.json: cards is not an array (${size}B)`);
      continue;
    }
    if (nField != null && nField !== cards.length)
      failures.push(`card_index.json: n_cards=${nField} but cards.length=${cards.length} (${size}B) — header lie`);
    if (cards.length !== VERIFIED_CARD_COUNT)
      failures.push(`card_index.json: ${cards.length} cards — verified board is exactly ${VERIFIED_CARD_COUNT}`);
    if (nField != null && nField !== VERIFIED_CARD_COUNT)
      failures.push(`card_index.json: n_cards=${nField} — verified board is ${VERIFIED_CARD_COUNT}`);
    if (size < VERIFIED_SIZE_FLOOR)
      failures.push(`card_index.json: ${size}B — below the ${VERIFIED_SIZE_FLOOR}B verified size floor`);
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
