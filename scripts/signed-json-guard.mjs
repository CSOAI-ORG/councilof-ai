#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when a machine-readable signed artifact is broken.
 *
 * Accepts either:
 *   - honest 150 board (34171B exact), OR
 *   - verified mine-real 335 board gated by sha256
 *     12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb
 *
 * Rejects stubs, path-pointers, truncated interim boards, and any other 335.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const dist = process.argv[2] || "dist/client";
const dir = join(dist, "signed");
const STUB_MARKERS = [
  "__LOAD_FROM__",
  "PLACEHOLDER_WILL_REPLACE",
  "LOAD_FROM__",
  "LOAD_FROM_FILE",
  "__CURSOR_CURSOR__",
  "__CURSOR_LOAD__",
  "__FULL_CONTENT_FROM_",
  "$load:",
  "@file:",
  "@file://",
  "file://",
  "data:application",
  "test data uri",
];
const HONEST_150_COUNT = 150;
const HONEST_150_BYTES = 34171;
const VERIFIED_335_COUNT = 335;
const VERIFIED_335_SHA =
  "12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb";
const SIZE_FLOOR = 30000;
let failures = [];

let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory — nothing to guard`); process.exit(0); }

for (const f of files) {
  const p = join(dir, f);
  const buf = readFileSync(p);
  const raw = buf.toString("utf8");
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
    if (size < SIZE_FLOOR)
      failures.push(`card_index.json: ${size}B — below the ${SIZE_FLOOR}B size floor (truncated or interim board)`);

    const sha = createHash("sha256").update(buf).digest("hex");
    const isHonest150 =
      nField === HONEST_150_COUNT &&
      cards.length === HONEST_150_COUNT &&
      size === HONEST_150_BYTES;
    const isVerified335 =
      nField === VERIFIED_335_COUNT &&
      cards.length === VERIFIED_335_COUNT &&
      sha === VERIFIED_335_SHA;

    if (!isHonest150 && !isVerified335) {
      failures.push(
        `card_index.json: ${cards.length} cards / ${size}B / sha=${sha.slice(0, 16)}… — ` +
        `must be honest-150 (${HONEST_150_BYTES}B) or verified-335 (sha ${VERIFIED_335_SHA.slice(0, 16)}…)`
      );
    }
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
