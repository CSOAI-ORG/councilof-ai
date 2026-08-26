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
import { createHash, createPublicKey, verify as nodeVerify } from "node:crypto";
import { join } from "node:path";


// Canonical preimage, matching CPython json.dumps(sort_keys=True, separators=(',',':'),
// ensure_ascii=True) — including the trailing ".0" CPython gives an integral float, which
// JavaScript does not. 56 of the cards contain one; without this a third fail spuriously.
const FLOAT_FIELDS = new Set(["accuracy", "ci_low", "ci_high", "recall", "precision", "f1"]);
function jstr(x) {
  let o = '"';
  for (const ch of x) {
    const c = ch.codePointAt(0);
    if (ch === '"') o += '\\"';
    else if (ch === "\\") o += "\\\\";
    else if (ch === "\n") o += "\\n";
    else if (ch === "\r") o += "\\r";
    else if (ch === "\t") o += "\\t";
    else if (c < 0x20) o += "\\u" + c.toString(16).padStart(4, "0");
    else if (c < 0x7f) o += ch;
    else if (c <= 0xffff) o += "\\u" + c.toString(16).padStart(4, "0");
    else {
      const v = c - 0x10000;
      o += "\\u" + (0xd800 + (v >> 10)).toString(16).padStart(4, "0");
      o += "\\u" + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0");
    }
  }
  return o + '"';
}
function canon(v, key = null) {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number")
    return Number.isInteger(v) && FLOAT_FIELDS.has(key) ? v.toFixed(1) : String(v);
  if (typeof v === "string") return jstr(v);
  if (Array.isArray(v)) return "[" + v.map((x) => canon(x, key)).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => jstr(k) + ":" + canon(v[k], k)).join(",") + "}";
}
const canonicalPreimage = (body) => Buffer.from(canon(body), "utf8");
function verifyEd25519(pubHex, sigHex, msg) {
  try {
    const der = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(pubHex, "hex"),
    ]);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    return nodeVerify(null, msg, key, Buffer.from(sigHex, "hex"));
  } catch { return false; }
}

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
// WAS: const HONEST_CARD_COUNT = 150.
//
// This guard exists to stop a FABRICATED board — its own header says "do not invent the
// missing 185", and a 50-card lie once shipped because the first version only required >=50.
// That intent is right and is kept. The constant was a PROXY for it: at the time, 150 was
// the most we could show real bytes for, so "exactly 150" meant "nothing invented".
//
// The proxy is now wrong and the intent is unchanged. BOARD-RULING froze the board "until
// the 185 candidate cards are verified against the real card store... whatever number
// actually verifies (150, 335, or between) becomes the board." That verification has been
// run: harness/mine/cards/MANIFEST.json holds body, signature and public key for all 335,
// and all 335 recompute under one key. 22 are withheld because their SIGNED bodies contain
// an internal codename that brand-gate forbids on a public surface and which cannot be
// redacted without invalidating the id. 313 remain.
//
// So this checks the thing the constant was standing in for: every listed card must have a
// real file whose id recomputes from its own body and whose signature verifies under the
// pinned key. That is STRICTLY STRONGER than counting to 150 — it would have caught the
// fabricated 335 the old comment warns about, and it catches a fabricated 150 too, which
// counting never could.
const PINNED_PUBKEY =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";
const HONEST_CARD_FLOOR = 150; // never fewer than the previously published board
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
    // Never fewer than the board we already published — a silent shrink is as much a lie
    // as an invented growth, and is how a truncated index would slip through.
    if (cards.length < HONEST_CARD_FLOOR)
      failures.push(`card_index.json: ${cards.length} cards — below the ${HONEST_CARD_FLOOR} already published (silent shrink)`);
    // EVERY listed card must exist and recompute. This is the fabrication test the old
    // "=== 150" was standing in for, done directly instead of by proxy.
    for (const row of cards) {
      const cid = row?.card;
      if (!cid) { failures.push(`card_index.json: a row has no card id`); break; }
      let card;
      try {
        card = JSON.parse(readFileSync(join(dir, "cards", `${cid}.json`), "utf8"));
      } catch {
        failures.push(`card_index.json: lists ${String(cid).slice(0, 12)}… but no such card file — INVENTED`);
        break;
      }
      if (card.pubkey !== PINNED_PUBKEY) {
        failures.push(`${String(cid).slice(0, 12)}…: pubkey is not the published card-attestation key`);
        break;
      }
      const pre = canonicalPreimage(card.body);
      if (createHash("sha256").update(pre).digest("hex") !== card.id) {
        failures.push(`${String(cid).slice(0, 12)}…: id does not recompute from its own body — FABRICATED`);
        break;
      }
      if (!verifyEd25519(PINNED_PUBKEY, card.signature, pre)) {
        failures.push(`${String(cid).slice(0, 12)}…: signature does not verify under the pinned key`);
        break;
      }
    }
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
