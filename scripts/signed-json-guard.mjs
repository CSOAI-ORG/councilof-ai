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
 * OWNER RULING 2026-08-28: the mine chain is 335 verifying cards. The 150-row
 * floor was a subset of that chain, not a second measurement. The honest check
 * is self-consistency: n_cards == rows == files, every row signature-bound,
 * ≥30000 bytes. A 335-row index is honest when 335 verifying files stand behind
 * it. A 335 header over fewer files (or unverified files) is still a lie.
 *
 * MERGED 2026-08-27 (consolidation). Two lanes had each fixed something different here
 * and neither fix was whole:
 *   - master hardened the row checks (checkRowsAreSigned: row→body signature binding,
 *     pinned key) but never CALLED the function and never imported the existsSync it
 *     uses. The strictest check in the file was dead code that would have thrown if it
 *     had ever run — this guard's own defect class, inside the guard.
 *   - e2e-hardening factored the audit into auditSignedTree() so `--selftest` could run
 *     the SAME code over deliberately broken trees, but its row checks were the weaker
 *     pre-hardening ones.
 * Both are kept: the strict checks now run, inside the testable structure, and the
 * selftest carries a negative control for each of them.
 */
import {
  readFileSync, readdirSync, statSync, existsSync,
  mkdtempSync, mkdirSync, writeFileSync, rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

// Owner ruling (7294a9a5, 6657a4da). Not a structural fact — see the header.
// OWNER RULING 2026-08-27 (supersedes the exact-150 freeze of 7294a9a5/6657a4da): the index
// lists EVERY verifying published card. No ruled constant — the check is self-consistency:
// n_cards == rows == card FILES on disk, every row bound to signature bytes under the pinned
// key. A constant is what let two bots and three humans fight over this file for two days.
const RULED_CARD_COUNT = null; // no clamp — the index is the verifying set
// Below this the index is truncated, whatever the ruled count is.
const HONEST_SIZE_FLOOR = 30000;
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
function checkRowsAreSigned(dir, rows, size, failures) {
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

/**
 * Audit one dist/signed tree. Returns the failure strings — empty means clean.
 * Factored out of the top level so `--selftest` can run the SAME code over deliberately
 * broken trees. A guard whose logic only exists on the real path cannot be shown to fail,
 * which is the defect class this repo keeps rediscovering.
 */
export function auditSignedTree(dist) {
  const dir = join(dist, "signed");
  const failures = [];
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json")); }
  catch { return { files: [], failures: [], missingDir: true }; }

  for (const f of files) {
    const p = join(dir, f);
    const raw = readFileSync(p, "utf8");
    const size = statSync(p).size;
    for (const m of STUB_MARKERS) if (raw.includes(m))
      failures.push(`${f}: contains stub marker ${JSON.stringify(m)} (${size}B) — a push tool passed a pointer as content`);
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { failures.push(`${f}: not valid JSON (${size}B): ${e.message.slice(0, 80)}`); continue; }
    if (f !== "card_index.json") continue;

    const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? parsed.items ?? []);
    const nField = (!Array.isArray(parsed) && typeof parsed.n_cards === "number") ? parsed.n_cards : null;
    if (!Array.isArray(cards)) { failures.push(`card_index.json: cards is not an array (${size}B)`); continue; }
    if (nField != null && nField !== cards.length)
      failures.push(`card_index.json: n_cards=${nField} but cards.length=${cards.length} (${size}B) — header lie`);
    if (RULED_CARD_COUNT !== null && cards.length !== RULED_CARD_COUNT)
      failures.push(`card_index.json: ${cards.length} cards — honest published board is exactly ${RULED_CARD_COUNT}`);
    const nCells = (!Array.isArray(parsed) && typeof parsed.n_cells === "number") ? parsed.n_cells : null;
    if (nCells != null && nCells !== cards.length)
      failures.push(`card_index.json: n_cells=${nCells} but cards.length=${cards.length} — leftover subset floor (the 150-row set is inside this chain, not a second measurement)`);
    if (size < HONEST_SIZE_FLOOR)
      failures.push(`card_index.json: ${size}B — below the ${HONEST_SIZE_FLOOR}B honest size floor (truncated or interim board)`);

    // The count checks above prove the header agrees with the list, and nothing more. An
    // index of 150 well-formed rows pointing at cards that were never shipped passes every
    // check above and 404s for every stranger who follows it. This binds each row to bytes.
    checkRowsAreSigned(dir, cards, size, failures);
  }
  return { files, failures, missingDir: false };
}

// ─────────────────────────── negative controls ───────────────────────────
/**
 * `--selftest` seeds each violation class into a throwaway tree and asserts the guard
 * CATCHES it, plus one honest tree it must NOT flag. A gate that has never been shown to
 * go red is a gate nobody should trust to be green.
 */
function selftest() {
  const root = mkdtempSync(join(tmpdir(), "signed-json-guard-"));
  const SIG = "ab".repeat(64); // 128 hex chars
  /**
   * How many rows the fixtures build. Deliberately NOT RULED_CARD_COUNT: the owner's
   * 313 ruling set that to null ("no clamp"), every fixture became 0 cards long, and
   * this selftest crashed on `null.toString()` before it reached a single control. A
   * test harness whose size follows a policy constant breaks the moment the policy
   * moves — and a crashing selftest is worse than none, because it proves nothing
   * while looking like it ran.
   */
  const FIXTURE_N = 150;
  const build = (mutate) => {
    const dist = mkdtempSync(join(root, "dist-"));
    const dir = join(dist, "signed");
    mkdirSync(join(dir, "cards"), { recursive: true });
    const cards = [];
    for (let i = 0; i < FIXTURE_N; i++) {
      const id = i.toString(16).padStart(64, "0");
      cards.push({ card: id, axis: "selftest", ts: "2026-08-26T00:00:00Z", signed: true, kid: "card-attestation-1" });
      writeFileSync(join(dir, "cards", `${id}.json`),
        JSON.stringify({ id, pubkey: PINNED_PUBKEY_HEX, body: { axis: "selftest" }, signature: SIG }));
    }
    const index = {
      schema: "csoai.gspc-card-index/0.1", kind: "card_index",
      n_cards: cards.length, n_cells: cards.length,
      pubkey: PINNED_PUBKEY_HEX, created: "2026-08-26T00:00:00Z",
      padding: "x".repeat(HONEST_SIZE_FLOOR), cards,
    };
    mutate(index, dir);
    writeFileSync(join(dir, "card_index.json"), JSON.stringify(index, null, 1));
    return dist;
  };

  const cases = [
    ["honest tree is NOT flagged (positive control)", (i) => i, true],
    ["header lies about the list under it", (i) => { i.n_cards = 335; }],
    // Only a violation while an exact count is RULED. With the clamp lifted (owner
    // ruling 313 -> RULED_CARD_COUNT null) a smaller-but-consistent board is not by
    // itself dishonest; truncation is then caught by the size floor and by the
    // row-to-body binding below. Asserted both ways so this control keeps biting
    // whichever way the ruling goes, instead of silently becoming decorative.
    ["truncated board with the header moved to match",
      (i) => { i.cards = i.cards.slice(0, 50); i.n_cards = 50; i.n_cells = 50; },
      RULED_CARD_COUNT === null],
    ["n_cells leftover floor disagrees with the list", (i) => { i.n_cells = 1; }],
    ["a pointer was pushed instead of the content", (i) => { i.cards[0].card = "__LOAD_FROM__/tmp/cards.json"; }],
    ["an indexed card was never published", (i, dir) => { rmSync(join(dir, "cards", i.cards[7].card + ".json")); }],
    ["a published card holds a different id than its row", (i, dir) => {
      writeFileSync(join(dir, "cards", i.cards[3].card + ".json"),
        JSON.stringify({ id: "b".repeat(64), pubkey: PINNED_PUBKEY_HEX, signature: SIG }));
    }],
    ["a published card is signed by a key the estate does not publish", (i, dir) => {
      writeFileSync(join(dir, "cards", i.cards[5].card + ".json"),
        JSON.stringify({ id: i.cards[5].card, pubkey: "c".repeat(64), signature: SIG }));
    }],
    ["a published card carries no signature bytes", (i, dir) => {
      writeFileSync(join(dir, "cards", i.cards[6].card + ".json"),
        JSON.stringify({ id: i.cards[6].card, pubkey: PINNED_PUBKEY_HEX }));
    }],
    ["a row names a key the estate does not publish", (i) => { i.cards[2].kid = "d".repeat(64); }],
    ["a row states signature bytes the card body does not carry", (i) => { i.cards[4].sig = "cd".repeat(64); }],
    ["a row's card_url points at a different card", (i) => { i.cards[1].card_url = "/signed/cards/" + "e".repeat(64) + ".json"; }],
    ["a row is marked unsigned", (i) => { i.cards[10].signed = false; }],
    ["the whole cards/ directory is missing", (i, dir) => { rmSync(join(dir, "cards"), { recursive: true }); }],
    ["duplicate ids padding the count", (i) => { i.cards[9].card = i.cards[8].card; }],
  ];

  console.log(`signed-json-guard --selftest: ${cases.length} control(s)\n`);
  let bad = 0;
  for (const [name, mutate, expectClean] of cases) {
    const dist = build((i, dir) => mutate(i, dir));
    const { failures } = auditSignedTree(dist);
    const caught = failures.length > 0;
    if (caught === !expectClean) console.log(`  ✓ ${name}${caught ? ` → ${failures[0].slice(0, 90)}` : ""}`);
    else { console.log(`  ✗ ${name} → ${caught ? "flagged an honest tree: " + failures[0] : "PASSED a broken tree — this check cannot fail"}`); bad++; }
  }
  rmSync(root, { recursive: true, force: true });
  console.log("");
  if (bad) { console.error(`signed-json-guard --selftest: FAIL — ${bad} control(s) wrong.`); return 1; }
  console.log(`signed-json-guard --selftest: PASS — every violation class is caught, an honest tree is not.`);
  return 0;
}

if (process.argv.includes("--selftest")) process.exit(selftest());

const dist = process.argv[2] || "dist/client";
const { files, failures, missingDir } = auditSignedTree(dist);
if (missingDir) { console.log(`signed-json-guard: no ${join(dist, "signed")} directory — nothing to guard`); process.exit(0); }
if (failures.length) {
  console.error(`✖ signed-json-guard: ${failures.length} broken signed artifact(s) — DEPLOY BLOCKED:\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nThe public /signed/ tree is consumed by verifiers. A broken file here is a lie with a signature on it.`);
  process.exit(1);
}
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers, every indexed card bound to signature bytes`);
