#!/usr/bin/env node
/**
 * live-surface-contract.mjs — the live surfaces, asserted so a break cannot pass.
 *
 * WHY THIS EXISTS (2026-08-26). This estate's signature defect is a checker that cannot
 * observe its own failure. Four real instances, all found in one day:
 *   · a prerender report read `errored` while the writer wrote `err`, so 515 dead routes
 *     reported "0 errored";
 *   · three E2E workflows pointed at csoai-site.pages.dev, a Pages project carrying none of
 *     this repo's Functions, so the "live truth check" ran where it could never pass;
 *   · a freshness test compared a field that did not exist, so `null == null` passed for
 *     every input;
 *   · the published card recipe verified a FORGED card as VALID, because it checked the card
 *     against the key the card itself shipped with.
 *
 * Every one of those is the same bug: an assertion that reads something absent, or checks a
 * value against itself. So this file is built so neither is expressible.
 *
 *   1. FIELD PRESENCE IS AN ASSERTION. Nothing is read with `a?.b`. Every read goes through
 *      `at(obj, "a.b")`, which THROWS when the path is missing. A check on a nonexistent
 *      field fails loudly instead of comparing undefined to undefined forever.
 *   2. DERIVED NUMBERS ARE RECOMPUTED, NEVER TRUSTED. A count published beside a list is
 *      compared to the length of that list. A sentence carrying numbers is compared to the
 *      sentence rebuilt from those numbers.
 *   3. SIGNATURES ARE PINNED TO A KEY THE PAYLOAD DID NOT SUPPLY. Keys come from
 *      /.well-known/did.json. A payload's own `public_key_x` is checked to MATCH a published
 *      key and is never used as the trust root.
 *   4. IT MUST PROVE IT CAN FAIL. `--selftest` runs the same assertions over deliberately
 *      broken inputs — a forged card, a tampered board, a self-signed envelope, a stale
 *      freshness date, a header lie, a count that does not derive — and exits non-zero unless
 *      EVERY one of them is caught. A pass with no negative control proves nothing, so a run
 *      that cannot fail its own selftest refuses to report on the live site at all.
 *
 * Surfaces: /api/gspc · /api/state · /api/mcp · /api/tools · /api/fines · /api/specialists ·
 * /signed/card_index.json · /signed/cards/* · /signed/verify-card.mjs · /rating-the-raters ·
 * /claims-register · /os
 *
 * Read-only. Fetches public URLs, changes nothing, needs no secrets.
 *
 *   node scripts/live-surface-contract.mjs [--host https://councilof.ai]
 *   node scripts/live-surface-contract.mjs --selftest     # negative controls only, no network
 */
import { webcrypto as wc } from "node:crypto";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const HOST = arg("host", "https://councilof.ai").replace(/\/$/, "");
const UA = "CSOAI-live-surface-contract/1.0";

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); fails.push(m); };

/**
 * Read `path` out of `obj` or THROW. This is the whole point of the file: an assertion may
 * not read a field that does not exist. `at(x, "totals.axes")` on a payload without
 * `measured_axes` cannot silently become `undefined === undefined`.
 */
function at(obj, path) {
  let cur = obj;
  const parts = path.split(".");
  for (let i = 0; i < parts.length; i++) {
    const k = parts[i];
    if (cur === null || typeof cur !== "object" || !(k in cur))
      throw new Error(`field missing: ${parts.slice(0, i + 1).join(".")}`);
    cur = cur[k];
  }
  return cur;
}
/** Run a named group of assertions; a thrown missing-field is a failure, never a skip. */
function check(name, fn) {
  try { const d = fn(); pass(d ? `${name} — ${d}` : name); }
  catch (e) { fail(`${name}: ${e.message}`); }
}
async function checkAsync(name, fn) {
  try { const d = await fn(); pass(d ? `${name} — ${d}` : name); }
  catch (e) { fail(`${name}: ${e.message}`); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const unhex = (s) => Uint8Array.from(String(s).match(/../g).map((b) => parseInt(b, 16)));
const b64uToBytes = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** canonical JSON: recursively sorted keys, no whitespace (must match functions/api/*.ts). */
const canon = (o) =>
  o === null || typeof o !== "object" ? JSON.stringify(o)
  : Array.isArray(o) ? "[" + o.map(canon).join(",") + "]"
  : "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";

/** CPython json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True) — card preimage. */
const CARD_FLOAT_FIELDS = new Set(["accuracy", "ci_low", "ci_high", "recall", "precision", "f1"]);
function pyCanon(v, key = null) {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    assert(Number.isFinite(v), `non-finite number at ${key}`);
    return Number.isInteger(v) && CARD_FLOAT_FIELDS.has(key) ? v.toFixed(1) : String(v);
  }
  if (typeof v === "string") return pyStr(v);
  if (Array.isArray(v)) return "[" + v.map((x) => pyCanon(x, key)).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => pyStr(k) + ":" + pyCanon(v[k], k)).join(",") + "}";
}
function pyStr(s) {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (c < 0x20) out += "\\u" + c.toString(16).padStart(4, "0");
    else if (c < 0x7f) out += ch;
    else if (c <= 0xffff) out += "\\u" + c.toString(16).padStart(4, "0");
    else { const x = c - 0x10000; out += "\\u" + (0xd800 + (x >> 10)).toString(16).padStart(4, "0") + "\\u" + (0xdc00 + (x & 0x3ff)).toString(16).padStart(4, "0"); }
  }
  return out + '"';
}

async function edVerify(rawPub, sigBytes, msgBytes) {
  const key = await wc.subtle.importKey("raw", rawPub, { name: "Ed25519" }, false, ["verify"]);
  return wc.subtle.verify("Ed25519", key, sigBytes, msgBytes);
}

// ───────────────────────────── the assertions ─────────────────────────────
// Each takes already-fetched data so the SAME code can be run over the deliberately
// broken payloads in --selftest. An assertion that only exists on the live path cannot
// be proven to fail, so no assertion below is written inline against the network.

/** /api/gspc — counts must DERIVE, and the snapshot signature must verify against a PUBLISHED key. */
function assertGspcCounts(board) {
  const axes = at(board, "totals.axes");
  const measured = at(board, "totals.measured_axes");
  const unmeasured = at(board, "totals.unmeasured_axes");
  const publicCount = at(board, "totals.public_count");
  const rows = at(board, "axes");
  assert(typeof axes === "number" && typeof measured === "number" && typeof unmeasured === "number",
    `totals.axes/measured_axes/unmeasured_axes must be numbers (got ${typeof axes}/${typeof measured}/${typeof unmeasured})`);
  assert(Array.isArray(rows), "axes is not an array");
  // The slot count must equal the rows actually shipped, not a number typed beside them.
  assert(rows.length === axes, `totals.axes ${axes} but ${rows.length} axis rows shipped`);
  assert(axes - measured === unmeasured, `does not balance: ${axes} − ${measured} ≠ ${unmeasured}`);
  // The sentence must be rebuildable from the integers beside it (ADR-001 grammar).
  const derived = `${axes} axes · ${measured} measured`;
  assert(String(publicCount).startsWith(derived), `public_count ${JSON.stringify(publicCount)} does not derive (want "${derived}…")`);
  // measured_axes must equal the rows that actually carry a measurement.
  const withRun = rows.filter((r) => r && typeof r === "object" && "n" in r && typeof r.n === "number" && r.n > 0).length;
  assert(withRun === measured, `totals.measured_axes ${measured} but ${withRun} axis row(s) carry n > 0`);
  return `${axes} axes · ${measured} measured · ${unmeasured} unmeasured, all derived from ${rows.length} rows`;
}

/** The board snapshot signature. Trust root is did.json, never the payload's own key. */
async function assertGspcAttestation(board, publishedKeys) {
  const att = at(board, "site_attestation");
  const sig = at(att, "sig");
  const alg = at(att, "alg");
  const shippedKey = at(att, "public_key_x");
  assert(alg === "Ed25519", `site_attestation.alg is ${alg}, not Ed25519`);
  assert(publishedKeys.length > 0, "no published Ed25519 keys in did.json to verify against");
  // A payload that ships its own key proves only self-consistency — the forged-card defect.
  const shipped = b64uToBytes(shippedKey);
  assert(publishedKeys.some((k) => Buffer.from(k.raw).equals(shipped)),
    "site_attestation.public_key_x is NOT among the did.json keys — the payload is vouching for itself");
  const stripped = JSON.parse(JSON.stringify(board));
  delete stripped.site_attestation;
  const msg = Buffer.from(canon(stripped), "utf8");
  const sigBytes = unhex(sig);
  let ok = false, kid = "";
  for (const k of publishedKeys) if (await edVerify(k.raw, sigBytes, msg)) { ok = true; kid = k.id; break; }
  assert(ok, "site_attestation.sig verifies against NO published key");
  return `verified against published ${kid}`;
}

/** /api/state — the freshness contract. as_of must exist, be a real date, and not be ancient. */
function assertStateFreshness(state, nowMs) {
  at(state, "contract.freshness");
  // Walk every record that declares an as_of, and compare against as_of_field, which names
  // the key it came from. The 2026 defect was a freshness test reading an absent field, so
  // an as_of_field naming a key that is not there is itself a failure.
  const records = [];
  (function walk(o, path) {
    if (!o || typeof o !== "object") return;
    if (!Array.isArray(o) && typeof o.as_of === "string") records.push({ path, rec: o });
    for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
  })(state, "");
  assert(records.length > 0, "no record in /api/state carries an as_of — the freshness contract is unobservable");
  const stale = [];
  for (const { path, rec } of records) {
    assert(typeof rec.as_of_field === "string" && rec.as_of_field.length > 0,
      `${path}: has as_of but no as_of_field naming where it came from`);
    const year = Number(String(rec.as_of).slice(0, 4));
    assert(Number.isFinite(year) && year >= 1970, `${path}: as_of ${JSON.stringify(rec.as_of)} is not a date`);
    const t = Date.parse(String(rec.as_of).slice(0, 10));
    assert(Number.isFinite(t), `${path}: as_of ${JSON.stringify(rec.as_of)} does not parse`);
    assert(t <= nowMs + 86400000, `${path}: as_of ${rec.as_of} is in the future`);
    if (nowMs - t > 400 * 86400000) stale.push(`${path}=${rec.as_of}`);
  }
  assert(stale.length === 0, `stale as_of (>400d): ${stale.slice(0, 3).join(", ")}`);
  return `${records.length} record(s) carry a dated, sourced as_of`;
}

/** /api/tools — total must be DERIVED from the array, not asserted beside it. */
function assertToolsDerived(tools) {
  const total = at(tools, "total");
  const rows = at(tools, "tools");
  const catalogueTotal = at(tools, "catalogue_total");
  const serverCount = at(tools, "server_count");
  at(tools, "total_kind"); // the unit must travel with the number
  assert(Array.isArray(rows), "tools is not an array");
  assert(total === rows.length, `total ${total} ≠ tools.length ${rows.length} — asserted, not derived`);
  assert(typeof catalogueTotal === "number" && catalogueTotal >= rows.length,
    `catalogue_total ${catalogueTotal} is smaller than the ${rows.length} tools listed`);
  assert(typeof serverCount === "number", "server_count is not a number");
  return `total ${total} = tools.length, catalogue ${catalogueTotal}, ${serverCount} probed server(s)`;
}

/**
 * /api/mcp — every headline count must be recomputable from the server list.
 * The units are deliberately different and must not be collapsed: `reachable` counts
 * DISTINCT servers, `reachable_endpoints` counts endpoints (an alias is a second endpoint
 * on the same server). Conflating them is how a fleet of one gets published as a fleet.
 */
function assertMcpDerived(mcp) {
  const servers = at(mcp, "servers");
  const reachable = at(mcp, "reachable");
  const reachableEndpoints = at(mcp, "reachable_endpoints");
  const unreachable = at(mcp, "unreachable");
  const catalogued = at(mcp, "catalogued_not_probed");
  const toolsProbed = at(mcp, "tools_probed");
  assert(Array.isArray(servers), "servers is not an array");
  const isAlias = (x) => typeof x.alias_of === "string" && x.alias_of.length > 0;
  const byStatus = (s) => servers.filter((x) => x && x.status === s);
  const up = byStatus("reachable");
  assert(up.filter((x) => !isAlias(x)).length === reachable,
    `reachable ${reachable} ≠ ${up.filter((x) => !isAlias(x)).length} distinct (non-alias) server(s) with status reachable`);
  assert(up.length === reachableEndpoints,
    `reachable_endpoints ${reachableEndpoints} ≠ ${up.length} endpoint(s) with status reachable`);
  assert(byStatus("unreachable").length === unreachable,
    `unreachable ${unreachable} ≠ ${byStatus("unreachable").length} server(s) with status unreachable`);
  assert(byStatus("catalogued-not-probed").length === catalogued,
    `catalogued_not_probed ${catalogued} ≠ ${byStatus("catalogued-not-probed").length} server(s) with that status`);
  assert(reachableEndpoints + unreachable + catalogued === servers.length,
    `endpoints ${reachableEndpoints} + unreachable ${unreachable} + catalogued ${catalogued} ≠ ${servers.length} servers`);
  // Tools are counted once per DISTINCT server. An alias answering the same tools/list is
  // the same four tools reached twice, not eight tools — the unit flip this repo already
  // recorded once, when MCP server repos were published as a tool count.
  const probedTools = up.filter((x) => !isAlias(x)).reduce((n, x) => n + (Array.isArray(x.tools) ? x.tools.length : 0), 0);
  assert(probedTools === toolsProbed, `tools_probed ${toolsProbed} ≠ ${probedTools} tools on distinct reachable servers`);
  // A catalogued server has never been contacted, so it must not carry a tool count.
  for (const s of byStatus("catalogued-not-probed"))
    assert(s.tools_count === null || s.tools_count === undefined,
      `catalogued server ${s.id} carries tools_count=${s.tools_count} — nothing was contacted, so nothing was counted`);
  return `${servers.length} servers: ${reachable} distinct reachable (${reachableEndpoints} endpoints) / ${unreachable} unreachable / ${catalogued} catalogued, ${toolsProbed} probed tools`;
}

/**
 * /api/tools and /api/mcp must agree. Two endpoints publishing the same fleet from the same
 * probe can drift apart silently — each looks internally consistent while telling a different
 * story. So every tool /api/tools lists must be present on the server /api/mcp says it lives
 * on, at the endpoint /api/tools names.
 */
function assertToolsMatchRegistry(tools, mcp) {
  const rows = at(tools, "tools");
  const servers = at(mcp, "servers");
  const byId = new Map(servers.map((s) => [s.id, s]));
  for (const t of rows) {
    const id = at(t, "id");
    const serverId = at(t, "server");
    const endpoint = at(t, "server_endpoint");
    const srv = byId.get(serverId);
    assert(srv, `tool "${id}" claims server "${serverId}", which /api/mcp does not list`);
    assert(srv.status === "reachable", `tool "${id}" is listed as probed but its server "${serverId}" is ${srv.status}`);
    assert(srv.endpoint === endpoint, `tool "${id}" names endpoint ${endpoint} but /api/mcp has ${srv.endpoint}`);
    const names = (Array.isArray(srv.tools) ? srv.tools : []).map((x) => (typeof x === "string" ? x : x && x.name));
    assert(names.includes(id), `tool "${id}" is not in the tools/list /api/mcp recorded for ${serverId} (${JSON.stringify(names)})`);
  }
  return `all ${rows.length} tool(s) trace to a reachable server in /api/mcp`;
}

/** /api/fines — the derived day count, and the feed signature against a published key. */
function assertFinesDerivation(fines) {
  const asOf = at(fines, "as_of");
  const since = at(fines, "first_fine_watch.enforcement_powers_live_since");
  const days = at(fines, "first_fine_watch.days_since_powers_live");
  at(fines, "first_fine_watch.days_since_powers_live_derivation");
  const expected = Math.round((Date.parse(asOf) - Date.parse(since)) / 86400000);
  assert(Number.isFinite(expected), `cannot derive days from as_of=${asOf} since=${since}`);
  assert(days === expected, `days_since_powers_live ${days} ≠ as_of(${asOf}) − since(${since}) = ${expected}`);
  const rows = at(fines, "fines_by_jurisdiction");
  assert(Array.isArray(rows) && rows.length > 0, "fines_by_jurisdiction is empty");
  const VOCAB = new Set(["MEASURED", "REPORTED", "UNMEASURED", "UNVERIFIED"]);
  for (const r of rows) {
    const v = at(r, "verified");
    assert(VOCAB.has(v), `row "${r.actor}" carries verified=${JSON.stringify(v)}, outside the declared vocabulary`);
  }
  return `days ${days} derives from as_of ${asOf}; ${rows.length} rows all in the status vocabulary`;
}

async function assertSignedFeed(payload, sigPath, keyPath, publishedKeys, stripKey) {
  const sig = at(payload, sigPath);
  const shippedKey = at(payload, keyPath);
  const shipped = b64uToBytes(shippedKey);
  assert(publishedKeys.some((k) => Buffer.from(k.raw).equals(shipped)),
    `${keyPath} is NOT among the did.json keys — the payload is vouching for itself`);
  const stripped = JSON.parse(JSON.stringify(payload));
  delete stripped[stripKey];
  const msg = Buffer.from(canon(stripped), "utf8");
  const sigBytes = unhex(sig);
  let ok = false, kid = "";
  for (const k of publishedKeys) if (await edVerify(k.raw, sigBytes, msg)) { ok = true; kid = k.id; break; }
  assert(ok, `${sigPath} verifies against NO published key`);
  return `verified against published ${kid}`;
}

/**
 * /api/specialists — count derives from the list, and body_sha256 recomputes.
 * The recipe is the one functions/api/specialists.ts publishes: sha256 over
 * JSON.stringify(body, null, 2) with the three envelope fields removed. Using any other
 * canonicalisation here would make this check pass or fail for reasons unrelated to the
 * payload, which is the same class of bug as reading a field that does not exist.
 */
async function assertSpecialists(spec) {
  const count = at(spec, "count");
  const rows = at(spec, "specialists");
  const bodySha = at(spec, "body_sha256");
  at(spec, "sig_algo");
  at(spec, "sig_b64");
  assert(Array.isArray(rows), "specialists is not an array");
  assert(count === rows.length, `count ${count} ≠ specialists.length ${rows.length} — asserted, not derived`);
  const stripped = { ...spec };
  delete stripped.body_sha256; delete stripped.sig_algo; delete stripped.sig_b64;
  const digest = hex(await wc.subtle.digest("SHA-256", Buffer.from(JSON.stringify(stripped, null, 2), "utf8")));
  assert(digest === bodySha, `body_sha256 does not recompute (body hashes to ${digest.slice(0, 16)}…, feed publishes ${String(bodySha).slice(0, 16)}…)`);
  return `count ${count} = list length; body_sha256 recomputes over the published recipe`;
}

/** /signed/card_index.json — header must not lie about the list under it. */
function assertCardIndexHeader(idx) {
  const n = at(idx, "n_cards");
  const cells = at(idx, "n_cells");
  const cards = at(idx, "cards");
  const pubkey = at(idx, "pubkey");
  assert(Array.isArray(cards), "cards is not an array");
  assert(n === cards.length, `n_cards ${n} ≠ cards.length ${cards.length} — header lie`);
  assert(cells === cards.length, `n_cells ${cells} ≠ cards.length ${cards.length} — header lie`);
  assert(/^[0-9a-f]{64}$/.test(String(pubkey)), `pubkey is not a 64-hex Ed25519 key: ${String(pubkey).slice(0, 20)}`);
  const ids = new Set(cards.map((c) => at(c, "card")));
  assert(ids.size === cards.length, `${cards.length - ids.size} duplicate card id(s) in the index`);
  for (const c of cards) assert(at(c, "kid") === pubkey, `card ${String(c.card).slice(0, 12)}… declares kid ≠ index pubkey`);
  return `${n} cards, ids unique, every kid = index pubkey`;
}

/**
 * /signed/cards/* — a card is VALID only when its id is the hash of its own body AND its
 * signature verifies under a PINNED key. Checking a card against the key it shipped with
 * (the published recipe's original bug) is not verification: anyone can sign anything.
 */
async function assertCard(card, pinnedPubkeyHex) {
  const body = at(card, "body");
  const id = at(card, "id");
  const sig = at(card, "signature");
  const pubkey = at(card, "pubkey");
  assert(pubkey === pinnedPubkeyHex, `card pubkey ${String(pubkey).slice(0, 16)}… is not the pinned card-attestation key — a self-signed card proves nothing`);
  const preimage = Buffer.from(pyCanon(body), "utf8");
  const digest = hex(await wc.subtle.digest("SHA-256", preimage));
  assert(digest === id, `id mismatch: body hashes to ${digest.slice(0, 16)}… but the card claims ${String(id).slice(0, 16)}…`);
  const ok = await edVerify(unhex(pubkey), unhex(sig), preimage);
  assert(ok, "signature does not verify under the pinned key");
  return `${String(id).slice(0, 12)}… (${at(body, "axis")})`;
}

/** /claims-register — the rendered count must equal the JSON it claims to render. */
function assertClaimsRegister(html, json) {
  const claims = at(json, "claims");
  assert(Array.isArray(claims), "claims is not an array");
  const m = html.match(/Claims register\s*·\s*(\d+)\s*claims/i);
  assert(m, 'page lost its "Claims register · N claims" line — the derived count is no longer rendered');
  assert(Number(m[1]) === claims.length, `page says ${m[1]} claims but /claims-register.json carries ${claims.length}`);
  const statuses = at(json, "statuses");
  // `statuses` is published as a list of names; tolerate an object form but never
  // fall back to "anything goes" — an empty vocabulary must fail, not wave claims through.
  const names = Array.isArray(statuses) ? statuses : Object.keys(statuses);
  assert(names.length > 0, "statuses vocabulary is empty — every status would pass");
  const known = new Set(names.map((s) => String(s).toLowerCase()));
  for (const c of claims) {
    const s = String(at(c, "status")).toLowerCase();
    assert(known.has(s), `claim ${c.id} has status "${s}" outside the declared status vocabulary`);
    const ev = at(c, "evidence");
    assert(Array.isArray(ev) && ev.length > 0, `claim ${c.id} carries no evidence`);
  }
  return `${claims.length} claims, page count derives from the JSON, every status declared`;
}

// ───────────────────────────── negative controls ─────────────────────────────
/**
 * Every assertion above is re-run here over an input broken in exactly the way that
 * assertion exists to catch. A `--selftest` that goes green means this file is decoration.
 */
const PINNED_CARD_KEY = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

async function selftest() {
  const cases = [];
  const must_reject = (name, fn) => cases.push({ name, fn });
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const goodBoard = {
    totals: { axes: 3, measured_axes: 2, unmeasured_axes: 1, public_count: "3 axes · 2 measured" },
    axes: [{ axis: "a", n: 10 }, { axis: "b", n: 5 }, { axis: "c", n: 0 }],
  };
  must_reject("gspc: sentence stops deriving from the integers", () => {
    const b = clone(goodBoard); b.totals.public_count = "3 axes · 3 measured"; return assertGspcCounts(b);
  });
  must_reject("gspc: totals stop balancing", () => {
    const b = clone(goodBoard); b.totals.unmeasured_axes = 0; return assertGspcCounts(b);
  });
  must_reject("gspc: slot count stops matching the rows shipped", () => {
    const b = clone(goodBoard); b.axes.pop(); return assertGspcCounts(b);
  });
  must_reject("gspc: measured count stops matching rows carrying a run", () => {
    const b = clone(goodBoard); b.axes[1].n = 0; return assertGspcCounts(b);
  });
  must_reject("gspc: measured_axes field removed entirely (must not read as undefined)", () => {
    const b = clone(goodBoard); delete b.totals.measured_axes; return assertGspcCounts(b);
  });

  // Real Ed25519 material, generated here: a published key and an attacker key.
  const good = await wc.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const evil = await wc.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const rawOf = async (k) => new Uint8Array(await wc.subtle.exportKey("raw", k.publicKey));
  const goodRaw = await rawOf(good), evilRaw = await rawOf(evil);
  const published = [{ id: "#board-attestation-1", raw: goodRaw }];
  const b64u = (b) => Buffer.from(b).toString("base64url");

  const signBoard = async (board, priv) => {
    const s = clone(board); delete s.site_attestation;
    const sig = await wc.subtle.sign("Ed25519", priv, Buffer.from(canon(s), "utf8"));
    return hex(sig);
  };
  const attBoard = clone(goodBoard);
  attBoard.site_attestation = { alg: "Ed25519", public_key_x: b64u(goodRaw), sig: "" };
  attBoard.site_attestation.sig = await signBoard(attBoard, good.privateKey);

  cases.push({ name: "gspc attestation: a correctly signed board is accepted (positive control)", expectPass: true,
    fn: () => assertGspcAttestation(clone(attBoard), published) });
  must_reject("gspc attestation: payload tampered after signing", async () => {
    const b = clone(attBoard); b.totals.measured_axes = 3; return assertGspcAttestation(b, published);
  });
  must_reject("gspc attestation: self-signed with a key the payload supplied itself", async () => {
    const b = clone(goodBoard);
    b.site_attestation = { alg: "Ed25519", public_key_x: b64u(evilRaw), sig: "" };
    b.site_attestation.sig = await signBoard(b, evil.privateKey);
    return assertGspcAttestation(b, published);
  });
  must_reject("gspc attestation: signature stripped", async () => {
    const b = clone(attBoard); delete b.site_attestation.sig; return assertGspcAttestation(b, published);
  });

  const now = Date.parse("2026-08-26");
  const goodState = { contract: { freshness: "x" }, board: { m: { value: 1, as_of: "2026-08-12", as_of_field: "measured_on.date" } } };
  cases.push({ name: "state freshness: a dated, sourced record is accepted (positive control)", expectPass: true,
    fn: () => assertStateFreshness(clone(goodState), now) });
  must_reject("state freshness: as_of goes stale", () => {
    const s = clone(goodState); s.board.m.as_of = "1999-01-01"; return assertStateFreshness(s, now);
  });
  must_reject("state freshness: as_of_field removed, so nothing names the source", () => {
    const s = clone(goodState); delete s.board.m.as_of_field; return assertStateFreshness(s, now);
  });
  must_reject("state freshness: every as_of removed (must not pass on an empty set)", () => {
    const s = clone(goodState); delete s.board.m.as_of; return assertStateFreshness(s, now);
  });
  must_reject("state freshness: as_of dated in the future", () => {
    const s = clone(goodState); s.board.m.as_of = "2099-01-01"; return assertStateFreshness(s, now);
  });

  const goodTools = { total: 2, total_kind: "probed", catalogue_total: 4, server_count: 1, tools: [{ id: "a" }, { id: "b" }] };
  must_reject("tools: total asserted instead of derived", () => {
    const t = clone(goodTools); t.total = 377; return assertToolsDerived(t);
  });
  must_reject("tools: catalogue_total smaller than the list it covers", () => {
    const t = clone(goodTools); t.catalogue_total = 1; return assertToolsDerived(t);
  });
  must_reject("tools: total_kind dropped, so the unit stops travelling", () => {
    const t = clone(goodTools); delete t.total_kind; return assertToolsDerived(t);
  });

  const goodMcp = { reachable: 1, reachable_endpoints: 2, unreachable: 1, catalogued_not_probed: 1, tools_probed: 2,
    servers: [
      { id: "a", status: "reachable", tools: [1, 2] },
      { id: "a-alias", status: "reachable", alias_of: "a", tools: [1, 2] },
      { id: "b", status: "unreachable" },
      { id: "c", status: "catalogued-not-probed", tools_count: null },
    ] };
  cases.push({ name: "mcp: a correctly derived registry is accepted (positive control)", expectPass: true,
    fn: () => assertMcpDerived(clone(goodMcp)) });
  must_reject("mcp: distinct-server count inflated by counting an alias", () => {
    const m = clone(goodMcp); m.reachable = 2; return assertMcpDerived(m);
  });
  must_reject("mcp: endpoint count stops matching the endpoints listed", () => {
    const m = clone(goodMcp); m.reachable_endpoints = 9; return assertMcpDerived(m);
  });
  must_reject("mcp: tools_probed counts tools on servers nobody reached", () => {
    const m = clone(goodMcp); m.tools_probed = 9; return assertMcpDerived(m);
  });
  must_reject("mcp: tool count doubled by counting the alias's copy of the same tools", () => {
    const m = clone(goodMcp); m.tools_probed = 4; return assertMcpDerived(m);
  });
  must_reject("mcp: the kinds stop summing to the server list", () => {
    const m = clone(goodMcp); m.catalogued_not_probed = 4; return assertMcpDerived(m);
  });
  must_reject("mcp: a catalogued (never-contacted) server acquires a tool count", () => {
    const m = clone(goodMcp); m.servers[3].tools_count = 363; return assertMcpDerived(m);
  });

  const crossTools = { total: 1, total_kind: "probed", catalogue_total: 1, server_count: 1,
    tools: [{ id: "measure", server: "a", server_endpoint: "https://x/mcp" }] };
  const crossMcp = { reachable: 1, reachable_endpoints: 1, unreachable: 0, catalogued_not_probed: 0, tools_probed: 1,
    servers: [{ id: "a", endpoint: "https://x/mcp", status: "reachable", tools: [{ name: "measure" }] }] };
  cases.push({ name: "tools↔mcp: two endpoints describing the same fleet are accepted (positive control)", expectPass: true,
    fn: () => assertToolsMatchRegistry(clone(crossTools), clone(crossMcp)) });
  must_reject("tools↔mcp: a tool /api/tools publishes is absent from the recorded tools/list", () => {
    const m = clone(crossMcp); m.servers[0].tools = [{ name: "something-else" }];
    return assertToolsMatchRegistry(clone(crossTools), m);
  });
  must_reject("tools↔mcp: a tool is published as probed on a server nobody reached", () => {
    const m = clone(crossMcp); m.servers[0].status = "catalogued-not-probed";
    return assertToolsMatchRegistry(clone(crossTools), m);
  });
  must_reject("tools↔mcp: the two endpoints name different endpoints for the same server", () => {
    const m = clone(crossMcp); m.servers[0].endpoint = "https://elsewhere/mcp";
    return assertToolsMatchRegistry(clone(crossTools), m);
  });

  const goodSpec = { schema: "csoai.specialist-team/0.1", count: 2,
    specialists: [{ id: "a" }, { id: "b" }], body_sha256: "", sig_algo: "ed25519", sig_b64: "x" };
  {
    const s = { ...goodSpec }; delete s.body_sha256; delete s.sig_algo; delete s.sig_b64;
    goodSpec.body_sha256 = hex(await wc.subtle.digest("SHA-256", Buffer.from(JSON.stringify(s, null, 2), "utf8")));
  }
  cases.push({ name: "specialists: a body whose digest recomputes is accepted (positive control)", expectPass: true,
    fn: () => assertSpecialists(clone(goodSpec)) });
  must_reject("specialists: count asserted instead of derived", () => {
    const s = clone(goodSpec); s.count = 13; return assertSpecialists(s);
  });
  must_reject("specialists: body edited after the digest was taken", () => {
    const s = clone(goodSpec); s.specialists[0].id = "tampered"; return assertSpecialists(s);
  });
  must_reject("specialists: digest field removed (must not read as undefined)", () => {
    const s = clone(goodSpec); delete s.body_sha256; return assertSpecialists(s);
  });

  const goodFines = { as_of: "2026-08-24",
    first_fine_watch: { enforcement_powers_live_since: "2026-08-02", days_since_powers_live: 22, days_since_powers_live_derivation: "as_of − since" },
    fines_by_jurisdiction: [{ actor: "X", verified: "REPORTED" }] };
  must_reject("fines: day count stops deriving from as_of", () => {
    const f = clone(goodFines); f.first_fine_watch.days_since_powers_live = 3; return assertFinesDerivation(f);
  });
  must_reject("fines: as_of moves but the derived day count does not", () => {
    const f = clone(goodFines); f.as_of = "2026-09-24"; return assertFinesDerivation(f);
  });
  must_reject("fines: a row escapes the declared status vocabulary", () => {
    const f = clone(goodFines); f.fines_by_jurisdiction[0].verified = "PROBABLY"; return assertFinesDerivation(f);
  });

  const goodIdx = { n_cards: 2, n_cells: 2, pubkey: "a".repeat(64),
    cards: [{ card: "1".repeat(64), kid: "a".repeat(64) }, { card: "2".repeat(64), kid: "a".repeat(64) }] };
  must_reject("card_index: n_cards lies about the list under it", () => {
    const i = clone(goodIdx); i.n_cards = 335; return assertCardIndexHeader(i);
  });
  must_reject("card_index: truncated list with the header left behind", () => {
    const i = clone(goodIdx); i.cards.pop(); return assertCardIndexHeader(i);
  });
  must_reject("card_index: a card declares a kid the index did not publish", () => {
    const i = clone(goodIdx); i.cards[1].kid = "b".repeat(64); return assertCardIndexHeader(i);
  });
  must_reject("card_index: duplicate card ids padding the count", () => {
    const i = clone(goodIdx); i.cards[1].card = i.cards[0].card; return assertCardIndexHeader(i);
  });

  // The forged card. This is the exact published-recipe defect: a card signed with a key
  // the forger generated, shipped inside the card, and therefore self-consistent.
  const forgedBody = { axis: "care-refusal-protect", accuracy: 0.999, model: "totally-real" };
  const forgedPre = Buffer.from(pyCanon(forgedBody), "utf8");
  const forgedCard = {
    body: forgedBody,
    id: hex(await wc.subtle.digest("SHA-256", forgedPre)),
    pubkey: hex(evilRaw),
    signature: hex(await wc.subtle.sign("Ed25519", evil.privateKey, forgedPre)),
  };
  must_reject("card: FORGED — internally consistent, signed with the key it ships", () => assertCard(forgedCard, PINNED_CARD_KEY));
  must_reject("card: body tampered after signing (id no longer hashes)", () => {
    const c = clone(forgedCard); c.pubkey = PINNED_CARD_KEY; c.body.accuracy = 0.1; return assertCard(c, PINNED_CARD_KEY);
  });

  const goodCr = { statuses: ["live", "planned"], claims: [{ id: "CR-1", status: "live", evidence: ["/x"] }] };
  const goodHtml = "<p>Claims register · 1 claims · generated 2026-08-26</p>";
  cases.push({ name: "claims-register: page count matching the JSON is accepted (positive control)", expectPass: true,
    fn: () => assertClaimsRegister(goodHtml, clone(goodCr)) });
  must_reject("claims-register: page count stops matching the JSON it renders", () =>
    assertClaimsRegister("<p>Claims register · 20 claims</p>", clone(goodCr)));
  must_reject("claims-register: a claim carries an undeclared status", () => {
    const c = clone(goodCr); c.claims[0].status = "basically-true"; return assertClaimsRegister(goodHtml, c);
  });
  must_reject("claims-register: a claim carries no evidence", () => {
    const c = clone(goodCr); c.claims[0].evidence = []; return assertClaimsRegister(goodHtml, c);
  });
  must_reject("claims-register: the status vocabulary is emptied, so nothing can be out of it", () => {
    const c = clone(goodCr); c.statuses = []; return assertClaimsRegister(goodHtml, c);
  });

  console.log(`SELFTEST — ${cases.length} control(s): every negative control must be CAUGHT, every positive control must PASS\n`);
  let bad = 0;
  for (const c of cases) {
    let threw = false, msg = "";
    try { await c.fn(); } catch (e) { threw = true; msg = e.message; }
    const wantThrow = !c.expectPass;
    if (threw === wantThrow) console.log(`  ✓ ${c.name}${threw ? ` → caught: ${msg.slice(0, 70)}` : ""}`);
    else { console.log(`  ✗ ${c.name} → ${threw ? "REJECTED a good input: " + msg : "ACCEPTED a broken input — this assertion cannot fail"}`); bad++; }
  }
  console.log("");
  if (bad) { console.error(`SELFTEST: FAIL — ${bad} control(s) wrong. Do not trust a green run from this file.`); return 1; }
  console.log(`SELFTEST: PASS — all ${cases.length} controls behaved.`);
  return 0;
}

// ───────────────────────────── live run ─────────────────────────────
async function get(path) {
  const r = await fetch(HOST + path, { headers: { "user-agent": UA }, redirect: "follow" });
  return { status: r.status, ct: r.headers.get("content-type") || "", body: await r.text() };
}
async function getJson(path) {
  const r = await get(path);
  assert(r.status === 200, `HTTP ${r.status}`);
  assert(r.ct.includes("json"), `content-type ${r.ct} — an HTML answer here means the Pages Function is not deployed`);
  try { return JSON.parse(r.body); } catch (e) { throw new Error(`invalid JSON: ${e.message}`); }
}

async function live() {
  console.log(`LIVE-SURFACE-CONTRACT — ${HOST}\n`);

  // The trust root: keys a stranger can fetch. Everything signed is checked against THESE.
  let publishedKeys = [];
  await checkAsync("/.well-known/did.json publishes Ed25519 keys", async () => {
    const did = await getJson("/.well-known/did.json");
    for (const vm of at(did, "verificationMethod")) {
      if (vm.publicKeyJwk && vm.publicKeyJwk.crv === "Ed25519" && vm.publicKeyJwk.x) {
        const raw = b64uToBytes(vm.publicKeyJwk.x);
        if (raw.length === 32) publishedKeys.push({ id: vm.id, raw: new Uint8Array(raw) });
      }
    }
    assert(publishedKeys.length > 0, "no usable Ed25519 keys — nothing signed can be verified by a stranger");
    return `${publishedKeys.length} key(s): ${publishedKeys.map((k) => k.id).join(", ")}`;
  });

  console.log("\n## /api/gspc");
  let board = null;
  await checkAsync("/api/gspc is JSON", async () => { board = await getJson("/api/gspc"); return `${JSON.stringify(board).length} B`; });
  if (board) {
    check("/api/gspc counts derive from the rows shipped", () => assertGspcCounts(board));
    await checkAsync("/api/gspc site_attestation verifies against a PUBLISHED key", () => assertGspcAttestation(board, publishedKeys));
  }

  console.log("\n## /api/state");
  await checkAsync("/api/state freshness contract holds", async () => assertStateFreshness(await getJson("/api/state"), Date.now()));

  console.log("\n## /api/mcp · /api/tools");
  let mcp = null, tools = null;
  await checkAsync("/api/mcp counts derive from the server list", async () => { mcp = await getJson("/api/mcp"); return assertMcpDerived(mcp); });
  await checkAsync("/api/tools total derives from the tools array", async () => { tools = await getJson("/api/tools"); return assertToolsDerived(tools); });
  if (mcp && tools) check("/api/tools and /api/mcp describe the same fleet", () => assertToolsMatchRegistry(tools, mcp));

  console.log("\n## /api/fines");
  let fines = null;
  await checkAsync("/api/fines day count derives from as_of", async () => { fines = await getJson("/api/fines"); return assertFinesDerivation(fines); });
  if (fines) await checkAsync("/api/fines signature verifies against a PUBLISHED key",
    () => assertSignedFeed(fines, "signature.sig", "signature.public_key_x", publishedKeys, "signature"));

  console.log("\n## /api/specialists");
  await checkAsync("/api/specialists count and body hash derive from the body", async () => assertSpecialists(await getJson("/api/specialists")));

  console.log("\n## /signed/*");
  let idx = null;
  await checkAsync("/signed/card_index.json header matches its own list", async () => { idx = await getJson("/signed/card_index.json"); return assertCardIndexHeader(idx); });
  if (idx) {
    const pinned = at(idx, "pubkey");
    // Sample across the index rather than the first row only: a truncated or padded tail is
    // invisible to a check that always reads position 0.
    const picks = [0, Math.floor(idx.cards.length / 2), idx.cards.length - 1].filter((n, i, a) => a.indexOf(n) === i);
    for (const i of picks) {
      const id = idx.cards[i].card;
      await checkAsync(`/signed/cards/${String(id).slice(0, 12)}… (index row ${i}) verifies under the pinned key`, async () => {
        const r = await get(`/signed/cards/${id}.json`);
        assert(r.status === 200, `HTTP ${r.status} — the index points at a card that is not published`);
        return assertCard(JSON.parse(r.body), pinned);
      });
    }
    await checkAsync("/signed/verify-card.mjs — the published recipe is fetchable", async () => {
      const r = await get("/signed/verify-card.mjs");
      assert(r.status === 200, `HTTP ${r.status} — the recipe we tell strangers to run is not published`);
      assert(/PINNED_PUBKEY_HEX/.test(r.body), "recipe no longer pins a key — it would verify a forged card as VALID");
      assert(r.body.includes(pinned), `recipe pins a key that is not the card_index pubkey`);
      return `${r.body.length} B, pins ${String(pinned).slice(0, 12)}…`;
    });
  }

  console.log("\n## pages");
  await checkAsync("/claims-register renders the count in /claims-register.json", async () => {
    const r = await get("/claims-register");
    assert(r.status === 200, `HTTP ${r.status}`);
    return assertClaimsRegister(r.body.replace(/<[^>]+>/g, " "), await getJson("/claims-register.json"));
  });
  for (const [path, markers] of [
    ["/rating-the-raters", ["Rating the Raters", "measurement, not certification", "result 001"]],
    ["/os", ["Council OS"]],
  ]) {
    await checkAsync(`${path} is a real page, not a 404 or a thin shell`, async () => {
      const r = await get(path);
      assert(r.status === 200, `HTTP ${r.status}`);
      const title = (r.body.match(/<title>([^<]*)/) || [, ""])[1];
      assert(!/404 — Not found/i.test(title), `served the honest-404 catch-all (title: ${title})`);
      assert(r.body.length > 20000, `${r.body.length} B — a thin Vite shell, not a prerendered page`);
      const missing = markers.filter((m) => !r.body.includes(m));
      assert(missing.length === 0, `lost content marker(s) ${JSON.stringify(missing)}`);
      return `${r.body.length} B — ${title.slice(0, 50)}`;
    });
  }

  console.log("");
  if (fails.length) {
    console.error(`LIVE-SURFACE-CONTRACT: FAIL — ${fails.length} broken contract(s) on ${HOST}.`);
    return 1;
  }
  console.log(`LIVE-SURFACE-CONTRACT: PASS — every surface derived, signed and reachable.`);
  return 0;
}

// The selftest is not optional on a live run. A file whose assertions cannot be shown to
// fail has no business reporting that the site is fine, so a broken control aborts before
// a single live URL is fetched.
if (process.argv.includes("--selftest")) {
  process.exit(await selftest());
}
const controls = await selftest();
if (controls !== 0) {
  console.error("\nRefusing to report on the live site: the negative controls did not hold.");
  process.exit(controls);
}
console.log("");
process.exit(await live());
