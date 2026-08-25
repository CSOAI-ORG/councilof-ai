#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when a machine-readable signed artifact is broken.
 *
 * Blocks stub pointers (file://, PLACEHOLDER, data-URIs) and truncated interim boards.
 * Allowed card_index boards:
 *   - exact honest 150 (34171B class, n_cards==150, cards.length==150)
 *   - verified 335 where sha256 == 12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb
 *     AND n_cards==335 AND cards.length==335 (real mine inventory, not fabricated)
 */
import { createHash } from "node:crypto";
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
const HONEST_150 = 150;
const HONEST_150_SIZE = 34171;
const VERIFIED_335 = 335;
const VERIFIED_335_SHA256 = "12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb";
const SIZE_FLOOR = 30000;
let failures = [];

let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory — nothing to guard`); process.exit(0); }

for (const f of files) {
  const p = join(dir, f);
  const rawBuf = readFileSync(p);
  const raw = rawBuf.toString("utf8");
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
    const digest = createHash("sha256").update(rawBuf).digest("hex");
    const is150 = nField === HONEST_150 && cards.length === HONEST_150 && size === HONEST_150_SIZE;
    const is335 =
      nField === VERIFIED_335 &&
      cards.length === VERIFIED_335 &&
      digest === VERIFIED_335_SHA256;
    if (!is150 && !is335) {
      failures.push(
        `card_index.json: neither allowed board (n=${nField}, len=${cards.length}, ${size}B, sha256=${digest.slice(0, 16)}…) — allow exact-150/${HONEST_150_SIZE}B or verified-335 sha256=${VERIFIED_335_SHA256.slice(0, 16)}…`
      );
    }
    if (size < SIZE_FLOOR)
      failures.push(`card_index.json: ${size}B — below the ${SIZE_FLOOR}B size floor (truncated or interim board)`);
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
