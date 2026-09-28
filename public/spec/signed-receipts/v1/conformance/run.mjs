#!/usr/bin/env node
// signed-receipts/v1 conformance runner. Node 20+, no dependencies (WebCrypto Ed25519).
// Apache-2.0. https://councilof.ai/spec/signed-receipts/v1/conformance/
//
//   node run.mjs <candidate-results.json | URL>   compare a candidate's results with vectors.json
//   node run.mjs --self                           verify the Ed25519 vectors with this script's own verifier
//   node run.mjs --emit                           print this script's own results in candidate format
//   --vectors <path | URL>                        default: the published vectors.json
//
// A candidate results file is {"results": {"<case id>": "VALID" | "INVALID" | "UNVERIFIABLE_KEY"}}.
// PASS means the candidate's result matches the expected result in vectors.json. It is not a
// certification, an endorsement or a conformity mark. Exit 0 only when every core case passes and
// no interop case fails (interop cases a candidate leaves out are reported SKIP).

// Node 20-22 print an ExperimentalWarning the first time WebCrypto Ed25519 is used; it is noise here.
process.removeAllListeners("warning");

const DEFAULT_VECTORS = "https://councilof.ai/spec/signed-receipts/v1/conformance/vectors.json";
const RESULTS = ["VALID", "INVALID", "UNVERIFIABLE_KEY"];

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`);
    return r.json();
  }
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(src, "utf8"));
}

// RFC 8785 (JCS). JSON.stringify already gives ES6 numbers and RFC 8785 string escaping;
// keys sort by UTF-16 code unit, which is what Array.prototype.sort does on strings.
function jcs(v) {
  if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite number");
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(jcs).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + jcs(v[k])).join(",") + "}";
}

const enc = new TextEncoder();
const hex = (b) => Buffer.from(b).toString("hex");
const unhex = (s) => {
  if (typeof s !== "string" || !/^([0-9a-f]{2})*$/i.test(s)) throw new Error("not hex");
  return Uint8Array.from(Buffer.from(s, "hex"));
};
const sha256hex = async (s) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
const b64url = (s) => Uint8Array.from(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
function b58(s) {
  const A = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const c of s) {
    const i = A.indexOf(c);
    if (i < 0) throw new Error("bad base58");
    n = n * 58n + BigInt(i);
  }
  let h = n.toString(16);
  if (h.length % 2) h = "0" + h;
  const lead = s.match(/^1*/)[0].length;
  return Uint8Array.from([...new Array(lead).fill(0), ...(n ? Buffer.from(h, "hex") : [])]);
}

function vmKey(vm) {
  if (vm.publicKeyHex) return unhex(vm.publicKeyHex.toLowerCase());
  if (vm.publicKeyMultibase) {
    const m = vm.publicKeyMultibase;
    if (m[0] === "z") return b58(m.slice(1));
    if (m[0] === "f" || m[0] === "F") return unhex(m.slice(1).toLowerCase());
    if (m[0] === "u") return b64url(m.slice(1));
    throw new Error("unsupported multibase prefix");
  }
  const j = vm.publicKeyJwk;
  if (j && j.kty === "OKP" && j.crv === "Ed25519" && j.x) return b64url(j.x);
  return null;
}
const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => x === b[i]);

// The reference verifier: VALID | INVALID | UNVERIFIABLE_KEY. resolve(did) -> DID document or null.
export async function verify(receipt, resolve) {
  let pub, kid;
  try {
    const env = receipt && receipt.signature;
    if (!env || typeof env !== "object") return ["INVALID", "malformed: no signature object"];
    if (env.alg !== "Ed25519") return ["INVALID", `unsupported alg ${env.alg}`];
    kid = env.kid;
    if (typeof kid !== "string" || !kid.startsWith("did:") || !kid.includes("#")) return ["INVALID", "malformed kid"];
    const { signature, ...body } = receipt;
    const { content_id, ...unsigned } = body;
    if (content_id !== (await sha256hex(jcs(unsigned)))) return ["INVALID", "content_id mismatch"];
    pub = unhex(env.signer_public_key);
    const key = await crypto.subtle.importKey("raw", pub, { name: "Ed25519" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, unhex(env.sig), enc.encode(jcs(body)));
    if (!ok) return ["INVALID", "bad signature"];
  } catch (e) {
    return ["INVALID", `malformed: ${e.message}`];
  }
  const did = kid.split("#")[0];
  let doc = null;
  try {
    doc = await resolve(did);
  } catch {
    doc = null;
  }
  if (!doc || typeof doc !== "object") return ["UNVERIFIABLE_KEY", `DID document for ${did} not resolvable`];
  for (const vm of doc.verificationMethod || []) {
    let k;
    try {
      k = vmKey(vm);
    } catch {
      continue;
    }
    if (same(k, pub)) return vm.revoked ? ["INVALID", `key revoked (${vm.id})`] : ["VALID", `key listed (${vm.id})`];
  }
  return ["INVALID", `key not in DID document for ${did}`];
}

async function selfResults(v) {
  const out = {};
  for (const c of v.cases) {
    const docs = c.did_documents || {};
    out[c.id] = await verify(c.receipt, async (d) => docs[d] ?? null);
  }
  return out;
}

const pad = (s, n) => String(s).padEnd(n);

function report(title, cases, got, { optional }) {
  let pass = 0, fail = 0, skip = 0;
  console.log(`\n${title}`);
  for (const c of cases) {
    const g = got[c.id];
    let tag;
    if (g === undefined) {
      tag = optional ? "SKIP" : "FAIL";
    } else if (!RESULTS.includes(g)) {
      tag = "FAIL";
    } else {
      tag = g === c.expected ? "PASS" : "FAIL";
    }
    tag === "PASS" ? pass++ : tag === "SKIP" ? skip++ : fail++;
    const detail = g === undefined ? "(no result)" : g === c.expected ? "" : `got ${g}`;
    console.log(`  ${pad(tag, 4)}  ${pad(c.id, 40)} expected ${pad(c.expected, 16)} ${detail}`);
  }
  return { pass, fail, skip };
}

async function main() {
  const args = process.argv.slice(2);
  const vi = args.indexOf("--vectors");
  const vectorsSrc = vi >= 0 ? args[vi + 1] : DEFAULT_VECTORS;
  const rest = vi >= 0 ? args.filter((_, i) => i !== vi && i !== vi + 1) : args;
  if (!rest.length) {
    console.log("usage: node run.mjs <candidate-results.json | URL> | --self | --emit  [--vectors <path | URL>]");
    process.exit(2);
  }
  const v = await load(vectorsSrc);
  const interop = (v.interop && v.interop.cases) || [];

  if (rest[0] === "--emit") {
    const r = await selfResults(v);
    const results = Object.fromEntries(Object.entries(r).map(([k, [res]]) => [k, res]));
    console.log(JSON.stringify({ implementation: "run.mjs reference verifier (WebCrypto Ed25519)", results }, null, 2));
    return;
  }

  let got, label;
  if (rest[0] === "--self") {
    const r = await selfResults(v);
    got = Object.fromEntries(Object.entries(r).map(([k, [res]]) => [k, res]));
    label = "run.mjs reference verifier (WebCrypto Ed25519)";
  } else {
    const cand = await load(rest[0]);
    if (!cand || typeof cand.results !== "object") throw new Error('candidate file needs {"results": {"<case id>": "<RESULT>"}}');
    got = cand.results;
    label = cand.implementation || rest[0];
  }

  console.log(`signed-receipts/v1 conformance: ${label}`);
  console.log(`vectors: ${vectorsSrc} (${v.cases.length} core, ${interop.length} interop)`);
  const core = report("Core (Ed25519)", v.cases, got, { optional: false });
  let inter = { pass: 0, fail: 0, skip: 0 };
  if (interop.length) {
    const src = v.interop.source || {};
    inter = report(`Interop (${v.interop.alg}; vectors from ${src.package}@${src.version}, ${src.license ? src.license.split(" ")[0] : ""})`, interop, got, { optional: true });
    if (rest[0] === "--self") console.log("  (this runner has no ML-DSA-65; run the interop cases with that package's own check)");
  }
  const ok = core.fail === 0 && inter.fail === 0;
  console.log(
    `\n${ok ? "ALL MATCH" : "MISMATCH"}: core ${core.pass}/${v.cases.length} PASS` +
      (interop.length ? `, interop ${inter.pass} PASS / ${inter.fail} FAIL / ${inter.skip} SKIP` : "") +
      ". PASS means the result matches the vectors; it is not a certification.",
  );
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("run.mjs")) {
  main().catch((e) => {
    console.error(`error: ${e.message}`);
    process.exit(2);
  });
}
