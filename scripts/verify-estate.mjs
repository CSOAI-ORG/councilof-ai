#!/usr/bin/env node
/**
 * verify-estate — check the Council of AI evidence chain from OUTSIDE, trusting nothing of ours.
 *
 * The estate claims its evidence is independently recomputable for free. This is that claim as a
 * runnable script. It fetches only published bytes, takes the signing keys from the DID document
 * on a DIFFERENT host, and does the arithmetic locally. No CSOAI service is trusted, no account is
 * needed, nothing is paid.
 *
 * Node >= 18. No dependencies — Ed25519 comes from node:crypto.
 *
 *   node scripts/verify-estate.mjs             # all 335 cards + the root
 *   node scripts/verify-estate.mjs --limit 25  # quick sample
 *
 * Exit 0 if every check passes, 1 otherwise.
 *
 * WHAT A PASS DOES NOT MEAN — printed by the script itself, because a verifier that oversells its
 * own result is worse than none. One key signs every card, so a pass proves CUSTODY, not
 * independence: it shows CSOAI signed these bytes, not that anyone else agrees with them. The root
 * is signed and not anchored, so a pass proves WHO and not WHEN. And signature validity is not
 * measurement correctness.
 */
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";

const SITE = process.env.CSOAI_SITE || "https://councilof.ai";
const DID_URL = process.env.CSOAI_DID || "https://csoai.org/.well-known/did.json";
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? Number(process.argv[i + 1]) : Infinity;
})();

const UA = { "user-agent": "csoai-verify-estate" };
const getJSON = async (u) => {
  const r = await fetch(u, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
};

/** Raw 32-byte Ed25519 public key -> a KeyObject, via the fixed SPKI DER prefix. */
const edKey = (raw32) =>
  createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw32]),
    format: "der",
    type: "spki",
  });

/**
 * The canonical preimage each card publishes about itself in `preimage_rule`:
 *   json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)
 *
 * TWO PYTHON-SPECIFIC BEHAVIOURS MAKE THIS UNREPRODUCIBLE BY A NAIVE JSON.stringify.
 *
 * 1. ensure_ascii=True escapes every non-ASCII codepoint as \uXXXX; JS emits it literally.
 *
 * 2. Python keeps the float/int distinction and renders 1.0 as "1.0". JavaScript has one number
 *    type, so JSON.parse("1.0") then JSON.stringify gives "1". MEASURED on this chain 2026-09-05:
 *    117 of 335 cards (34.9%) carry an `accuracy` that is a whole-number float, and every one of
 *    them hashes differently in JS than in Python. A verifier that ignores this reports a third of
 *    an intact chain as INVALID.
 *
 * The fix is to never let the numbers through a JS number at all: parse the raw card bytes with a
 * tokeniser that keeps every numeric literal as the exact text the server sent, and re-emit that
 * text verbatim. Ordering and escaping then match Python exactly.
 */
const RAW = Symbol("raw-number");
function parsePreservingNumbers(text) {
  let i = 0;
  const ws = () => { while (i < text.length && " \t\n\r".includes(text[i])) i++; };
  const val = () => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++; const o = {}; ws();
      if (text[i] === "}") { i++; return o; }
      for (;;) { ws(); const k = str(); ws(); i++; /* : */ o[k] = val(); ws();
        if (text[i] === ",") { i++; continue; } i++; return o; }
    }
    if (c === "[") {
      i++; const a = []; ws();
      if (text[i] === "]") { i++; return a; }
      for (;;) { a.push(val()); ws(); if (text[i] === ",") { i++; continue; } i++; return a; }
    }
    if (c === '"') return str();
    if (text.startsWith("true", i)) { i += 4; return true; }
    if (text.startsWith("false", i)) { i += 5; return false; }
    if (text.startsWith("null", i)) { i += 4; return null; }
    const s = i; while (i < text.length && "-+.eE0123456789".includes(text[i])) i++;
    return { [RAW]: text.slice(s, i) };          // the literal, exactly as sent
  };
  const str = () => { const s = i; i++;
    while (text[i] !== '"') { if (text[i] === "\\") i++; i++; }
    i++; return JSON.parse(text.slice(s, i)); };
  return val();
}
const asciiEscape = (s) =>
  s.replace(/[\u0080-\uffff]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
function emit(v) {
  if (v && typeof v === "object" && RAW in v) return v[RAW];
  if (Array.isArray(v)) return "[" + v.map(emit).join(",") + "]";
  if (v && typeof v === "object")
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + emit(v[k])).join(",") + "}";
  return JSON.stringify(v);
}
const canonical = (bodyRawText) => Buffer.from(asciiEscape(emit(parsePreservingNumbers(bodyRawText))), "latin1");

/** Pull the raw text of the "body" member out of a card document without parsing its numbers. */
function rawBody(cardText) {
  const k = cardText.indexOf('"body"');
  let i = cardText.indexOf("{", k), depth = 0, inStr = false;
  for (let j = i; j < cardText.length; j++) {
    const c = cardText[j];
    if (inStr) { if (c === "\\") j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return cardText.slice(i, j + 1); }
  }
  throw new Error("body not found");
}

const b64u = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

let failures = 0;
const fail = (m) => { failures++; console.error(`  ✗ ${m}`); };

console.log(`verify-estate — site ${SITE}, keys from ${DID_URL}\n`);

// ---- keys, from a different host than the evidence -------------------------------------------
// E-T5-01: a check that cannot reach its inputs must say CANNOT-RUN, not FAIL. A network flake
// is not a broken chain, and reporting it as one teaches everybody to ignore this gate.
let did;
try {
  did = await getJSON(DID_URL);
} catch (e) {
  console.error(`CANNOT-RUN: the DID document at ${DID_URL} is unreachable (${e.message}).`);
  console.error("This is a reachability problem, not a verification failure. Nothing was checked.");
  process.exit(process.env.CI ? 0 : 2);
}
const keys = Object.fromEntries(
  (did.verificationMethod || [])
    .filter((v) => v.publicKeyJwk?.x)
    .map((v) => [v.id.split("#").pop(), b64u(v.publicKeyJwk.x)]),
);
console.log(`DID ${did.id} publishes ${Object.keys(keys).length} keys: ${Object.keys(keys).join(", ")}\n`);

// ---- the signed cards ------------------------------------------------------------------------
let index;
try {
  index = await getJSON(`${SITE}/signed/card_index.json`);
} catch (e) {
  console.error(`CANNOT-RUN: ${SITE}/signed/card_index.json is unreachable (${e.message}).`);
  console.error("This is a reachability problem, not a verification failure. Nothing was checked.");
  process.exit(process.env.CI ? 0 : 2);
}
const cards = index.cards.slice(0, LIMIT);
console.log(`card_index: n_cards ${index.n_cards}, n_cells ${index.n_cells}, checking ${cards.length}`);

let idOK = 0, sigOK = 0, idxOK = 0;
for (const c of cards) {
  let d, txt;
  try {
    txt = await (await fetch(SITE + c.card_url, { headers: UA })).text();
    d = JSON.parse(txt);
  } catch (e) { fail(`fetch ${c.card_url}: ${e.message}`); continue; }
  const pre = canonical(rawBody(txt));
  if (createHash("sha256").update(pre).digest("hex") === d.id) idOK++;
  else fail(`id != sha256(canonical(body)) for ${d.id}`);
  if (d.id === c.card && d.signature === c.sig && d.pubkey === c.pubkey) idxOK++;
  else fail(`card body disagrees with card_index for ${c.card}`);
  try {
    if (edVerify(null, pre, edKey(Buffer.from(d.pubkey, "hex")), Buffer.from(d.signature, "hex"))) sigOK++;
    else fail(`Ed25519 INVALID for ${d.id}`);
  } catch (e) { fail(`Ed25519 error for ${d.id}: ${e.message}`); }
}
console.log(`  id == sha256(canonical(body)) : ${idOK}/${cards.length}`);
console.log(`  agrees with card_index        : ${idxOK}/${cards.length}`);
console.log(`  Ed25519 signature valid       : ${sigOK}/${cards.length}`);

// is the card key the one the DID publishes?
const cardKey = cards[0]?.pubkey;
const boundTo = Object.entries(keys).find(([, k]) => k.toString("hex") === cardKey)?.[0];
if (boundTo) console.log(`  card key bound to DID         : #${boundTo}`);
else fail("card signing key is NOT in the published DID document");

// ---- the signed root -------------------------------------------------------------------------
const root = await getJSON(`${SITE}/root.json`);
const rootPre = Buffer.from(
  JSON.stringify(
    Object.fromEntries(
      ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]
        .filter((k) => k in root).sort().map((k) => [k, root[k]]),
    ),
  ),
);
const rootKid = String(root.did_intended || "").split("#").pop();
if (!keys[rootKid]) fail(`root names key #${rootKid}, which the DID does not publish`);
else if (edVerify(null, rootPre, edKey(keys[rootKid]), Buffer.from(root.sig_ed25519, "hex")))
  console.log(`\nroot.json signature           : VALID against #${rootKid} (${root.card_count} cards, merkle ${root.merkle_root.slice(0, 12)}…)`);
else fail(`root.json signature INVALID against #${rootKid}`);

// ---- Rule B artefacts ------------------------------------------------------------------------
//
// The estate publishes TWO canonicalisations and until 2026-09-06 this verifier only knew one.
//
//   Rule A  the 335 measurement cards. CPython json.dumps(sort_keys, separators, ensure_ascii=True):
//           non-ASCII escaped, and an integral float renders "0.0". Reproducing it in JavaScript
//           needs the raw numeric literals preserved — see parsePreservingNumbers above.
//   Rule B  harness/arena/canon.py. Sorted keys, compact, ensure_ascii=FALSE, and integral floats
//           NORMALISED TO INTS. That is precisely what a JS engine does natively, so Rule B needs
//           none of the machinery Rule A does — JSON.stringify over sorted keys IS Rule B.
//
// The signature is Ed25519 over the content_id AS ASCII HEX — not over the preimage, and not over
// the digest bytes. Neither artefact publishes that; it was established by trial on 2026-09-06 and
// is recorded here so the next reader does not repeat it.
const ruleB = (v) =>
  Array.isArray(v) ? "[" + v.map(ruleB).join(",") + "]"
  : v && typeof v === "object"
    ? "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + ruleB(v[k])).join(",") + "}"
    : JSON.stringify(v);

for (const name of ["arena_scoreboard", "eat_compliance_board"]) {
  let doc;
  try { doc = await getJSON(`${SITE}/signed/${name}.json`); }
  catch (e) { fail(`fetch ${name}: ${e.message}`); continue; }
  const sig = doc.signature;
  if (!sig?.sig || !sig?.content_id) { fail(`${name}: no signature block`); continue; }
  const { signature: _drop, ...body } = doc;
  const cid = createHash("sha256").update(Buffer.from(ruleB(body))).digest("hex");
  if (cid !== sig.content_id) { fail(`${name}: content_id does not recompute`); continue; }
  const kid = String(sig.kid || "").split("#").pop();
  const pk = keys[kid];
  if (!pk) { fail(`${name}: names key #${kid}, which the DID does not publish`); continue; }
  try {
    if (edVerify(null, Buffer.from(cid, "ascii"), edKey(pk), Buffer.from(sig.sig, "hex")))
      console.log(`Rule B ${name.padEnd(22)}: VALID against #${kid}`);
    else fail(`${name}: Ed25519 INVALID against #${kid}`);
  } catch (e) { fail(`${name}: Ed25519 error — ${e.message}`); }
}

// gspc-board.signed.json is Rule B too but has its own preimage shape and its own published
// verifier — `node scripts/gspc-board-verify.mjs <file>`, named in the artefact's own `verify`
// field. It is deliberately NOT reimplemented here: duplicating a subtle recipe in a second place
// is how the two drift, and the artefact already tells a reader exactly what to run.
console.log(`Rule B gspc-board.signed    : run scripts/gspc-board-verify.mjs (its own published verifier)`);

// ---- the anchor question, answered honestly ---------------------------------------------------
const anchored = ["ots", "opentimestamps", "anchor", "rekor"].some((k) => JSON.stringify(root).toLowerCase().includes(`"${k}`));
console.log(`root anchored to a timechain  : ${anchored ? "yes" : "NO — signed, not anchored"}`);

console.log(`
what a pass here does NOT establish
  · one key signs every card, so this proves CUSTODY, not independence
  · the root is signed and not anchored, so this proves WHO and not WHEN
  · signature validity is not measurement correctness`);

console.log(failures ? `\n✗ ${failures} check(s) failed.` : `\n✓ all checks passed.`);
process.exit(failures ? 1 : 0);
