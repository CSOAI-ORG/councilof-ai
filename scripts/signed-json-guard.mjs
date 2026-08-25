#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when a machine-readable signed artifact is broken.
 *
 * Allows exactly:
 *   - verified LIVE 335 (sha256 12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb), or
 *   - honest published 150 board (≥30000B)
 * Rejects stubs, interim N/335 boards, and fabricated/mismatched 335 blobs.
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
const HONEST_CARD_COUNT = 150;
const HONEST_SIZE_FLOOR = 30000;
const VERIFIED_335_SHA256 = "12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb";
let failures = [];

let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory — nothing to guard`); process.exit(0); }

for (const f of files) {
  const p = join(dir, f);
  const rawBuf = readFileSync(p);
  const raw = rawBuf.toString("utf8");
  const size = statSync(p).size;
  const sha = createHash("sha256").update(rawBuf).digest("hex");
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

    const isVerified335 =
      nField === 335 &&
      cards.length === 335 &&
      sha === VERIFIED_335_SHA256;

    const isHonest150 =
      nField === HONEST_CARD_COUNT &&
      cards.length === HONEST_CARD_COUNT &&
      size >= HONEST_SIZE_FLOOR;

    if (isVerified335) {
      console.log(`✓ card_index.json: verified LIVE 335 (sha256 ${sha.slice(0, 16)}…)`);
      continue;
    }
    if (isHonest150) {
      console.log(`✓ card_index.json: honest 150 (${size}B)`);
      continue;
    }
    if (nField === 335 || cards.length === 335)
      failures.push(`card_index.json: 335 claim rejected — sha256 ${sha} is not the verified LIVE blob ${VERIFIED_335_SHA256}`);
    else
      failures.push(`card_index.json: ${cards.length} cards / n_cards=${nField} (${size}B) — allow only verified 335 or honest ${HONEST_CARD_COUNT}`);
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
