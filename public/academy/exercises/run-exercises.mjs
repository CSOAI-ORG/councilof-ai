// SPDX-License-Identifier: CC0-1.0
/**
 * run-exercises.mjs — the CSOAI Academy reproducible exercises.
 *
 * Each exercise re-runs one published measurement from its public inputs and compares YOUR
 * result with the PUBLISHED result. Both are written as one canonical object
 *
 *     {"measurement":"<name>","value":<value>}      (keys sorted, no whitespace)
 *
 * and an exercise counts as REPRODUCED only when the two sha256 digests are equal AND the
 * exercise's negative control fails the way it must (a check that cannot fail proves nothing).
 * Numbers are never typed here: every value is read from the live site when you run it.
 *
 * Runs unchanged in Node 20+ and in a current browser (it only needs fetch and WebCrypto
 * SHA-256 / Ed25519). No dependencies.
 *
 *     node run-exercises.mjs                    # every exercise, against https://councilof.ai
 *     node run-exercises.mjs --only verify-card,inclusion
 *     node run-exercises.mjs --json > transcript.json
 *     node run-exercises.mjs --card <card id> --leaf-index <n> --edge <origin>
 *
 * Exit 0: every exercise ran was REPRODUCED. 1: at least one NOT_REPRODUCED. 2: none failed,
 * but at least one was UNCHECKABLE (could not be checked is a different claim from failed).
 *
 * This is a learning tool. A REPRODUCED line says your recomputation agrees with the published
 * bytes at the time you ran it. It certifies nothing about you, the Council of AI or any system.
 */

export const SCHEMA = "csoai.academy-exercises/0.1";
export const TRANSCRIPT_SCHEMA = "csoai.academy-exercise-transcript/0.1";
export const DEFAULT_EDGE = "https://councilof.ai";
const UA = "csoai-academy-exercises/0.1 (+https://councilof.ai/academy/exercises/)";
const IS_NODE = typeof process !== "undefined" && !!process.versions?.node;

// ---------------------------------------------------------------- small utilities

export class Uncheckable extends Error {}

const enc = new TextEncoder();
const utf8 = (s) => enc.encode(s);
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export function hexToBytes(h) {
  if (typeof h !== "string" || h.length % 2 || /[^0-9a-f]/i.test(h)) throw new Error(`not hex: ${String(h).slice(0, 20)}`);
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(2 * i, 2 * i + 2), 16);
  return out;
}
export function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function concat(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
function subtle() {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Uncheckable("this runtime has no WebCrypto (crypto.subtle)");
  return s;
}
export async function sha256(bytes) {
  return new Uint8Array(await subtle().digest("SHA-256", bytes));
}
export async function sha256Hex(bytes) {
  return hex(await sha256(bytes));
}

/** Ed25519 verify; an Ed25519-less runtime is UNCHECKABLE, never INVALID. */
export async function ed25519Verify(publicKeyRaw, signature, message) {
  let key;
  try {
    key = await subtle().importKey("raw", publicKeyRaw, { name: "Ed25519" }, false, ["verify"]);
  } catch (e) {
    throw new Uncheckable(`this runtime cannot verify Ed25519 (${e?.message || e})`);
  }
  return subtle().verify({ name: "Ed25519" }, key, signature, message);
}

// ---------------------------------------------------------------- canonical JSON, two rules
//
// Rule A — the signed measurement cards (see /signed/HOW-TO-VERIFY.md): CPython
//   json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True). A float of
//   integral value is spelled "0.0", so numbers must never pass through a JavaScript number:
//   the tokeniser below keeps every numeric literal as the exact text the server sent.
// Rule B — the board stamp and the public-root envelope: keys sorted, no whitespace,
//   non-ASCII literal, numbers by ECMAScript Number::toString (what JSON.stringify emits).

const RAW = Symbol("raw-number");
export function parsePreservingNumbers(text) {
  let i = 0;
  const ws = () => { while (i < text.length && " \t\n\r".includes(text[i])) i++; };
  const str = () => {
    const s = i; i++;
    while (text[i] !== '"') { if (text[i] === "\\") i++; i++; if (i > text.length) throw new Error("unterminated string"); }
    i++;
    return JSON.parse(text.slice(s, i));
  };
  const val = () => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++; const o = {}; ws();
      if (text[i] === "}") { i++; return o; }
      for (;;) { ws(); const k = str(); ws(); i++; o[k] = val(); ws(); if (text[i] === ",") { i++; continue; } i++; return o; }
    }
    if (c === "[") {
      i++; const a = []; ws();
      if (text[i] === "]") { i++; return a; }
      for (;;) { a.push(val()); ws(); if (text[i] === ",") { i++; continue; } i++; return a; }
    }
    if (c === '"') return str();
    for (const [lit, v] of [["true", true], ["false", false], ["null", null]]) if (text.startsWith(lit, i)) { i += lit.length; return v; }
    const s = i;
    while (i < text.length && "-+.eE0123456789".includes(text[i])) i++;
    if (s === i) throw new Error(`unexpected character at ${i}`);
    return { [RAW]: text.slice(s, i) };
  };
  return val();
}
const asciiEscape = (s) => s.replace(/[\u0080-￿]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
const emitA = (v) =>
  v && typeof v === "object" && RAW in v ? v[RAW]
  : Array.isArray(v) ? "[" + v.map(emitA).join(",") + "]"
  : v && typeof v === "object" ? "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + emitA(v[k])).join(",") + "}"
  : JSON.stringify(v);
/** Rule A preimage of a value produced by parsePreservingNumbers. */
export const canonA = (v) => utf8(asciiEscape(emitA(v)));
/** Rule B canonical text (keys sorted by code unit — every key published here is ASCII). */
export const canonB = (v) =>
  v === null || typeof v !== "object" ? JSON.stringify(v)
  : Array.isArray(v) ? "[" + v.map(canonB).join(",") + "]"
  : "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonB(v[k])).join(",") + "}";

/** The object whose sha256 decides "reproduced": identical rule for yours and published. */
export const resultBytes = (measurement, value) => utf8(canonB({ measurement, value }));

// ---------------------------------------------------------------- reading the published bytes

function makeReader(edge, fetchImpl) {
  const inputs = [];
  async function getBytes(url) {
    const abs = new URL(url, edge).href;
    let res;
    try {
      res = await fetchImpl(abs, { headers: IS_NODE ? { "user-agent": UA, accept: "application/json, */*" } : { accept: "application/json, */*" } });
    } catch (e) {
      throw new Uncheckable(`could not reach ${abs}: ${e?.message || e}`);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    const row = { url: abs, status: res.status, bytes: bytes.length, sha256: await sha256Hex(bytes) };
    if (!inputs.some((r) => r.url === row.url && r.sha256 === row.sha256)) inputs.push(row);
    // A refusal (403/429/5xx) is not a verdict about the bytes: it makes the exercise UNCHECKABLE.
    if (!res.ok) throw new Uncheckable(`${abs} answered HTTP ${res.status}`);
    return bytes;
  }
  const getText = async (url) => new TextDecoder().decode(await getBytes(url));
  const getJson = async (url) => {
    const text = await getText(url);
    try { return JSON.parse(text); } catch { throw new Uncheckable(`${url} did not return JSON`); }
  };
  /** Call one tool on the published MCP server (JSON-RPC over HTTP; SSE or JSON reply). */
  async function mcp(tool, args) {
    const abs = new URL("/mcp", edge).href;
    let res;
    try {
      res = await fetchImpl(abs, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...(IS_NODE ? { "user-agent": UA } : {}) },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: tool, arguments: args } }),
      });
    } catch (e) {
      throw new Uncheckable(`could not reach ${abs}: ${e?.message || e}`);
    }
    if (!res.ok) throw new Uncheckable(`${abs} answered HTTP ${res.status}`);
    const text = await res.text();
    const data = text.trim().startsWith("{") ? text : text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
    let msg;
    try { msg = JSON.parse(data); } catch { throw new Uncheckable(`${tool}: unreadable MCP reply`); }
    const sc = msg?.result?.structuredContent;
    if (!sc) throw new Uncheckable(`${tool}: no structuredContent in the MCP reply`);
    return sc;
  }
  return { edge, inputs, getBytes, getText, getJson, mcp };
}

// ---------------------------------------------------------------- shared checks

async function pinnedKey(r, fragment, { didUrl } = {}) {
  const did = await r.getJson(didUrl || "/.well-known/did.json");
  const vm = (did.verificationMethod || []).find((v) => typeof v.id === "string" && v.id.endsWith(`#${fragment}`));
  if (!vm?.publicKeyJwk?.x) throw new Uncheckable(`#${fragment} is not in ${didUrl || "/.well-known/did.json"}`);
  return { id: vm.id, raw: b64urlToBytes(vm.publicKeyJwk.x), hex: hex(b64urlToBytes(vm.publicKeyJwk.x)) };
}

/** Verify one parsed Rule A card under the pinned key. Returns {state, reason}. */
export async function verifyCardParsed(card, pinnedHex) {
  if (!card || typeof card !== "object" || !card.body) return { state: "INVALID", reason: "no body" };
  if (card.pubkey !== pinnedHex) return { state: "INVALID", reason: "the card's pubkey is not the pinned #card-attestation-1 key" };
  const pre = canonA(card.body);
  const id = await sha256Hex(pre);
  if (id !== card.id) return { state: "INVALID", reason: "sha256(canonical body) != id" };
  let ok;
  try { ok = await ed25519Verify(hexToBytes(pinnedHex), hexToBytes(card.signature), pre); }
  catch (e) { if (e instanceof Uncheckable) return { state: "UNCHECKABLE", reason: e.message }; return { state: "INVALID", reason: `signature unreadable: ${e.message}` }; }
  return ok ? { state: "VALID", reason: null } : { state: "INVALID", reason: "Ed25519 signature does not verify under the pinned key" };
}

/** Tamper one string field of the body (first key in sorted order that holds a string). */
function tamperBody(card) {
  const copy = parsePreservingNumbers(emitA(card)); // deep copy that keeps raw numbers
  const k = Object.keys(copy.body).sort().find((key) => typeof copy.body[key] === "string");
  if (!k) throw new Uncheckable("card body has no string field to tamper");
  copy.body[k] = copy.body[k] + ".";
  return copy;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

function randomIndex(n) {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0] % n;
}

// ---------------------------------------------------------------- the exercises
//
// Each run() returns { measurement, yours, published, control:{description, discriminates},
// cross_check|null, note|null }. The harness below hashes, compares and records inputs.

export const EXERCISES = [
  {
    id: "board-totals",
    title: "Read the living board and count it yourself",
    realises: ["learn/board", "dashboard/learn"],
    teaches: "How a published total is derived from the rows beneath it, and why slots and measurements are two numbers that are never added.",
    tools: ["GET /api/gspc", "MCP board_totals"],
    inputs: ["/api/gspc"],
    steps: [
      "Fetch `/api/gspc`.",
      "Count the rows of `axes[]` (slots) and the rows whose `status` is `MEASURED` (measurements).",
      "Compare your two counts with `totals.axes` and `totals.measured_axes`.",
    ],
    expected: "Your `{axes, measured_axes}` equals the board's own totals, byte for byte after canonicalisation.",
    control: "Change one `MEASURED` row to `UNMEASURED` and count again: the result must no longer match.",
    minutes: 5,
    async run(r) {
      const board = await r.getJson("/api/gspc");
      if (!Array.isArray(board.axes) || !board.totals) throw new Uncheckable("/api/gspc has no axes[] or totals");
      const count = (axes) => ({ axes: axes.length, measured_axes: axes.filter((a) => a && a.status === "MEASURED").length });
      const yours = count(board.axes);
      const published = { axes: board.totals.axes, measured_axes: board.totals.measured_axes };
      const flipped = board.axes.map((a) => ({ ...a }));
      const at = flipped.findIndex((a) => a.status === "MEASURED");
      if (at >= 0) flipped[at].status = "UNMEASURED";
      const control = count(flipped);
      let cross = null;
      try {
        const sc = await r.mcp("board_totals", {});
        const get = (n) => (sc.counts || []).find((c) => c.name === n)?.value;
        const agree = get("axis_slots") === published.axes && get("measured") === published.measured_axes;
        cross = { tool: "MCP board_totals", state: agree ? "AGREES" : "DISAGREES", detail: { axis_slots: get("axis_slots"), measured: get("measured") } };
      } catch (e) { cross = { tool: "MCP board_totals", state: "UNCHECKABLE", detail: e.message }; }
      return {
        measurement: "gspc.totals",
        yours, published,
        control: { description: at >= 0 ? `axes[${at}].status set to UNMEASURED` : "no MEASURED row to flip", value: control, discriminates: at >= 0 && canonB(control) !== canonB(published) },
        cross_check: cross,
        note: `Read "${board.totals.public_count}" as two numbers, never one sum.`,
      };
    },
  },
  {
    id: "verify-card",
    title: "Verify one signed measurement card with your own code",
    realises: ["learn/board", "academy/attest"],
    teaches: "Pin the key before trusting a signature; recompute the id from the canonical body; tell VALID, INVALID and UNCHECKABLE apart.",
    tools: ["GET /.well-known/did.json", "GET /signed/card_index.json", "GET /signed/cards/<id>.json", "MCP verify_card"],
    inputs: ["/.well-known/did.json", "/signed/card_index.json", "/signed/cards/<id>.json"],
    steps: [
      "Read the `#card-attestation-1` key from `/.well-known/did.json` and pin it.",
      "Pick a card from `/signed/card_index.json` (default: the chain head) and fetch its `card_url`.",
      "Rebuild the preimage under Rule A (`/signed/HOW-TO-VERIFY.md`), check `sha256(preimage) == id`, then check the Ed25519 signature under the pinned key.",
      "Ask the published verifier (MCP `verify_card`) about the same card.",
    ],
    expected: "Your verdict for the card equals the verdict the published verifier returns for it.",
    control: "Append one character to a string in the body: your verifier must answer INVALID (id mismatch).",
    minutes: 10,
    async run(r, opts) {
      const key = await pinnedKey(r, "card-attestation-1");
      const index = await r.getJson("/signed/card_index.json");
      const rows = Array.isArray(index.cards) ? index.cards : [];
      const row = opts.card ? rows.find((x) => x.card === opts.card) : rows.find((x) => x.card === index.head) || rows[0];
      if (!row) throw new Uncheckable(opts.card ? `card ${opts.card} is not in the index` : "the index has no rows");
      const raw = await r.getText(row.card_url);
      const card = parsePreservingNumbers(raw);
      const mine = await verifyCardParsed(card, key.hex);
      if (mine.state === "UNCHECKABLE") throw new Uncheckable(mine.reason);
      const tampered = await verifyCardParsed(tamperBody(card), key.hex);
      const theirs = await r.mcp("verify_card", { card: new URL(row.card_url, r.edge).href });
      return {
        measurement: "verify_card",
        yours: { card: row.card, state: mine.state },
        published: { card: theirs.id || row.card, state: theirs.state },
        control: { description: "one character appended to a body string", value: tampered, discriminates: tampered.state === "INVALID" },
        cross_check: null,
        note: mine.reason ? `your verifier: ${mine.reason}` : `card ${row.card.slice(0, 16)}… on axis ${row.axis}; the published verifier is a cross-check, your own recomputation is the reproduction.`,
      };
    },
  },
  {
    id: "card-chain",
    title: "Re-measure the whole signed card chain",
    realises: ["academy/attest"],
    teaches: "A count published as 'measured' is a claim you can re-run: verify every card in the signed index and count the ones that verify.",
    tools: ["GET /signed/card_index.json", "GET /signed/cards/<id>.json", "GET /api/state"],
    inputs: ["/.well-known/did.json", "/signed/card_index.json", "/signed/cards/*.json", "/api/state"],
    steps: [
      "Run the verify-card check on every row of `/signed/card_index.json`.",
      "Count the VALID ones. A card you could not fetch is UNCHECKABLE, never INVALID.",
      "Compare your count with `/api/state` → `card_chain.bodies_verified_valid.value`.",
    ],
    expected: "Your count of VALID cards equals `card_chain.bodies_verified_valid.value`. This counts the signed card index only; never add it to another card corpus.",
    control: "Tamper one card body: your count must drop by one and no longer match.",
    minutes: 15,
    async run(r) {
      const key = await pinnedKey(r, "card-attestation-1");
      const index = await r.getJson("/signed/card_index.json");
      const rows = Array.isArray(index.cards) ? index.cards : [];
      if (!rows.length) throw new Uncheckable("the index has no rows");
      const verdicts = await mapLimit(rows, IS_NODE ? 8 : 6, async (row) => {
        try { return await verifyCardParsed(parsePreservingNumbers(await r.getText(row.card_url)), key.hex); }
        catch (e) { if (e instanceof Uncheckable) return { state: "UNCHECKABLE", reason: e.message }; throw e; }
      });
      const unchecked = verdicts.filter((v) => v.state === "UNCHECKABLE").length;
      if (unchecked) throw new Uncheckable(`${unchecked} card(s) could not be checked; a partial read is not a count`);
      const valid = verdicts.filter((v) => v.state === "VALID").length;
      const state = await r.getJson("/api/state");
      const published = state?.card_chain?.bodies_verified_valid?.value;
      if (typeof published !== "number") throw new Uncheckable("/api/state has no card_chain.bodies_verified_valid.value");
      const firstValid = verdicts.findIndex((v) => v.state === "VALID");
      let controlValue = null;
      if (firstValid >= 0) {
        const t = await verifyCardParsed(tamperBody(parsePreservingNumbers(await r.getText(rows[firstValid].card_url))), key.hex);
        controlValue = valid - (t.state === "INVALID" ? 1 : 0);
      }
      return {
        measurement: "card_chain.bodies_verified_valid",
        yours: valid, published,
        control: { description: "one VALID card's body tampered", value: controlValue, discriminates: controlValue !== null && controlValue !== published },
        cross_check: { tool: "index self-description", state: index.n_cards === rows.length ? "AGREES" : "DISAGREES", detail: { n_cards: index.n_cards, rows: rows.length } },
        note: `${rows.length} rows read; this is the signed card index (one of three separate card corpora).`,
      };
    },
  },
  {
    id: "inclusion",
    title: "Prove a leaf is inside the public root",
    realises: ["academy/foundations"],
    teaches: "Recompute a Merkle root from one leaf and its audit path, and why the leaf count is part of the check.",
    tools: ["GET /root.json", "GET /api/proof?sha=<leaf>", "MCP verify_inclusion"],
    inputs: ["/root.json", "/api/proof?sha=<leaf>"],
    steps: [
      "Fetch `/root.json`. Reject it unless `card_sha256.length == card_count`.",
      "Pick a leaf (default: a random one) and fetch its proof from `/api/proof?sha=<leaf>`. Reject the proof if `index >= card_count`.",
      "Walk the path: `parent = sha256(left || right)` over raw 32-byte digests; the index bit says which side you are on.",
      "Compare your root with `root.json` → `merkle_root`, and ask MCP `verify_inclusion` about the same leaf.",
    ],
    expected: "The root you recompute equals the published `merkle_root`.",
    control: "Flip the last hex digit of the leaf and walk the same path: the root must no longer match.",
    minutes: 10,
    async run(r, opts) {
      const root = await r.getJson("/root.json");
      const leaves = Array.isArray(root.card_sha256) ? root.card_sha256 : [];
      if (leaves.length !== root.card_count) {
        return { measurement: "public_root.merkle_root", yours: { leaves: leaves.length }, published: { card_count: root.card_count }, control: { description: "not reached", value: null, discriminates: true }, cross_check: null, note: "card_sha256.length != card_count: the published rule says reject." };
      }
      const i = Number.isInteger(opts.leafIndex) ? opts.leafIndex : randomIndex(leaves.length);
      const leaf = leaves[i];
      if (!leaf) throw new Uncheckable(`no leaf at index ${i}`);
      const proof = await r.getJson(`/api/proof?sha=${leaf}`);
      if (!Array.isArray(proof.proof) || !Number.isInteger(proof.index)) throw new Uncheckable("the proof endpoint returned no path");
      if (proof.index >= root.card_count) throw new Error(`proof index ${proof.index} >= card_count: reject`);
      const walk = async (start) => {
        let h = hexToBytes(start); let idx = proof.index;
        for (const sib of proof.proof) { h = await sha256(idx % 2 === 0 ? concat(h, hexToBytes(sib)) : concat(hexToBytes(sib), h)); idx = Math.floor(idx / 2); }
        return hex(h);
      };
      const mine = await walk(leaf);
      const flippedLeaf = leaf.slice(0, -1) + (leaf.at(-1) === "0" ? "1" : "0");
      const controlRoot = await walk(flippedLeaf);
      let cross;
      try {
        const sc = await r.mcp("verify_inclusion", { sha256: leaf });
        cross = { tool: "MCP verify_inclusion", state: sc.state === "VALID" ? "AGREES" : "DISAGREES", detail: sc.state };
      } catch (e) { cross = { tool: "MCP verify_inclusion", state: "UNCHECKABLE", detail: e.message }; }
      return {
        measurement: "public_root.merkle_root",
        yours: { leaf, merkle_root: mine },
        published: { leaf, merkle_root: root.merkle_root },
        control: { description: "last hex digit of the leaf flipped", value: controlRoot, discriminates: controlRoot !== root.merkle_root },
        cross_check: cross,
        note: `leaf index ${i} of ${root.card_count}, root as_of ${root.as_of}.`,
      };
    },
  },
  {
    id: "root-signature",
    title: "Check who signed the public root",
    realises: ["academy/foundations"],
    teaches: "Resolve a did:web identifier yourself and verify an Ed25519 signature over a stated preimage.",
    tools: ["GET https://csoai.org/.well-known/did.json (did:web resolution)", "GET /root.json"],
    inputs: ["https://csoai.org/.well-known/did.json", "/.well-known/did.json", "/root.json"],
    steps: [
      "Resolve `did:web:csoai.org` by fetching `https://csoai.org/.well-known/did.json` and read `#board-attestation-1`.",
      "Rebuild the preimage stated in `root.json` → `sig_preimage`: canonical JSON of `{kind, schema, as_of, merkle_root, card_count, did_intended}`.",
      "Verify `root.json` → `sig_ed25519` under that key.",
    ],
    expected: "The signature verifies under the key the root names (`did_intended`).",
    control: "Add one to `card_count` in the preimage: the signature must no longer verify.",
    minutes: 10,
    async run(r) {
      const root = await r.getJson("/root.json");
      const fragment = String(root.did_intended || "").split("#")[1];
      if (!fragment || !String(root.did_intended).startsWith("did:web:csoai.org#")) throw new Uncheckable(`unexpected did_intended ${root.did_intended}`);
      let key; let resolvedFrom = "https://csoai.org/.well-known/did.json";
      try { key = await pinnedKey(r, fragment, { didUrl: resolvedFrom }); }
      catch (e) { if (!(e instanceof Uncheckable)) throw e; resolvedFrom = "/.well-known/did.json (mirror)"; key = await pinnedKey(r, fragment); }
      const fields = (p) => ({ kind: p.kind, schema: p.schema, as_of: p.as_of, merkle_root: p.merkle_root, card_count: p.card_count, did_intended: p.did_intended });
      const sig = hexToBytes(root.sig_ed25519);
      const ok = await ed25519Verify(key.raw, sig, utf8(canonB(fields(root))));
      const bad = await ed25519Verify(key.raw, sig, utf8(canonB(fields({ ...root, card_count: root.card_count + 1 }))));
      let mirror = null;
      try { const m = await pinnedKey(r, fragment); mirror = { tool: "councilof.ai DID mirror", state: m.hex === key.hex ? "AGREES" : "DISAGREES", detail: resolvedFrom }; }
      catch (e) { mirror = { tool: "councilof.ai DID mirror", state: "UNCHECKABLE", detail: e.message }; }
      return {
        measurement: "public_root.signature",
        yours: { merkle_root: root.merkle_root, signer: key.id, state: ok ? "VALID" : "INVALID" },
        published: { merkle_root: root.merkle_root, signer: root.did_intended, state: "VALID" },
        control: { description: "card_count + 1 in the preimage", value: bad ? "VALID" : "INVALID", discriminates: bad === false },
        cross_check: mirror,
        note: `key resolved from ${resolvedFrom}.`,
      };
    },
  },
  {
    id: "charter-hash",
    title: "Reproduce the charter hash",
    realises: ["academy/foundations"],
    teaches: "A published digest binds exact bytes: fetch the document the pointer names and hash it yourself.",
    tools: ["GET /.well-known/charter.json", "GET the charter document it points to"],
    inputs: ["/.well-known/charter.json", "current.machine"],
    steps: [
      "Fetch `/.well-known/charter.json` and read `current.machine` and `current.sha256`.",
      "Fetch the bytes at `current.machine` exactly as served and compute their sha256.",
    ],
    expected: "sha256 of the served charter bytes equals `current.sha256`.",
    control: "Hash the same bytes with one newline appended: the digest must differ.",
    minutes: 5,
    async run(r) {
      const ptr = await r.getJson("/.well-known/charter.json");
      const cur = ptr?.current;
      if (!cur?.machine || !cur?.sha256) throw new Uncheckable("charter.json has no current.machine / current.sha256");
      const bytes = await r.getBytes(cur.machine);
      const mine = await sha256Hex(bytes);
      const controlDigest = await sha256Hex(concat(bytes, utf8("\n")));
      return {
        measurement: "charter.sha256",
        yours: { url: cur.machine, version: cur.version ?? null, sha256: mine },
        published: { url: cur.machine, version: cur.version ?? null, sha256: cur.sha256 },
        control: { description: "one newline appended", value: controlDigest, discriminates: controlDigest !== cur.sha256 },
        cross_check: null,
        note: `A digest binds bytes, not authorship${cur.signature_state ? ` (signature_state: ${cur.signature_state})` : ""}.`,
      };
    },
  },
  {
    id: "three-corpora",
    title: "Keep the three card corpora apart",
    realises: ["learn/board"],
    teaches: "Three published card counts describe three different sets. Measure their overlap instead of adding them.",
    tools: ["GET /root.json", "GET /signed/card_index.json", "GET /api/state"],
    inputs: ["/root.json", "/signed/card_index.json", "/api/state"],
    steps: [
      "Collect the public-root leaves (`root.json` → `card_sha256`) and the signed-index ids (`card_index.json` → `cards[].card`).",
      "Count the identifiers that appear in both sets.",
      "Compare with `/api/state` → `signed_cards.corpus_relation`.",
    ],
    expected: "Your `{relationship, identifier_overlap, public_root_leaves, separately_indexed_signed_cards}` equals the published `corpus_relation`. The two sizes are never added.",
    control: "Copy one signed-index id into the root set: the overlap must become 1 and no longer match.",
    minutes: 5,
    async run(r) {
      const root = await r.getJson("/root.json");
      const index = await r.getJson("/signed/card_index.json");
      const state = await r.getJson("/api/state");
      const rel = state?.signed_cards?.corpus_relation;
      if (!rel) throw new Uncheckable("/api/state has no signed_cards.corpus_relation");
      const ids = (index.cards || []).map((c) => c.card);
      const relation = (rootLeaves) => {
        const set = new Set(rootLeaves);
        const overlap = ids.filter((id) => set.has(id)).length;
        return { relationship: overlap === 0 ? "SEPARATE_CORPORA" : "OVERLAPPING", identifier_overlap: overlap, public_root_leaves: rootLeaves.length, separately_indexed_signed_cards: ids.length };
      };
      const yours = relation(root.card_sha256 || []);
      const published = { relationship: rel.relationship, identifier_overlap: rel.identifier_overlap, public_root_leaves: rel.public_root_leaves, separately_indexed_signed_cards: rel.separately_indexed_signed_cards };
      const control = relation([...(root.card_sha256 || []).slice(0, -1), ids[0]]);
      return {
        measurement: "corpus_relation",
        yours, published,
        control: { description: "one signed-index id placed in the root set", value: control, discriminates: canonB(control) !== canonB(published) },
        cross_check: null,
        note: "The third corpus (the build-time cards bundle) is an aggregate that signs and measures nothing; it is not read here.",
      };
    },
  },
  {
    id: "board-stamp",
    title: "Verify the board snapshot stamp",
    realises: ["learn/board", "academy/foundations"],
    teaches: "A signature over a whole payload: remove the stamp, canonicalise what is left under the stated rule, verify under the named key.",
    tools: ["GET /api/gspc", "GET /.well-known/did.json"],
    inputs: ["/api/gspc", "/.well-known/did.json"],
    steps: [
      "Fetch `/api/gspc` and set `site_attestation` aside.",
      "Canonicalise the rest under the rule in `site_attestation.sig_input` (keys sorted, no whitespace, non-ASCII literal, ECMAScript numbers).",
      "Verify `site_attestation.sig` under `#board-attestation-1` from `/.well-known/did.json`.",
    ],
    expected: "The stamp verifies. It attests the integrity of the snapshot as served, not a re-measurement.",
    control: "Change one axis row's status before canonicalising: the stamp must no longer verify.",
    minutes: 10,
    async run(r) {
      const board = await r.getJson("/api/gspc");
      const sa = board.site_attestation;
      if (!sa?.sig) throw new Uncheckable("/api/gspc carries no site_attestation");
      const key = await pinnedKey(r, "board-attestation-1");
      const payload = { ...board };
      delete payload.site_attestation;
      const sig = hexToBytes(sa.sig);
      const ok = await ed25519Verify(key.raw, sig, utf8(canonB(payload)));
      const tampered = { ...payload, axes: payload.axes.map((a, j) => (j === 0 ? { ...a, status: a.status === "MEASURED" ? "UNMEASURED" : "MEASURED" } : a)) };
      const bad = await ed25519Verify(key.raw, sig, utf8(canonB(tampered)));
      return {
        measurement: "gspc.site_attestation",
        yours: { signer: key.id, state: ok ? "VALID" : "INVALID" },
        published: { signer: sa.signer, state: "VALID" },
        control: { description: "axes[0].status changed", value: bad ? "VALID" : "INVALID", discriminates: bad === false },
        cross_check: { tool: "stamp key vs DID key", state: sa.public_key_x && hex(b64urlToBytes(sa.public_key_x)) === key.hex ? "AGREES" : "DISAGREES", detail: sa.signer },
        note: "The stamp covers the bytes as served; it is not a re-measurement of any axis.",
      };
    },
  },
];

// ---------------------------------------------------------------- the harness

export async function runExercise(ex, { edge = DEFAULT_EDGE, fetchImpl = globalThis.fetch, card, leafIndex } = {}) {
  const r = makeReader(edge, fetchImpl);
  const started_at = new Date().toISOString();
  const base = { id: ex.id, title: ex.title, started_at };
  try {
    const out = await ex.run(r, { card, leafIndex });
    const yours_sha256 = await sha256Hex(resultBytes(out.measurement, out.yours));
    const published_sha256 = await sha256Hex(resultBytes(out.measurement, out.published));
    const equal = yours_sha256 === published_sha256;
    const state = equal && out.control.discriminates ? "REPRODUCED" : "NOT_REPRODUCED";
    const reason = !equal ? "your result differs from the published result" : !out.control.discriminates ? "the negative control did not fail, so the check proved nothing" : null;
    return { ...base, state, reason, measurement: out.measurement, yours: out.yours, published: out.published, yours_sha256, published_sha256, control: out.control, cross_check: out.cross_check, note: out.note, inputs: r.inputs, finished_at: new Date().toISOString() };
  } catch (e) {
    const state = e instanceof Uncheckable ? "UNCHECKABLE" : "NOT_REPRODUCED";
    return { ...base, state, reason: e?.message || String(e), inputs: r.inputs, finished_at: new Date().toISOString() };
  }
}

export async function runAll({ only, ...opts } = {}) {
  const chosen = only?.length ? EXERCISES.filter((e) => only.includes(e.id)) : EXERCISES;
  const results = [];
  for (const ex of chosen) results.push(await runExercise(ex, opts));
  return {
    schema: TRANSCRIPT_SCHEMA,
    edge: opts.edge || DEFAULT_EDGE,
    runner: "run-exercises.mjs",
    run_at: new Date().toISOString(),
    rubric: "An exercise is complete only when state is REPRODUCED: yours_sha256 == published_sha256 and the negative control failed as it must.",
    not_a_certification: true,
    results,
  };
}

/** The metadata the page, the manifest and the tests read (no run functions). */
export function exerciseMetadata() {
  return EXERCISES.map(({ run, ...meta }) => meta);
}

// ---------------------------------------------------------------- command line

if (IS_NODE) {
  const { pathToFileURL } = await import("node:url");
  if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
    const opts = {
      edge: flag("--edge") || DEFAULT_EDGE,
      only: flag("--only") ? flag("--only").split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      card: flag("--card"),
      leafIndex: flag("--leaf-index") !== undefined ? Number(flag("--leaf-index")) : undefined,
    };
    const unknown = (opts.only || []).filter((id) => !EXERCISES.some((e) => e.id === id));
    if (unknown.length) { console.error(`unknown exercise(s): ${unknown.join(", ")}; known: ${EXERCISES.map((e) => e.id).join(", ")}`); process.exit(2); }
    const transcript = await runAll(opts);
    if (args.includes("--json")) {
      process.stdout.write(JSON.stringify(transcript, null, 2) + "\n");
    } else {
      for (const x of transcript.results) {
        console.log(`${x.state.padEnd(15)} ${x.id.padEnd(15)} ${x.state === "REPRODUCED" ? `sha256 ${x.yours_sha256.slice(0, 16)}…` : x.reason}`);
        if (x.note) console.log(`${" ".repeat(32)}${x.note}`);
        if (x.cross_check) console.log(`${" ".repeat(32)}cross-check ${x.cross_check.tool}: ${x.cross_check.state}`);
      }
      console.log(`\n${transcript.rubric}\nNot a certification of anything.`);
    }
    const states = transcript.results.map((x) => x.state);
    process.exit(states.includes("NOT_REPRODUCED") ? 1 : states.includes("UNCHECKABLE") ? 2 : 0);
  }
}
