#!/usr/bin/env node
/**
 * outsider-walk.mjs — D13: the stranger's verification walk.
 *
 * WHY THIS EXISTS: every other guard checks that the site says the right things.
 * Nobody checked whether a STRANGER — no insider knowledge, no repo access, nothing
 * but the public URLs — can actually complete a verification end-to-end:
 * fetch the published key, fetch the public board, verify the signature. This script
 * IS that stranger. It uses only public URLs and node:crypto. If the walk cannot be
 * completed, it says so honestly and exits 1 — an honest FAIL here is the point:
 * it stays red until the payload ships a signature envelope a stranger can verify.
 *
 * The walk:
 *   1. GET /.well-known/did.json → extract the Ed25519 public key(s).
 *   2. GET /api/gspc → locate the signature envelope, attempt Ed25519 verification
 *      against each published key (several honest reconstructions of the stated
 *      signed content are tried; each result is reported VALID/INVALID per key).
 *   3. If no reconstruction verifies against a PUBLISHED key, report INCOMPLETE and exit 1.
 *   Also: /api/feed.xml must be 200; /gspc-verify must be 200 and mention "Recompute".
 *
 * It reads NOTHING secret and changes NOTHING. Run:
 *   node scripts/outsider-walk.mjs [--host https://councilof.ai]
 * Exit 0 = a stranger completed the walk; exit 1 = the walk cannot be completed.
 */
import { createPublicKey, createHash, verify as edVerify } from "node:crypto";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const HOST = (arg("host", "https://councilof.ai")).replace(/\/$/, "");
const UA = "Mozilla/5.0 (outsider-walk; +https://councilof.ai)";

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); fails.push(m); };
const note = (m) => console.log(`  · ${m}`);

async function get(path) {
  const r = await fetch(HOST + path, { headers: { "user-agent": UA }, redirect: "follow" });
  const body = await r.text();
  return { status: r.status, body };
}

// --- key material helpers (a stranger only has what did.json publishes) ---
const b64u = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58decode(s) {
  let n = 0n;
  for (const c of s) { const i = B58.indexOf(c); if (i < 0) throw new Error(`bad base58 char ${c}`); n = n * 58n + BigInt(i); }
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
  for (const c of s) { if (c === "1") bytes.unshift(0); else break; }
  return Buffer.from(bytes);
}
function rawFromVerificationMethod(vm) {
  if (vm.publicKeyJwk && vm.publicKeyJwk.crv === "Ed25519" && vm.publicKeyJwk.x) return b64u(vm.publicKeyJwk.x);
  if (vm.publicKeyMultibase && vm.publicKeyMultibase.startsWith("z")) {
    const b = base58decode(vm.publicKeyMultibase.slice(1));
    return b.length === 34 && b[0] === 0xed && b[1] === 0x01 ? b.subarray(2) : b; // strip multicodec ed25519-pub prefix
  }
  return null;
}
const keyObj = (raw) => createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: raw.toString("base64url") }, format: "jwk" });

// canonical JSON with sorted keys; two separator styles (compact, and python json.dumps default)
function canonical(v, sep) {
  if (v === null || typeof v === "number" || typeof v === "boolean") return JSON.stringify(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map((x) => canonical(x, sep)).join(sep.item) + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + sep.kv + canonical(v[k], sep)).join(sep.item) + "}";
}
const SEPS = [{ name: "compact", item: ",", kv: ":" }, { name: "python-default", item: ", ", kv: ": " }];
const sha256 = (buf) => createHash("sha256").update(buf).digest();

console.log(`OUTSIDER-WALK — ${HOST} (D13: no insider knowledge, public URLs + node:crypto only)\n`);

// ---- Step 1: the stranger fetches the published key(s) ----
let keys = []; // { id, raw, key }
try {
  const { status, body } = await get("/.well-known/did.json");
  if (status !== 200) fail(`step 1: /.well-known/did.json returned HTTP ${status}`);
  else {
    let did; try { did = JSON.parse(body); } catch { did = null; }
    if (!did) fail(`step 1: /.well-known/did.json is not JSON`);
    else {
      for (const vm of did.verificationMethod || []) {
        try {
          const raw = rawFromVerificationMethod(vm);
          if (raw && raw.length === 32) keys.push({ id: vm.id, raw, key: keyObj(raw) });
        } catch (e) { note(`step 1: could not parse key ${vm.id}: ${e.message}`); }
      }
      if (keys.length) pass(`step 1: fetched ${keys.length} Ed25519 public key(s): ${keys.map((k) => k.id).join(", ")}`);
      else fail(`step 1: did.json carries no usable Ed25519 keys — the stranger has nothing to verify against`);
    }
  }
} catch (e) { fail(`step 1: /.well-known/did.json fetch error: ${e.message}`); }

// ---- Step 2: the stranger fetches the public board and tries to verify it ----
let walkComplete = false;
try {
  const { status, body } = await get("/api/gspc");
  if (status !== 200) fail(`step 2: /api/gspc returned HTTP ${status}`);
  else {
    let board; try { board = JSON.parse(body); } catch { board = null; }
    if (!board) fail(`step 2: /api/gspc is not JSON`);
    else {
      // locate any signature envelope: an object carrying a "signature" field
      const envelopes = [];
      (function findEnvelopes(o, path) {
        if (!o || typeof o !== "object") return;
        if (!Array.isArray(o) && typeof o.signature === "string") envelopes.push({ path, env: o });
        for (const [k, v] of Object.entries(o)) findEnvelopes(v, path ? `${path}.${k}` : k);
      })(board, "");
      if (!envelopes.length) {
        fail(`step 2: /api/gspc carries no signature envelope at all`);
      } else if (!keys.length) {
        fail(`step 2: signature envelope present but no published keys to verify against (step 1 failed)`);
      } else {
        for (const { path, env } of envelopes) {
          note(`step 2: found envelope at ${path} (signed=${env.signed}, sig_input=${JSON.stringify(env.sig_input || null)})`);
          const sig = /^[0-9a-f]+$/i.test(env.signature) ? Buffer.from(env.signature, "hex") : b64u(env.signature);
          if (sig.length !== 64) { fail(`step 2: envelope at ${path}: signature is not 64 bytes (got ${sig.length})`); continue; }
          // stated signed content: "canonical board minus signature fields, sort_keys" —
          // strip the envelope's signature fields from a deep copy and try honest reconstructions.
          const stripped = JSON.parse(JSON.stringify(board));
          const target = path.split(".").reduce((o, k) => (o ? o[k] : undefined), stripped);
          if (target) for (const f of ["signed", "signer", "signature", "sig_input"]) delete target[f];
          const candidates = [];
          for (const sep of SEPS) {
            const c = Buffer.from(canonical(stripped, sep), "utf8");
            candidates.push({ name: `sha256(canonical ${sep.name}) as digest bytes`, msg: sha256(c) });
            candidates.push({ name: `sha256(canonical ${sep.name}) as hex string`, msg: Buffer.from(sha256(c).toString("hex"), "utf8") });
            candidates.push({ name: `canonical ${sep.name} bytes`, msg: c });
          }
          // verify against every PUBLISHED key; also self-check the embedded signer key if hex
          const trialKeys = [...keys];
          if (typeof env.signer === "string" && /^[0-9a-f]{64}$/i.test(env.signer)) {
            const raw = Buffer.from(env.signer, "hex");
            const published = keys.some((k) => k.raw.equals(raw));
            if (!published) {
              // Honest disclosure, not a broken promise: this is the pod living_stamp,
              // pending re-sign by the pod lane. The board's verifiability is established
              // by the site_attestation (step 2b) against a PUBLISHED key. An additional,
              // not-yet-verifiable stamp is a note — the verify promise is met elsewhere.
              note(`step 2: envelope at ${path}: signer key ${env.signer.slice(0, 16)}… is not among the published did.json keys (the pod living_stamp is pending re-sign; the board's verifiable signature is the site_attestation checked in step 2b)`);
              trialKeys.push({ id: `embedded-signer(${env.signer.slice(0, 12)}…)`, raw, key: keyObj(raw), unpublished: true });
            }
          }
          for (const k of trialKeys) {
            const hit = candidates.find((c) => { try { return edVerify(null, c.msg, k.key, sig); } catch { return false; } });
            if (hit) {
              if (k.unpublished) fail(`step 2: ${k.id}: VALID over "${hit.name}" — but the key is unpublished, so this proves nothing to a stranger`);
              else { pass(`step 2: ${k.id}: VALID over "${hit.name}" — a stranger CAN verify the board`); walkComplete = true; }
            } else {
              note(`step 2: ${k.id}: INVALID under all ${candidates.length} reconstructions of the stated signed content`);
            }
          }
          if (!walkComplete) note(`step 2: sig_input says the signed bytes come from "${env.sig_input || "?"}" over upstream ${env.source || "?"} — content a stranger holding only THIS payload cannot reconstruct`);
        }
      }
    }
  }
} catch (e) { fail(`step 2: /api/gspc fetch error: ${e.message}`); }

// ---- Step 2b: the site-attestation signature (Ed25519, reconstructable) ----
// Distinct from the pod living_stamp: a `sig` (hex) over canonical(payload minus
// site_attestation), signed by #board-attestation-1 whose public key is in did.json.
try {
  const { status, body } = await get("/api/gspc");
  if (status === 200) {
    const board = JSON.parse(body);
    const att = board.site_attestation;
    if (att && typeof att.sig === "string") {
      // canonical: recursively sorted keys, no whitespace — must match functions/api/gspc.ts
      const canon = (o) => o === null || typeof o !== "object"
        ? JSON.stringify(o)
        : Array.isArray(o) ? "[" + o.map(canon).join(",") + "]"
        : "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";
      const stripped = JSON.parse(JSON.stringify(board));
      delete stripped.site_attestation;
      const msg = Buffer.from(canon(stripped), "utf8");
      const sig = Buffer.from(att.sig, "hex");
      const k = keys.find((kk) => { try { return edVerify(null, msg, kk.key, sig); } catch { return false; } });
      if (k) { pass(`step 2b: site_attestation VALID against published ${k.id} — a stranger CAN verify the board snapshot`); walkComplete = true; }
      else if (att.error) note(`step 2b: site_attestation reports an operational error (no signature) — honest, but not verifiable: ${att.error}`);
      else fail(`step 2b: site_attestation present but its sig verifies against no published key`);
    }
  }
} catch (e) { note(`step 2b: site_attestation check skipped — ${e.message}`); }

// ---- Step 3: honest verdict on the end-to-end walk ----
if (!walkComplete) {
  fail(`OUTSIDER-WALK: INCOMPLETE — the public board payload does not yet carry an inline signature a stranger can verify; a stranger can fetch the key but cannot complete verification end-to-end`);
}

// ---- The rest of the stranger's walk: watch feed + verify page ----
try {
  const { status } = await get("/api/feed.xml");
  if (status !== 200) fail(`walk: /api/feed.xml returned HTTP ${status}`);
  else pass(`walk: /api/feed.xml 200`);
} catch (e) { fail(`walk: /api/feed.xml fetch error: ${e.message}`); }
try {
  const { status, body } = await get("/gspc-verify");
  if (status !== 200) fail(`walk: /gspc-verify returned HTTP ${status}`);
  else if (!body.includes("Recompute")) fail(`walk: /gspc-verify lost its "Recompute" marker — the free-verify promise is gone`);
  else pass(`walk: /gspc-verify 200 and offers "Recompute"`);
} catch (e) { fail(`walk: /gspc-verify fetch error: ${e.message}`); }

console.log("");
if (fails.length) {
  console.error(`OUTSIDER-WALK: FAIL — ${fails.length} break(s) in the stranger's walk. This stays red until a stranger can verify end-to-end; do not fake it green.`);
  process.exit(1);
}
console.log(`OUTSIDER-WALK: PASS — a stranger completed key-fetch → board-fetch → signature-verify end-to-end.`);
