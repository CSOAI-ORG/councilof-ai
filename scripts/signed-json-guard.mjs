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
 * WHY THE COUNT CONSTANT WAS NOT ENOUGH (2026-08-26). The guard used to enforce a bare
 * `cards.length === 150`. That constant could not tell "150 because the owner ruled
 * exact-150" from "150 because a bot truncated a 313-row index" — both are the same
 * integer — so it was flipped back and forth (150 ⇄ 313 ⇄ dual-accept-335) across a dozen
 * commits, and commit 717f7462 claimed "the guard now checks self-consistency rather than
 * a constant" while changing only client/*.tsx. The bytes contradicted the message.
 *
 * So the guard now checks what the constant STOOD FOR, at any size:
 *   - the header cannot lie about the body      (n_cards === cards.length)
 *   - every row is bound to real signature bytes (row.card resolves to signed/cards/<id>.json
 *     whose `id` is that hash, whose `pubkey` is the pinned attestation key, and which
 *     carries a 128-hex Ed25519 signature)
 *   - rows are distinct, and each names its axis and the key it was signed under
 * A truncated index fails because its header no longer matches. A stubbed or invented
 * index fails because its rows resolve to nothing. Neither can pass at ANY size — which
 * is what "exactly 150" was a proxy for, and a proxy the size floor shared, so the
 * ≥30000B floor is gone too: it was a second count gate wearing different units.
 *
 * The 335 claim stays refused outright. Do not invent the missing 185. A fabricated
 * 335-card JSON (even SHA-gated and well-formed) is still a lie and must not deploy.
 *
 * RULED_CARD_COUNT is the live owner ruling ("Card_index untouched exact-150. Do not
 * invent extras.", commit 7294a9a5), not a structural fact. It is a separate, labelled
 * line so that changing the published board is a deliberate owner edit here — never a
 * side effect of a bot pushing a different index. Set it to null to accept any size that
 * passes the structural checks above.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
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
// The claim the estate refuses to publish, whatever the ruling is.
const FABRICATED_CARD_COUNT = 335;
// did:web:csoai.org#card-attestation-1 — the same key verify-card.mjs pins.
const PINNED_PUBKEY_HEX =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

const isSha256Hex = (s) => typeof s === "string" && /^[0-9a-f]{64}$/.test(s);
const isEd25519SigHex = (s) => typeof s === "string" && /^[0-9a-f]{128}$/.test(s);

let failures = [];

let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory — nothing to guard`); process.exit(0); }

/**
 * Every index row must be bound to signature bytes that exist on disk.
 * Reports at most `cap` row failures so one broken index cannot bury the others,
 * but always states the true total — a truncated failure list is the same class of
 * lie this guard exists to stop.
 */
function checkRowsAreSigned(rows, size) {
  const cardsDir = join(dir, "cards");
  if (!existsSync(cardsDir)) {
    failures.push(`card_index.json: ${rows.length} rows but no ${cardsDir}/ — the index cannot be checked against signature bytes, so it must not deploy`);
    return;
  }
  const rowFailures = [];
  const seen = new Set();
  rows.forEach((r, i) => {
    const at = `row ${i}`;
    if (!r || typeof r !== "object") { rowFailures.push(`${at}: not an object`); return; }
    if (!isSha256Hex(r.card)) { rowFailures.push(`${at}: card=${JSON.stringify(r.card)} is not a sha256 hex id`); return; }
    if (seen.has(r.card)) { rowFailures.push(`${at}: duplicate card ${r.card.slice(0, 16)}… — a padded or repeated index`); return; }
    seen.add(r.card);
    if (typeof r.axis !== "string" || !r.axis) rowFailures.push(`${at} (${r.card.slice(0, 16)}…): no axis`);
    if (r.signed !== true) rowFailures.push(`${at} (${r.card.slice(0, 16)}…): signed is not true`);
    if (r.kid !== PINNED_PUBKEY_HEX) rowFailures.push(`${at} (${r.card.slice(0, 16)}…): kid is not the published card-attestation key`);

    const body = join(cardsDir, `${r.card}.json`);
    if (!existsSync(body)) { rowFailures.push(`${at}: no card body at signed/cards/${r.card.slice(0, 16)}….json — the row points at nothing`); return; }
    let card;
    try { card = JSON.parse(readFileSync(body, "utf8")); }
    catch (e) { rowFailures.push(`${at} (${r.card.slice(0, 16)}…): card body is not valid JSON: ${e.message.slice(0, 60)}`); return; }
    if (card?.id !== r.card) rowFailures.push(`${at}: card body id ${String(card?.id).slice(0, 16)}… does not match the row's ${r.card.slice(0, 16)}…`);
    if (card?.pubkey !== PINNED_PUBKEY_HEX) rowFailures.push(`${at} (${r.card.slice(0, 16)}…): card body pubkey is not the published card-attestation key`);
    if (!isEd25519SigHex(card?.signature)) rowFailures.push(`${at} (${r.card.slice(0, 16)}…): card body carries no Ed25519 signature bytes`);
  });

  const cap = 10;
  for (const rf of rowFailures.slice(0, cap)) failures.push(`card_index.json: ${rf}`);
  if (rowFailures.length > cap)
    failures.push(`card_index.json: …and ${rowFailures.length - cap} further row failure(s) of ${rows.length} rows (${size}B) — not listed, not forgiven`);
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
    if (cards.length === 0)
      failures.push(`card_index.json: 0 cards (${size}B) — an empty board is not a published board`);
    // The header cannot lie about the body. This is what catches a truncated index at ANY size.
    if (nField != null && nField !== cards.length)
      failures.push(`card_index.json: n_cards=${nField} but cards.length=${cards.length} (${size}B) — header lie`);
    if (nField === FABRICATED_CARD_COUNT || cards.length === FABRICATED_CARD_COUNT)
      failures.push(`card_index.json: claims ${FABRICATED_CARD_COUNT} (${size}B) — do not invent the missing 185`);
    // Every row must be bound to signature bytes that exist. This is what the count
    // constant was standing in for, and it holds whatever the ruled size is.
    checkRowsAreSigned(cards, size);
    if (RULED_CARD_COUNT != null && cards.length !== RULED_CARD_COUNT)
      failures.push(`card_index.json: ${cards.length} cards — the live owner ruling is exactly ${RULED_CARD_COUNT} (7294a9a5: "Card_index untouched exact-150. Do not invent extras."). Changing the published board is an owner decision: edit RULED_CARD_COUNT in this file, do not push a different index past it.`);
  }
}

if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers`);
