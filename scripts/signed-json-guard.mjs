#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when a machine-readable signed artifact is broken.
 *
 * WHY THIS EXISTS (2026-08-25): automations kept pushing public/signed/card_index.json
 * as filename pointers ("__LOAD_FROM__/tmp/...", "@file:", "file://", data-URIs) or as
 * truncated "N/335 interim" boards (50 cards / 75 cards) whose commit messages claimed
 * an ATOMIC restore of 335 cards. The first guard only required ≥50 cards, so a valid
 * 50-card JSON lie shipped to councilof.ai.
 *
 * Estate rule: a component must be STRUCTURALLY UNABLE to report success on a path
 * it did not complete. This guard is that structure for /signed/*.json.
 *
 * The last honest published board is exactly 150 cards, ≥30000 bytes.
 * Do not invent the missing 185. A fabricated 335-card card_index.json (even
 * SHA-gated and well-formed) is still a lie and must not deploy.
 *
 * SCOPE — READ BEFORE "FIXING" ANYTHING ELSE THAT SAYS 335 (2026-08-26):
 * The 150 floor and the 335 rejection below apply to card_index.json ONLY, and
 * card_index.json is a CURATED SUBSET index. They are not a rule that the number
 * 335 is dishonest wherever it appears. /signed/chain.json legitimately carries
 * 335 POSITIONS (313 published bodies + 22 withheld); that is a different set,
 * counted from different bytes, and it verifies. Five separate lanes have now read
 * this header as a blanket ban and deleted chain.json, each time breaking the
 * manifest URL that /api/state publishes and stranding chain-facts.json with
 * numbers nobody could re-derive. If a file other than card_index.json says 335,
 * check it against the bytes before deleting it — see scripts/chain-manifest-guard.mjs.
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
const HONEST_CARD_COUNT = 150;
const HONEST_SIZE_FLOOR = 30000;
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
    if (nField === 335 || cards.length === 335)
      failures.push(`card_index.json: claims 335 (${size}B) — do not invent the missing 185; the honest board is ${HONEST_CARD_COUNT}`);
    if (cards.length !== HONEST_CARD_COUNT)
      failures.push(`card_index.json: ${cards.length} cards — honest published board is exactly ${HONEST_CARD_COUNT} (do not claim 335)`);
    if (size < HONEST_SIZE_FLOOR)
      failures.push(`card_index.json: ${size}B — below the ${HONEST_SIZE_FLOOR}B honest size floor (truncated or interim board)`);
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
