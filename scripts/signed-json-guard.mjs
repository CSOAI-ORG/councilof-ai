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
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
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
const HONEST_CARD_COUNT = 150;
const HONEST_SIZE_FLOOR = 30000;

/**
 * Audit one dist/signed tree. Returns a list of failure strings — empty means clean.
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
    if (nField === 335 || cards.length === 335)
      failures.push(`card_index.json: claims 335 (${size}B) — do not invent the missing 185; the honest board is ${HONEST_CARD_COUNT}`);
    if (cards.length !== HONEST_CARD_COUNT)
      failures.push(`card_index.json: ${cards.length} cards — honest published board is exactly ${HONEST_CARD_COUNT} (do not claim 335)`);
    if (size < HONEST_SIZE_FLOOR)
      failures.push(`card_index.json: ${size}B — below the ${HONEST_SIZE_FLOOR}B honest size floor (truncated or interim board)`);

    // ADDED 2026-08-26. The count checks above prove the header agrees with the list, and
    // nothing more. An index of 150 well-formed rows pointing at cards that were never
    // shipped passes every check above and 404s for every stranger who follows it — the
    // index would be a catalogue of promises. So: the row must resolve to a file, the file
    // must be the card the row names, and the key must be the one the index published.
    const cardsDir = join(dir, "cards");
    if (!existsSync(cardsDir)) {
      failures.push(`card_index.json: indexes ${cards.length} cards but ${join("signed", "cards")}/ does not exist — every published link is dead`);
      continue;
    }
    const seen = new Set();
    let missing = 0, mismatched = 0, firstMissing = "", firstMismatch = "";
    for (const row of cards) {
      const id = row && row.card;
      if (typeof id !== "string" || !/^[0-9a-f]{64}$/.test(id)) {
        failures.push(`card_index.json: row carries a card id that is not a 64-hex digest: ${JSON.stringify(id).slice(0, 40)}`);
        continue;
      }
      if (seen.has(id)) failures.push(`card_index.json: duplicate card id ${id.slice(0, 12)}… — the count is padded`);
      seen.add(id);
      const cardPath = join(cardsDir, `${id}.json`);
      if (!existsSync(cardPath)) { missing++; if (!firstMissing) firstMissing = id; continue; }
      try {
        const card = JSON.parse(readFileSync(cardPath, "utf8"));
        if (card.id !== id) { mismatched++; if (!firstMismatch) firstMismatch = `${id.slice(0, 12)}… holds id ${String(card.id).slice(0, 12)}…`; }
        else if (typeof parsed.pubkey === "string" && card.pubkey !== parsed.pubkey) {
          mismatched++; if (!firstMismatch) firstMismatch = `${id.slice(0, 12)}… is signed by a key the index did not publish`;
        }
      } catch (e) { mismatched++; if (!firstMismatch) firstMismatch = `${id.slice(0, 12)}… is not valid JSON`; }
    }
    if (missing) failures.push(`card_index.json: ${missing} indexed card(s) are not published (e.g. ${firstMissing.slice(0, 16)}….json) — the index points at files a stranger cannot fetch`);
    if (mismatched) failures.push(`card_index.json: ${mismatched} published card(s) do not match their index row (e.g. ${firstMismatch})`);
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
  const build = (mutate) => {
    const dist = mkdtempSync(join(root, "dist-"));
    const dir = join(dist, "signed");
    mkdirSync(join(dir, "cards"), { recursive: true });
    const cards = [];
    for (let i = 0; i < HONEST_CARD_COUNT; i++) {
      const id = i.toString(16).padStart(64, "0");
      cards.push({ card: id, axis: "selftest", ts: "2026-08-26T00:00:00Z", signed: true, kid: "a".repeat(64) });
      writeFileSync(join(dir, "cards", `${id}.json`), JSON.stringify({ id, pubkey: "a".repeat(64), body: { axis: "selftest" }, signature: "00" }));
    }
    const index = { schema: "csoai.gspc-card-index/0.1", kind: "card_index", n_cards: cards.length, n_cells: cards.length,
      pubkey: "a".repeat(64), created: "2026-08-26T00:00:00Z", padding: "x".repeat(HONEST_SIZE_FLOOR), cards };
    mutate(index, dir);
    writeFileSync(join(dir, "card_index.json"), JSON.stringify(index, null, 1));
    return dist;
  };

  const cases = [
    ["honest tree is NOT flagged (positive control)", (i) => i, true],
    ["header lies about the list under it", (i) => { i.n_cards = 335; }],
    ["truncated board with the header moved to match", (i) => { i.cards = i.cards.slice(0, 50); i.n_cards = 50; i.n_cells = 50; }],
    ["a 335-card board is refused even when internally consistent", (i) => {
      for (let n = HONEST_CARD_COUNT; n < 335; n++) { const id = ("f" + n.toString(16)).padStart(64, "0"); i.cards.push({ card: id, kid: "a".repeat(64) }); }
      i.n_cards = i.cards.length; i.n_cells = i.cards.length;
    }],
    ["a pointer was pushed instead of the content", (i) => { i.cards[0].card = "__LOAD_FROM__/tmp/cards.json"; }],
    ["an indexed card was never published", (i, dir) => { rmSync(join(dir, "cards", i.cards[7].card + ".json")); }],
    ["a published card holds a different id than its row", (i, dir) => {
      writeFileSync(join(dir, "cards", i.cards[3].card + ".json"), JSON.stringify({ id: "b".repeat(64), pubkey: "a".repeat(64) }));
    }],
    ["a published card is signed by a key the index did not publish", (i, dir) => {
      writeFileSync(join(dir, "cards", i.cards[5].card + ".json"), JSON.stringify({ id: i.cards[5].card, pubkey: "c".repeat(64) }));
    }],
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
console.log(`✓ signed-json-guard: ${files.length} signed JSON file(s) valid, no stub markers, every indexed card published`);
