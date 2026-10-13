#!/usr/bin/env node
/**
 * sign.mjs - ask the board signer for signatures over by-hand attestations from inside a GitHub
 * Actions job, by OIDC. Run by .github/workflows/hf-fin-shells-attest.yml and by nothing else.
 *
 * WHY. Corrections and rulings were signed by hand with a static bearer token. This gives them a
 * route that needs no stored credential: the job asks GitHub for a short-lived OIDC token, the
 * signer (POST /api/board-sign) checks it, and the reply comes back as a run artifact. The signer
 * is not changed by this file.
 *
 * WHAT IT WILL SIGN. Only the shapes in kinds.json, matched by exact key set and by a value rule
 * on every key. A body that merely carries an attestation's schema label is refused. Every payload
 * of a run is checked before the first network call.
 *
 * WHAT IT WILL KEEP. A reply is kept only when all of this holds:
 *   - HTTP 200;
 *   - reply.payload_sha256 is the sha256 of the bytes this file computed (the rule of
 *     functions/_lib/cardSign.ts canonicalBytes: sorted keys, JSON.stringify, UTF-8);
 *   - reply.did is did:web:csoai.org#board-attestation-1 and reply.signer_auth is github-oidc;
 *   - the key published at https://csoai.org/.well-known/did.json is the pinned key;
 *   - the Ed25519 signature verifies under that key;
 *   - two altered preimages (one appended space; one field value changed) do NOT verify.
 * If any payload of the run fails, nothing is written.
 *
 * THE TOKEN. It is held in one local variable per payload. It is never printed, never written and
 * never put in an error message. No log-masking command is emitted either: that command line would
 * itself carry the token. The two requests that carry a credential refuse to follow a redirect. A
 * reply that repeats the token, or any part of it, is refused whole.
 *
 * THE LOG. A run that reached the signer leaves record lines: CHECKED, CLAIMS, SIGNED, WROTE. Text
 * that came from a payload, an input or the network cannot start a line. A name from a payload is
 * printed quoted, with every character outside letters, digits, "_", "." and "-" written as
 * \uXXXX. Network text is quoted. Every line of a failure starts with "FAILED: ".
 *
 * THE DATE. signed_at must be a real UTC time, not more than a day before this job's clock and
 * not more than five minutes ahead of it (the limits are in kinds.json). This is the job's own
 * rule. The signer does not hold it yet, so it is not a boundary.
 *
 * Node built-ins only. main() runs only when this file is the entry script.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { fileURLToPath } from "node:url";

export const SIGN_URL = "https://councilof.ai/api/board-sign";
export const AUDIENCE = SIGN_URL;
export const DID_URL = "https://csoai.org/.well-known/did.json";
export const BOARD_DID = "did:web:csoai.org#board-attestation-1";
// Same pin as scripts/rulings/ruling-lib.mjs BOARD_KEY_HEX and functions/api/corrections.ts.
export const PINNED_KEY_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";
// The edge refuses some default client agents; the existing OIDC client sends the same prefix
// (scripts/sign_financial_runs.py).
export const USER_AGENT = "Mozilla/5.0 csoai-sign-attest/0.1";
export const NO_OIDC = "OIDC unavailable - refuse laptop sign";

/** Claims of the job's own token that are safe to print. None of them is a credential. */
export const CLAIM_NAMES = [
  "job_workflow_ref", "workflow_ref", "workflow", "ref", "ref_type", "sha", "event_name",
  "repository_id", "repository_owner_id", "run_id", "run_attempt", "aud",
];

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const sha256Hex = (text) => createHash("sha256").update(text, "utf8").digest("hex");

// ---- what may reach a log line ---------------------------------------------------------------

const NAME_CHARS_SHOWN = 80;
const NAMES_LISTED = 12;
const escapeUnit = (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");

/** Any text as one line of printable ASCII: a line break or a control character becomes \uXXXX. */
export function oneLine(text) {
  return String(text).replace(/[^\x20-\x7e]/g, escapeUnit);
}

/**
 * A name that came from a payload or an input, made safe to print. Only letters, digits, "_", "."
 * and "-" are printed as themselves. Every other character is printed as \uXXXX, so a name cannot
 * carry a line break, a space, "::" or "##[" into the log. At most 80 characters are shown.
 */
export function quoteName(name) {
  const s = String(name);
  const shown = s.slice(0, NAME_CHARS_SHOWN).replace(/[^A-Za-z0-9_.-]/g, escapeUnit);
  return `"${shown}"${s.length > NAME_CHARS_SHOWN ? ` (+${s.length - NAME_CHARS_SHOWN} more characters)` : ""}`;
}
const listNames = (names) =>
  names.slice(0, NAMES_LISTED).map(quoteName).join(", ") +
  (names.length > NAMES_LISTED ? ` and ${names.length - NAMES_LISTED} more` : "");

// "##[" is the runner's older command form and is read anywhere in a line, so it is broken up.
const recordLine = (line) => oneLine(line).split("##[").join("#\\u0023[");

export const FAILED_PREFIX = "FAILED: ";
/**
 * What main() prints when a run fails. Every line carries the prefix, so no line of a failure can
 * begin with "::" (a runner command) or with CHECKED, CLAIMS, SIGNED or WROTE (the record lines of
 * a run that reached the signer), whatever the message holds.
 */
export function failureLines(message) {
  return String(message).split("\n").map((l) => FAILED_PREFIX + recordLine(l)).join("\n");
}

// ---- the date rule ---------------------------------------------------------------------------

const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
/** A real UTC time to the second, written YYYY-MM-DDTHH:MM:SSZ. 2026-02-30 and 99:99:99 are not. */
export function isInstant(v) {
  if (typeof v !== "string" || !INSTANT.test(v)) return false;
  const ms = Date.parse(v);
  return Number.isFinite(ms) && new Date(ms).toISOString() === v.replace(/Z$/, ".000Z");
}

/**
 * Why a payload's signed_at is not acceptable at `nowMs` (this job's clock), or null when it is.
 * Without it, a dispatch on master could collect a board signature over an attestation dated in
 * any year. This is the job's rule only: the signer does not hold it, so it is not a boundary.
 */
export function freshnessDefect(payload, kinds, nowMs) {
  const maxAge = kinds?.signed_at_max_age_seconds;
  const maxAhead = kinds?.signed_at_max_ahead_seconds;
  if (!Number.isSafeInteger(maxAge) || !Number.isSafeInteger(maxAhead)) return "the kind registry carries no signed_at limits";
  if (!Number.isFinite(nowMs)) return "this job's clock is unreadable, so the age of signed_at cannot be checked";
  if (!isObject(payload) || !isInstant(payload.signed_at)) return "signed_at is not a real UTC time, so its age cannot be checked";
  const age = Math.floor((nowMs - Date.parse(payload.signed_at)) / 1000);
  if (age > maxAge) return `signed_at is ${age} seconds before this job's clock; the limit is ${maxAge}. Emit the payload again`;
  if (-age > maxAhead) return `signed_at is ${-age} seconds ahead of this job's clock; the limit is ${maxAhead}`;
  return null;
}

/** The signer's preimage rule, copied from functions/_lib/cardSign.ts canonicalBytes. */
export function canonSigner(obj) {
  const rec = (v) => {
    if (Array.isArray(v)) return v.map(rec);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = rec(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(rec(obj));
}

// The signer's never-sign rule, copied from functions/_lib/cardSign.ts signLabelViolation.
const NEVER_SIGN_UPPER = /\b(THIN|TEMPLATE)\b/;
const NEVER_SIGN_SPECIMEN = /\bspecimen\b/i;

/** Returns the offending label, or null when the canonical text carries none. */
export function labelViolation(text) {
  const upper = String(text).match(NEVER_SIGN_UPPER);
  if (upper) return upper[0];
  const specimen = String(text).match(NEVER_SIGN_SPECIMEN);
  if (specimen) return specimen[0];
  return null;
}

export function loadKinds(file = new URL("./kinds.json", import.meta.url)) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Reasons the registry itself cannot be trusted: a key with no rule, two rules, or a stray rule. */
export function registryDefects(kinds) {
  const bad = [];
  if (!isObject(kinds) || !isObject(kinds.kinds)) return ["kinds.json has no kinds object"];
  for (const lim of ["max_payloads", "max_bytes", "signed_at_max_age_seconds", "signed_at_max_ahead_seconds"])
    if (!Number.isSafeInteger(kinds[lim]) || kinds[lim] < 1) bad.push(`${lim} must be a positive integer`);
  for (const [name, spec] of Object.entries(kinds.kinds)) {
    const keys = Array.isArray(spec.keys) ? spec.keys : [];
    if (!keys.length) bad.push(`${name}: no key list`);
    if (new Set(keys).size !== keys.length) bad.push(`${name}: a key is listed twice`);
    const ruled = [
      ...Object.keys(spec.equals || {}),
      ...Object.keys(spec.patterns || {}),
      ...(spec.integers || []),
      ...Object.keys(spec.enums || {}),
      ...(spec.instants || []),
    ];
    for (const k of keys) {
      const n = ruled.filter((r) => r === k).length;
      if (n !== 1) bad.push(`${name}: key ${k} has ${n} rules, needs exactly 1`);
    }
    for (const r of ruled) if (!keys.includes(r)) bad.push(`${name}: a rule names ${r}, which is not a key`);
    for (const [k, v] of Object.entries(spec.equals || {})) if (typeof v !== "string") bad.push(`${name}: equals.${k} is not a string`);
    for (const [k, v] of Object.entries(spec.enums || {}))
      if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== "string")) bad.push(`${name}: enums.${k} is not a list of strings`);
    for (const [k, v] of Object.entries(spec.patterns || {})) {
      // Unanchored, a pattern would admit any string that merely contains a match.
      if (typeof v !== "string" || !v.startsWith("^") || !v.endsWith("$")) { bad.push(`${name}: patterns.${k} is not anchored with ^ and $`); continue; }
      try { new RegExp(v); } catch { bad.push(`${name}: patterns.${k} does not compile`); }
    }
  }
  return bad;
}

/**
 * Throws with every reason a payload may not be signed as `kind`. Returns the preimage facts when
 * it may: { kind, schema, canonical, bytes, payload_sha256 }. Makes no network call. The message
 * is always one line. With `nowMs` (the job's clock) the age of signed_at is checked as well;
 * run() always passes it.
 */
export function validatePayload(kind, payload, kinds, { nowMs } = {}) {
  const defects = registryDefects(kinds);
  if (defects.length) throw new Error(oneLine(`REFUSED: the kind registry is not usable: ${defects.join("; ")}`));
  if (typeof kind !== "string" || !hasOwn(kinds.kinds, kind))
    throw new Error(`REFUSED: unknown kind ${quoteName(kind)}; known kinds: ${Object.keys(kinds.kinds).join(", ")}`);
  if (!isObject(payload)) throw new Error(`REFUSED kind=${kind}: the payload is not a JSON object`);
  const spec = kinds.kinds[kind];
  const bad = [];
  const have = Object.keys(payload);
  const extra = have.filter((k) => !spec.keys.includes(k)).sort();
  const missing = spec.keys.filter((k) => !hasOwn(payload, k)).sort();
  // A key name is the one piece of free text a payload can put into a refusal, so it is quoted.
  if (extra.length) bad.push(`extra key(s): ${listNames(extra)}`);
  if (missing.length) bad.push(`missing key(s): ${missing.join(", ")}`);
  for (const k of spec.keys) {
    if (!hasOwn(payload, k)) continue;
    const v = payload[k];
    if (hasOwn(spec.equals || {}, k)) {
      if (v !== spec.equals[k]) bad.push(`${k} is not the pinned value`);
    } else if (hasOwn(spec.patterns || {}, k)) {
      if (typeof v !== "string" || !new RegExp(spec.patterns[k]).test(v)) bad.push(`${k} does not match ${spec.patterns[k]}`);
    } else if ((spec.integers || []).includes(k)) {
      if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0) bad.push(`${k} is not a non-negative integer`);
    } else if (hasOwn(spec.enums || {}, k)) {
      if (typeof v !== "string" || !spec.enums[k].includes(v)) bad.push(`${k} is not one of ${spec.enums[k].join("|")}`);
    } else if ((spec.instants || []).includes(k)) {
      if (!isInstant(v)) bad.push(`${k} is not a real UTC time written YYYY-MM-DDTHH:MM:SSZ`);
    }
  }
  if (nowMs !== undefined) {
    const stale = freshnessDefect(payload, kinds, nowMs);
    if (stale && !bad.some((b) => b.startsWith("signed_at "))) bad.push(stale);
  }
  const canonical = canonSigner(payload);
  const bytes = Buffer.byteLength(canonical, "utf8");
  if (bytes > kinds.max_bytes) bad.push(`${bytes} canonical bytes exceeds the ${kinds.max_bytes} cap`);
  if (/[^\x20-\x7e]/.test(canonical)) bad.push("the canonical form is not printable ASCII");
  const label = labelViolation(canonical);
  if (label) bad.push(`never-sign label ${label}`);
  if (bad.length) throw new Error(oneLine(`REFUSED kind=${kind}: ${bad.join("; ")}`));
  return { kind, schema: payload.schema, canonical, bytes, payload_sha256: sha256Hex(canonical) };
}

/** base64 of a JSON array of 1 to max_payloads objects -> that array. Makes no network call. */
export function decodePayloads(b64, kinds) {
  const max = kinds.max_payloads;
  if (typeof b64 !== "string" || !b64.trim()) throw new Error("REFUSED: PAYLOADS_B64 is empty");
  const compact = b64.replace(/\s+/g, "");
  if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact))
    throw new Error("REFUSED: PAYLOADS_B64 is not standard base64");
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(compact, "base64"));
  } catch {
    throw new Error("REFUSED: PAYLOADS_B64 does not decode to UTF-8 text");
  }
  let arr;
  try {
    arr = JSON.parse(text);
  } catch {
    throw new Error("REFUSED: PAYLOADS_B64 does not decode to JSON");
  }
  if (!Array.isArray(arr)) throw new Error("REFUSED: the decoded value must be a JSON array of payload objects");
  if (arr.length < 1 || arr.length > max) throw new Error(`REFUSED: ${arr.length} payloads in one run; the limit is 1 to ${max}`);
  arr.forEach((p, i) => {
    if (!isObject(p)) throw new Error(`REFUSED: payload ${i + 1} is not a JSON object`);
  });
  return arr;
}

/** The printable claims of an OIDC token, plus its lifetime. Never returns the token. */
export function pickClaims(jwt) {
  const parts = String(jwt || "").split(".");
  if (parts.length !== 3) throw new Error("the OIDC token is not a three-part JWT");
  let claims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("the OIDC token payload is not JSON");
  }
  if (!isObject(claims)) throw new Error("the OIDC token payload is not a JSON object");
  const printable = (v) =>
    typeof v === "string" || typeof v === "number" || typeof v === "boolean" ||
    (Array.isArray(v) && v.every((x) => typeof x === "string"));
  const out = {};
  for (const k of CLAIM_NAMES) out[k] = printable(claims[k]) ? claims[k] : null;
  out.exp_minus_iat = typeof claims.exp === "number" && typeof claims.iat === "number" ? claims.exp - claims.iat : null;
  return out;
}

/** Ed25519 verify from a raw 32-byte public key (copied from scripts/sign-corrections-ledger.mjs). */
export function verifyRaw(msg, sigHex, pubHex) {
  try {
    if (!/^[0-9a-f]{64}$/.test(pubHex) || !/^[0-9a-f]{128}$/.test(sigHex)) return false;
    const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pubHex, "hex")]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    return edVerify(null, Buffer.from(msg, "utf8"), key, Buffer.from(sigHex, "hex"));
  } catch {
    return false;
  }
}

const redact = (text, secrets) =>
  secrets.filter((s) => typeof s === "string" && s.length >= 8).reduce((t, s) => t.split(s).join("[redacted]"), String(text));

const timeout = (ms) => (typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

/** The board key as published in the DID document, as 64 lowercase hex. This request carries no credential. */
export async function fetchDidKeyHex({ fetchImpl = globalThis.fetch } = {}) {
  const res = await fetchImpl(DID_URL, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    signal: timeout(20000),
  });
  if (res.status !== 200) throw new Error(`${DID_URL} answered HTTP ${res.status}`);
  let doc;
  try {
    doc = JSON.parse(await res.text());
  } catch {
    throw new Error(`${DID_URL} did not return JSON`);
  }
  if (!isObject(doc) || !Array.isArray(doc.verificationMethod)) throw new Error(`${DID_URL} carries no verificationMethod list`);
  const vm = doc.verificationMethod.find((v) => isObject(v) && typeof v.id === "string" && v.id.endsWith("#board-attestation-1"));
  const x = isObject(vm) && isObject(vm.publicKeyJwk) ? vm.publicKeyJwk.x : undefined;
  // 32 bytes in base64url is 43 characters.
  if (typeof x !== "string" || !/^[A-Za-z0-9_-]{43}=?$/.test(x)) throw new Error(`no 32-byte publicKeyJwk.x for ${BOARD_DID} in ${DID_URL}`);
  return Buffer.from(x, "base64url").toString("hex");
}

/** One fresh OIDC token for the signer's audience (request pattern of scripts/sign_financial_runs.py). */
async function requestOidcToken({ env, fetchImpl }) {
  const reqUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL || "";
  const reqTok = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || "";
  if (!reqUrl || !reqTok) throw new Error(NO_OIDC);
  const sep = reqUrl.includes("?") ? "&" : "?";
  const res = await fetchImpl(reqUrl + sep + "audience=" + encodeURIComponent(AUDIENCE), {
    headers: { authorization: `Bearer ${reqTok}`, accept: "application/json" },
    redirect: "error", // the request token goes to this address and nowhere else
    signal: timeout(20000),
  });
  if (res.status !== 200) throw new Error(`the OIDC token request answered HTTP ${res.status}`);
  let value;
  try {
    value = JSON.parse(await res.text()).value;
  } catch {
    value = null;
  }
  if (typeof value !== "string" || value.split(".").length !== 3) throw new Error("the OIDC token request returned no JWT");
  return value;
}

/** A copy of the payload with one field value changed, for the second control preimage. */
function alterOneField(payload) {
  const keys = Object.keys(payload).sort();
  const k = keys.find((x) => typeof payload[x] === "string") ?? keys[0] ?? "control";
  const v = payload[k];
  return { ...payload, [k]: typeof v === "string" ? v + "x" : typeof v === "number" ? v + 1 : "x" };
}

/**
 * Sign one payload: fresh token, one POST, every check. Throws (and returns nothing) unless the
 * reply passes all of them. Writes nothing; run() does the writing once every payload has passed.
 * `didKeyHex` may be passed when the caller has already read the DID document; `onClaims` receives
 * the printable claims as soon as the token exists; `verifyImpl` exists so a test can prove the
 * controls bite.
 */
export async function signOne({
  payload, env = process.env, fetchImpl = globalThis.fetch, pinnedKeyHex = PINNED_KEY_HEX,
  didKeyHex, onClaims, verifyImpl = verifyRaw,
} = {}) {
  const secrets = [env.ACTIONS_ID_TOKEN_REQUEST_TOKEN];
  const repeatsASecret = (text) => secrets.some((s) => typeof s === "string" && s.length >= 8 && text.includes(s));
  try {
    if (!isObject(payload)) throw new Error("the payload is not a JSON object");
    const signUrl = env.BOARD_SIGN_URL || SIGN_URL;
    if (signUrl !== SIGN_URL) throw new Error(`BOARD_SIGN_URL must be ${SIGN_URL}; a token is never sent anywhere else`);
    const canonical = canonSigner(payload);
    const digest = sha256Hex(canonical);
    const bytes = Buffer.byteLength(canonical, "utf8");

    const published = didKeyHex === undefined ? await fetchDidKeyHex({ fetchImpl }) : didKeyHex;
    if (published !== pinnedKeyHex)
      throw new Error(`the key published at ${DID_URL} for ${BOARD_DID} is ${published}, not the pinned ${pinnedKeyHex}`);

    const token = await requestOidcToken({ env, fetchImpl });
    secrets.push(token, ...token.split("."));
    const claims = pickClaims(token);
    if (onClaims) onClaims(claims);

    const res = await fetchImpl(signUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "user-agent": USER_AGENT },
      body: JSON.stringify({ payload }),
      redirect: "error", // the OIDC token goes to this address and nowhere else
      signal: timeout(30000),
    });
    const raw = await res.text();
    // Network text is quoted before it can reach a log line (a newline cannot start a new one).
    if (res.status !== 200)
      throw new Error(`board-sign answered HTTP ${res.status} ${JSON.stringify(redact(raw, secrets).slice(0, 300))}`);
    // The reply is kept as received and uploaded as a run artifact, and anyone signed in to GitHub
    // can download the artifacts of a public repository. So a reply that repeats this job's token,
    // or any of its three parts, is refused whole. Today's signer does not echo it.
    const echoed = `the board-sign reply repeats this job's token or a part of it; the reply is not kept (payload ${digest})`;
    if (repeatsASecret(raw)) throw new Error(echoed);
    let reply;
    try {
      reply = JSON.parse(raw);
    } catch {
      throw new Error("the board-sign reply is not JSON");
    }
    if (!isObject(reply)) throw new Error("the board-sign reply is not a JSON object");
    if (repeatsASecret(JSON.stringify(reply))) throw new Error(echoed); // the same text under JSON escapes
    if (reply.payload_sha256 !== digest)
      throw new Error(`preimage disagreement: the signer hashed ${JSON.stringify(String(reply.payload_sha256).slice(0, 64))}, this job computes ${digest}`);
    if (reply.did !== BOARD_DID) throw new Error(`the signer named ${JSON.stringify(String(reply.did).slice(0, 80))}, expected ${BOARD_DID}`);
    if (reply.signer_auth !== "github-oidc")
      throw new Error(`signer_auth is ${JSON.stringify(String(reply.signer_auth).slice(0, 40))}, expected "github-oidc" (payload ${digest})`);
    if (typeof reply.sig_ed25519 !== "string" || !/^[0-9a-f]{128}$/.test(reply.sig_ed25519))
      throw new Error(`the reply carries no 64-byte hex signature (payload ${digest})`);
    if (!verifyImpl(canonical, reply.sig_ed25519, pinnedKeyHex))
      throw new Error(`the returned signature does not verify under the pinned board key (payload ${digest})`);

    // A check that cannot fail proves nothing: both altered preimages must be rejected.
    const changed = canonSigner(alterOneField(payload));
    if (changed === canonical) throw new Error("the changed-field control did not change the preimage");
    const controls = {
      appended_space_rejected: !verifyImpl(canonical + " ", reply.sig_ed25519, pinnedKeyHex),
      changed_field_rejected: !verifyImpl(changed, reply.sig_ed25519, pinnedKeyHex),
    };
    if (!controls.appended_space_rejected || !controls.changed_field_rejected)
      throw new Error(`an altered preimage verified (${JSON.stringify(controls)}); the check cannot tell a signed payload from a changed one`);

    return { payload, canonical, bytes, payload_sha256: digest, reply, raw, claims, controls };
  } catch (e) {
    // The engine's reason for a failed request (a refused redirect, a closed socket) is in `cause`.
    const cause = typeof e?.cause?.message === "string" ? ` (${e.cause.message})` : "";
    throw new Error(redact(`${e?.message || e}${cause}`, secrets));
  }
}

/** The signer's own timestamp, printed only when it looks like one. */
const isoOrUnreadable = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/.test(v) ? v : "UNREADABLE");

function headCommit() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

/**
 * The whole run. Order: decode, check EVERY payload (shape and date), require the OIDC variables,
 * read the DID document, then sign one payload at a time. Files are written only after every
 * payload passed. `now` is the job's clock; a test passes its own.
 */
export async function run({
  env = process.env, fetchImpl = globalThis.fetch, outDir, log = console.log,
  kinds = loadKinds(), pinnedKeyHex = PINNED_KEY_HEX, now = Date.now,
} = {}) {
  const say = (line) => log(recordLine(line)); // one call, one line
  const kind = String(env.KIND ?? "");
  if (!isObject(kinds?.kinds) || !hasOwn(kinds.kinds, kind))
    throw new Error(`REFUSED: unknown kind ${quoteName(kind)}; known kinds: ${Object.keys(kinds?.kinds || {}).join(", ")}`);
  const payloads = decodePayloads(env.PAYLOADS_B64, kinds);

  const nowMs = Number(now());
  const refusals = [];
  const checked = payloads.map((p, i) => {
    try {
      return validatePayload(kind, p, kinds, { nowMs });
    } catch (e) {
      refusals.push(`payload ${i + 1} of ${payloads.length}: ${oneLine(e.message)}`); // one line per payload
      return null;
    }
  });
  if (refusals.length) throw new Error(refusals.join("\n"));
  const digests = checked.map((c) => c.payload_sha256);
  if (new Set(digests).size !== digests.length) throw new Error("REFUSED: the same payload appears twice in this run");

  say(`CHECKED kind=${kind} payloads=${payloads.length} bytes=${checked.map((c) => c.bytes).join(",")} (before any network call)`);

  if (!env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) throw new Error(NO_OIDC);
  if ((env.BOARD_SIGN_URL || SIGN_URL) !== SIGN_URL) throw new Error(`BOARD_SIGN_URL must be ${SIGN_URL}; a token is never sent anywhere else`);
  const dir = outDir || env.OUT_DIR;
  if (!dir) throw new Error("OUT_DIR is not set");
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) throw new Error(`OUT_DIR ${dir} is not empty; refusing to mix runs`);

  let didKeyHex;
  try {
    didKeyHex = await fetchDidKeyHex({ fetchImpl });
  } catch (e) {
    throw new Error(redact(e?.message || e, [env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]));
  }
  if (didKeyHex !== pinnedKeyHex)
    throw new Error(`the key published at ${DID_URL} for ${BOARD_DID} is ${didKeyHex}, not the pinned ${pinnedKeyHex}; nothing was sent to the signer`);

  let firstClaims = null;
  const signed = [];
  for (let i = 0; i < payloads.length; i++) {
    let s;
    try {
      s = await signOne({
        payload: payloads[i], env, fetchImpl, pinnedKeyHex, didKeyHex,
        onClaims: (c) => {
          if (firstClaims) return;
          firstClaims = c;
          say(`CLAIMS ${JSON.stringify(c)}`);
        },
      });
    } catch (e) {
      const kept = signed.map((x) => x.payload_sha256).join(", ") || "none";
      throw new Error(`payload ${i + 1} of ${payloads.length}: ${oneLine(e.message)}\nnothing was written. Signatures already returned in this run and discarded: ${kept}`);
    }
    signed.push(s);
    say(`SIGNED kind=${kind} schema=${checked[i].schema} bytes=${s.bytes} payload_sha256=${s.payload_sha256} signer_auth=${s.reply.signer_auth} signed_at=${isoOrUnreadable(s.reply.signed_at)}`);
  }

  fs.mkdirSync(dir, { recursive: true });
  const signatures = signed.map((s, i) => {
    const payloadFile = `${i + 1}-${s.payload_sha256}.payload.json`;
    const replyFile = `${s.payload_sha256}.board-sign.json`;
    fs.writeFileSync(path.join(dir, payloadFile), s.canonical); // the signed preimage, byte for byte
    fs.writeFileSync(path.join(dir, replyFile), s.raw); // the signer's reply as received
    return {
      n: i + 1,
      kind,
      schema: checked[i].schema,
      bytes: s.bytes,
      payload_sha256: s.payload_sha256,
      sig_ed25519: s.reply.sig_ed25519,
      did: s.reply.did,
      signer_auth: s.reply.signer_auth,
      signed_at: isoOrUnreadable(s.reply.signed_at),
      payload_file: payloadFile,
      reply_file: replyFile,
      verified_under_pinned_key: true,
      controls: s.controls,
    };
  });
  const receipt = {
    about: "What the board signer returned to this run. This file is a run record; it is not itself signed. " +
      "Each payload file holds the signed preimage byte for byte, so its sha256 is its payload_sha256.",
    kind,
    run_id: env.GITHUB_RUN_ID ?? null,
    run_attempt: env.GITHUB_RUN_ATTEMPT ?? null,
    commit: env.GITHUB_SHA ?? null,
    checked_out_commit: headCommit(),
    checked_at: new Date(nowMs).toISOString(), // the clock the signed_at rule was judged against
    repository: env.GITHUB_REPOSITORY ?? null,
    workflow: env.GITHUB_WORKFLOW ?? null,
    ref: env.GITHUB_REF ?? null,
    sign_url: SIGN_URL,
    did: BOARD_DID,
    key_ed25519_hex: pinnedKeyHex,
    did_document: DID_URL,
    claims: firstClaims,
    signatures,
  };
  fs.writeFileSync(path.join(dir, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  say(`WROTE ${signatures.length} signature(s) and receipt.json to ${dir}`);
  return receipt;
}

async function main() {
  try {
    await run();
    return 0;
  } catch (e) {
    console.error(failureLines(redact(e?.message || e, [process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN])));
    return 1;
  }
}

const isEntry = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (isEntry) main().then((code) => process.exit(code));
