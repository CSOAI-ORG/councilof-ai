/**
 * scripts/pubbus/lib.mjs — the publication bus's pure parts: canonical bytes, signature check,
 * OpenTimestamps state read from proof bytes, slugs, and the number extractor the pages are
 * held to. No network and no filesystem here; pubbus.mjs injects both.
 */
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";

export const HF = "https://huggingface.co";
export const SITE = "https://councilof.ai";
export const DID_URL = "https://csoai.org/.well-known/did.json";
export const SIGNED_RUN = "csoai.signed-run/0.1";
export const MANIFEST_SCHEMA = "csoai.pubbus-manifest/0.1";

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** JSON.stringify of the recursively key-sorted value: functions/_lib/cardSign.ts canonicalBytes,
 *  the exact bytes POST /api/board-sign signs (non-ASCII stays literal). */
export function jsCanonical(v) {
  const rec = (x) => {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === "object") {
      const out = {};
      for (const k of Object.keys(x).sort()) out[k] = rec(x[k]);
      return out;
    }
    return x;
  };
  return JSON.stringify(rec(v));
}

/** {fragment: jwk-x} for every Ed25519 method in a DID document. */
export function didKeys(did) {
  const out = {};
  for (const m of did?.verificationMethod ?? []) {
    const j = m.publicKeyJwk ?? {};
    if (j.kty === "OKP" && j.crv === "Ed25519" && typeof j.x === "string" && typeof m.id === "string" && m.id.includes("#")) {
      out[m.id.split("#")[1]] = j.x;
    }
  }
  return out;
}

function edOk(x, sigHex, msg) {
  try {
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
    return edVerify(null, msg, key, Buffer.from(sigHex, "hex"));
  } catch {
    return false;
  }
}

/**
 * Verify a csoai.signed-run/0.1 document. Returns {state, reason?, did, rule, ...}.
 * VERIFIED only when: the schema matches, the key named by signature.did is in the DID
 * document, sha256(canonical(payload)) equals signature.payload_sha256, Ed25519 verifies over
 * the canonical payload, and the same signature REJECTS the payload with one byte appended
 * (a tamper control that must fail, or the check proves nothing).
 */
export function verifySignedRun(doc, keys) {
  const rule = "Ed25519 over canonical(payload): JSON, keys sorted recursively, no whitespace, UTF-8 literal";
  if (!doc || typeof doc !== "object" || doc.schema !== SIGNED_RUN) {
    return { state: "REFUSED", reason: "not a csoai.signed-run/0.1 document", rule };
  }
  const s = doc.signature ?? {};
  const did = typeof s.did === "string" ? s.did : "";
  const frag = did.includes("#") ? did.split("#")[1] : "";
  if (!frag || !keys[frag]) return { state: "REFUSED", reason: `signing key ${did || "(none)"} is not in the DID document`, did, rule };
  if (typeof s.sig_ed25519 !== "string" || !/^[0-9a-f]{128}$/i.test(s.sig_ed25519)) {
    return { state: "REFUSED", reason: "signature.sig_ed25519 is not 64 bytes of hex", did, rule };
  }
  const bytes = Buffer.from(jsCanonical(doc.payload), "utf8");
  const digest = sha256(bytes);
  if (digest !== s.payload_sha256) {
    return { state: "REFUSED", reason: "sha256(canonical payload) does not equal signature.payload_sha256", did, rule };
  }
  if (!edOk(keys[frag], s.sig_ed25519, bytes)) {
    return { state: "REFUSED", reason: "Ed25519 verification returned false", did, rule };
  }
  if (edOk(keys[frag], s.sig_ed25519, Buffer.concat([bytes, Buffer.from(" ")]))) {
    return { state: "REFUSED", reason: "tamper control ACCEPTED an altered payload; the check proves nothing", did, rule };
  }
  return { state: "VERIFIED", did, rule, payload_sha256: digest, signed_at: s.signed_at ?? null, tamper_control: "rejected" };
}

// OpenTimestamps tags, read from the proof bytes (python-opentimestamps core/notary.py).
const OTS_MAGIC = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
const TAG_BITCOIN = Buffer.from("0588960d73d71901", "hex");
const TAG_PENDING = Buffer.from("83dfe30d2ef90c8e", "hex");

/** State of one detached .ots proof, from its bytes. Never claims more than the tags present. */
export function otsStateOfBytes(buf) {
  if (!buf || buf.length < OTS_MAGIC.length || !buf.subarray(0, OTS_MAGIC.length).equals(OTS_MAGIC)) return "NOT_AN_OTS_PROOF";
  if (buf.indexOf(TAG_BITCOIN) !== -1) return "BITCOIN_ATTESTATION_IN_PROOF";
  if (buf.indexOf(TAG_PENDING) !== -1) return "PENDING_CALENDAR_COMMITMENT";
  return "NO_ATTESTATION_IN_PROOF";
}

export const OTS_MEANING = {
  BITCOIN_ATTESTATION_IN_PROOF:
    "The proof bytes carry a Bitcoin block-header attestation tag. This bus did not check the block header; `ots verify` against your own node does.",
  PENDING_CALENDAR_COMMITMENT:
    "Calendars accepted the digest and promised future Bitcoin inclusion. This is a submitted request, not a Bitcoin attestation.",
  NO_ATTESTATION_IN_PROOF: "The proof parses as OpenTimestamps but carries no attestation.",
  NOT_AN_OTS_PROOF: "The file published as a proof is not an OpenTimestamps proof.",
  NO_PROOF_PUBLISHED: "No OpenTimestamps proof is published beside this record.",
  UNMEASURED: "The dataset's file list could not be read, so the proof was not looked for. Not evidence either way.",
};

/** Slug for a record: the dataset for record*.json, else the artifact stem without date/version. */
export function slugFor(dataset, artifactPath) {
  let base = artifactPath.split("/").pop().replace(/\.json$/, "");
  base = base.replace(/\.v\d+(?:\.\d+)*$/, "").replace(/-\d{4}-\d{2}-\d{2}(?:-rev\d+)?$/, "");
  const slug = (base === "record" ? dataset : base).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) throw new Error(`cannot derive a slug from ${dataset}/${artifactPath}`);
  return slug;
}

/**
 * Number tokens as a reader sees them: a digit run (with inner , or .) that is not glued to a
 * letter, digit, underscore, dot or hyphen on the left, nor to a letter/digit/underscore on the
 * right. "Ed25519", "sha256", hex digests and the "-09-25" tail of a date are not numbers here;
 * "4,144", "7.82", "2026" and "54" (from 06:54) are.
 */
export function numberTokens(text) {
  const out = new Set();
  const re = /(?<![A-Za-z0-9_.\-])\d+(?:[.,]\d+)*(?![A-Za-z0-9_])/g;
  let m;
  while ((m = re.exec(text)) !== null) out.add(m[0].replace(/[.,]$/, ""));
  return out;
}

/** Visible text of an HTML page: drop <style>/<script>, comments and tags, decode entities. */
export function visibleText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** Numbers in the page's visible text that appear in NONE of the source texts. Empty = clean. */
export function foreignNumbers(html, sourceTexts) {
  const allowed = new Set();
  for (const t of sourceTexts) for (const n of numberTokens(t)) allowed.add(n);
  return [...numberTokens(visibleText(html))].filter((n) => !allowed.has(n)).sort();
}

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Parse a pinned HF resolve URL into {dataset, revision, path}. */
export function parseHfResolve(url) {
  const m = /^https:\/\/huggingface\.co\/datasets\/csoai\/([^/]+)\/resolve\/([0-9a-f]{40})\/(.+)$/.exec(url || "");
  return m ? { dataset: m[1], revision: m[2], path: decodeURIComponent(m[3]) } : null;
}

export const hfResolve = (dataset, revision, path) => `${HF}/datasets/csoai/${dataset}/resolve/${revision}/${path}`;

/**
 * A number exactly as the file wrote it. JSON.parse turns Python's "3600.0" into 3600, and a
 * page that then printed "3600" would show a number the record never wrote (the pages' own
 * self-check caught exactly that on the first real run). Rendering therefore reads the record
 * with parseJsonRaw, which keeps every numeric literal's source text.
 */
export class RawNum {
  constructor(raw) { this.raw = raw; }
  toString() { return this.raw; }
}

export function parseJsonRaw(text) {
  let i = 0;
  const ws = () => { while (i < text.length && " \t\n\r".includes(text[i])) i++; };
  const fail = (m) => { throw new SyntaxError(`${m} at ${i}`); };
  function value() {
    ws();
    const c = text[i];
    if (c === "{") {
      i++; const o = {}; ws();
      if (text[i] === "}") { i++; return o; }
      for (;;) {
        ws(); if (text[i] !== '"') fail("expected key");
        const k = str(); ws(); if (text[i] !== ":") fail("expected :"); i++;
        o[k] = value(); ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "}") { i++; return o; }
        fail("expected , or }");
      }
    }
    if (c === "[") {
      i++; const a = []; ws();
      if (text[i] === "]") { i++; return a; }
      for (;;) {
        a.push(value()); ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "]") { i++; return a; }
        fail("expected , or ]");
      }
    }
    if (c === '"') return str();
    if (text.startsWith("true", i)) { i += 4; return true; }
    if (text.startsWith("false", i)) { i += 5; return false; }
    if (text.startsWith("null", i)) { i += 4; return null; }
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i, i + 64));
    if (!m) fail("unexpected token");
    i += m[0].length;
    return new RawNum(m[0]);
  }
  function str() {
    const start = i; i++;
    while (i < text.length) {
      if (text[i] === "\\") { i += 2; continue; }
      if (text[i] === '"') { i++; return JSON.parse(text.slice(start, i)); }
      i++;
    }
    fail("unterminated string");
  }
  const v = value(); ws();
  if (i !== text.length) fail("trailing data");
  return v;
}

/** JSON text for display, numbers exactly as written in the source. */
export function rawStringify(v) {
  if (v instanceof RawNum) return v.raw;
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(rawStringify).join(", ")}]`;
  return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${rawStringify(x)}`).join(", ")}}`;
}
