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
 * Do not invent the missing 185. Do not claim 335. A fabricated 335-card
 * JSON (even SHA-gated and well-formed) is still a lie and must not deploy.
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

// Owner ruling (7294a9a5). Not a structural fact — see the header. null = any size.
const RULED_CARD_COUNT = 150;
// Below this the index is truncated, whatever the ruled count is.
const HONEST_SIZE_FLOOR = 30000;
// The claim the estate refuses to publish, whatever the ruling is.
const FABRICATED_CARD_COUNT = 335;
// did:web:csoai.org#card-attestation-1 — the same key verify-card.mjs pins.
const PINNED_PUBKEY_HEX =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";
// A row names the signing key either by its raw hex or by the DID fragment. Both name
// the SAME published key, so both are accepted here; what is not accepted is a third
// value, which would be a claim about a key we do not publish. The substantive check is
// the card body's own `pubkey`, which must be the hex above.
const PINNED_KIDS = new Set([PINNED_PUBKEY_HEX, "card-attestation-1"]);

const isSha256Hex = (v) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
const isEd25519SigHex = (v) => typeof v === "string" && /^[0-9a-f]{128}$/.test(v);

let failures = [];

let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory — nothing to guard`); process.exit(0); }

/**
 * Every index row must be bound to signature bytes that exist on disk.
 *
 * Two row shapes are published, and both are honest:
 *   - by reference: {card, axis, ts, signed, kid} — the bytes live in the card body
 *   - inline:       {..., pubkey, sig, card_url}  — the row repeats the body's bytes
 * A row is checked against its BODY either way, because the body is what a verifier
 * fetches. Where a row also states the bytes inline, they must agree with the body —
 * an index that carries different signature bytes than the artifact it points at is
 * the exact lie this guard exists to stop.
 *
 * Reports at most `cap` row failures so one broken index cannot bury the other files,
 * but always states the true total: a truncated failure list is the same class of lie.
 */
function checkRowsAreSigned(rows, size) {
  const cardsDir = join(dir, "cards");
  if (!existsSync(cardsDir)) {
    failures.push(`card_index.json: ${rows.length} rows but no signed/cards/ directory — the index cannot be checked against signature bytes, so it must not deploy`);
    return;
  }
  const rowFailures = [];
  const seen = new Set();
  rows.forEach((r, i) => {
    const at = `row ${i}`;
    if (!r || typeof r !== "object") { rowFailures.push(`${at}: not an object`); return; }
    if (!isSha256Hex(r.card)) { rowFailures.push(`${at}: card=${JSON.stringify(r.card)} is not a sha256 hex id`); return; }
    const id = r.card.slice(0, 16);
    if (seen.has(r.card)) { rowFailures.push(`${at}: duplicate card ${id}… — a padded or repeated index`); return; }
    seen.add(r.card);

    if (typeof r.axis !== "string" || !r.axis) rowFailures.push(`${at} (${id}…): no axis`);
    if (r.signed !== true) rowFailures.push(`${at} (${id}…): signed is not true`);
    if (!PINNED_KIDS.has(r.kid)) rowFailures.push(`${at} (${id}…): kid=${JSON.stringify(r.kid)} is not the published card-attestation key`);
    // Optional inline fields, checked only when present — but never permitted to be wrong.
    if ("pubkey" in r && r.pubkey !== PINNED_PUBKEY_HEX)
      rowFailures.push(`${at} (${id}…): row pubkey is not the published card-attestation key`);
    if ("sig" in r && !isEd25519SigHex(r.sig))
      rowFailures.push(`${at} (${id}…): row sig is not 64 bytes of Ed25519 signature`);
    if ("card_url" in r && !(typeof r.card_url === "string" && r.card_url.endsWith(`${r.card}.json`)))
      rowFailures.push(`${at} (${id}…): card_url ${JSON.stringify(r.card_url)} does not point at this card`);

    const bodyPath = join(cardsDir, `${r.card}.json`);
    if (!existsSync(bodyPath)) { rowFailures.push(`${at}: no card body at signed/cards/${id}….json — the row points at nothing`); return; }
    let card;
    try { card = JSON.parse(readFileSync(bodyPath, "utf8")); }
    catch (e) { rowFailures.push(`${at} (${id}…): card body is not valid JSON: ${e.message.slice(0, 60)}`); return; }
    if (card?.id !== r.card)
      rowFailures.push(`${at}: card body id ${String(card?.id).slice(0, 16)}… does not match the row's ${id}…`);
    if (card?.pubkey !== PINNED_PUBKEY_HEX)
      rowFailures.push(`${at} (${id}…): card body pubkey is not the published card-attestation key`);
    if (!isEd25519SigHex(card?.signature))
      rowFailures.push(`${at} (${id}…): card body carries no Ed25519 signature bytes`);
    else if (isEd25519SigHex(r.sig) && r.sig !== card.signature)
      rowFailures.push(`${at} (${id}…): row sig differs from the card body's signature — the index states bytes the artifact does not carry`);
  });

  const cap = 10;
  for (const rf of rowFailures.slice(0, cap)) failures.push(`card_index.json: ${rf}`);
  if (rowFailures.length > cap)
    failures.push(`card_index.json: …and ${rowFailures.length - cap} further row failure(s) across ${rows.length} rows (${size}B) — not listed, not forgiven`);
}

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
    if (nField === FABRICATED_CARD_COUNT || cards.length === FABRICATED_CARD_COUNT)
      failures.push(`card_index.json: claims 335 (${size}B) — do not invent the missing 185; the honest board is ${RULED_CARD_COUNT}`);
    if (cards.length !== RULED_CARD_COUNT)
      failures.push(`card_index.json: ${cards.length} cards — honest published board is exactly ${RULED_CARD_COUNT} (do not claim 335)`);
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
