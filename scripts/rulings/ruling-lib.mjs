// csoai.ruling/0.1 — shared primitives for the ruling producer, its tests and its verifier.
// Zero dependencies beyond node:crypto.
//
// CANONICAL FORM. RFC 8785 (JCS) for the value space this profile allows, reusing the one JCS
// the repo already has (scripts/academy/completion-record-lib.mjs): strings, booleans, null,
// safe integers, arrays, objects. A non-integer number is REFUSED rather than canonicalised,
// which is why panel_n_eff is a decimal STRING.
//
// SIGNATURE. Detached, exactly as scripts/sign-corrections-ledger.mjs does it. POST /api/board-sign
// caps a payload at 3072 bytes and a ruling with its verbatim quote and evidence can exceed that,
// so the signer covers a small ASCII attestation that carries content_id = sha256(JCS(record
// without "signature")). A relying party checks both: the digest still describes the record it
// read, and Ed25519 over the attestation verifies under did:web:csoai.org#board-attestation-1.
//
// For this profile the board signer's preimage rule (functions/_lib/cardSign.ts canonicalBytes:
// sorted keys, JSON.stringify) and JCS produce the same bytes; attestationPreimage() checks that
// on every call and refuses if they ever differ.

import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { jcs } from "../academy/completion-record-lib.mjs";

export { jcs };
export const SCHEMA = "csoai.ruling/0.1";
export const ATTESTATION_SCHEMA = "csoai.ruling-attestation/0.1";
export const INDEX_SCHEMA = "csoai.rulings-index/0.1";
export const INDEX_ATTESTATION_SCHEMA = "csoai.rulings-index-attestation/0.1";
export const BOARD_DID = "did:web:csoai.org#board-attestation-1";
// Same pin as functions/api/corrections.ts; the producer also checks it against the live DID
// document before it writes anything.
export const BOARD_KEY_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";
export const SIGN_CAP = 3072;
export const CONTENT_ID_RULE = "sha256(RFC 8785 JCS of the record without its 'signature' key)";
export const INDEX_CONTENT_ID_RULE = "sha256(RFC 8785 JCS of the index without its 'signature' key)";
export const CLASSES = ["admission", "state-name", "board-change", "naming", "dispute", "publication", "other"];
export const VERDICTS = ["CONCUR", "DISSENT", "CANNOT_REPRODUCE"];

/**
 * Key names that would let a ruling carry a measured state. A ruling decides which rule applies
 * and whether its output is served; the state itself comes from the rule. Matched as exact key
 * names at every depth, so panel_state / verbatim_status / writes_measured_state stay legal.
 */
export const MEASURED_STATE_KEYS = new Set([
  "state", "status", "measured_state", "board_state", "axis_state", "separation", "separation_state",
  "grade", "score", "set_state", "new_state", "old_state", "admitted", "admission_state",
  "measured", "unmeasured", "public_count", "measured_count", "axes",
]);

// Fault-tolerance vocabulary. Allowed only when >= 4 reviewers carry their own keys and the
// measured n_eff is >= 4 (n >= 3f+1 with f >= 1). Nothing in 0.1 reaches that bar.
const BFT_WORDS = /\b(BFT|byzantine|fault[- ]tolerant)\b/i;

const hex64 = /^[0-9a-f]{64}$/;
export const sha256Hex = (s) => createHash("sha256").update(s).digest("hex");

function walkKeys(v, path, out) {
  if (Array.isArray(v)) v.forEach((x, i) => walkKeys(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object")
    for (const k of Object.keys(v)) {
      if (MEASURED_STATE_KEYS.has(k)) out.push(`${path}.${k}`);
      walkKeys(v[k], `${path}.${k}`, out);
    }
  return out;
}

/** Throws with every reason a record may not be issued. Never edits the record. */
export function checkRecord(r) {
  const bad = [];
  const req = (c, m) => { if (!c) bad.push(m); };
  req(r && typeof r === "object" && !Array.isArray(r), "record must be an object");
  if (bad.length) throw new Error(bad.join("; "));
  req(r.schema === SCHEMA, `schema must be ${SCHEMA}`);
  req(/^R-\d{4}-\d{4}-\d{2}$/.test(r.ruling_id || ""), "ruling_id must be R-YYYY-MMDD-NN");
  req(CLASSES.includes(r.class), `class must be one of ${CLASSES.join("|")}`);
  req(typeof r.question === "string" && r.question.length >= 10, "question required");
  req(r.rule_applied && typeof r.rule_applied.ref === "string" && r.rule_applied.ref.length >= 3, "rule_applied.ref required");
  req(Array.isArray(r.evidence) && r.evidence.length >= 1, "at least one evidence item");
  for (const e of r.evidence || []) {
    req(/^(https:\/\/|git:)/.test(e.uri || ""), `evidence uri must be https:// or git: (${e.uri})`);
    req(hex64.test(e.sha256 || ""), `evidence sha256 must be 64 lowercase hex (${e.uri})`);
  }
  if (r.rule_output !== null) {
    req(r.rule_output && r.rule_output.origin === "rule", "rule_output.origin must be 'rule': a ruling records a rule's output, it never authors one");
    req(/^git:[A-Za-z0-9._-]+@[0-9a-f]{40}:/.test(r.rule_output?.computed_by || ""), "rule_output.computed_by must name the committed rule (git:<repo>@<40-hex>:<path>)");
  }
  req(r.effect && r.effect.writes_measured_state === false && r.effect.writes_board === false,
    "effect.writes_measured_state and effect.writes_board must both be false");
  const stateKeys = walkKeys(r, "$", []);
  req(stateKeys.length === 0, `a ruling may not carry a measured-state field: ${stateKeys.join(", ")}`);

  const reviewers = Array.isArray(r.reviewers) ? r.reviewers : null;
  req(reviewers !== null, "reviewers must be an array (empty when the panel has not convened)");
  for (const rv of reviewers || []) {
    req(VERDICTS.includes(rv.verdict), `reviewer verdict must be ${VERDICTS.join("|")}`);
    req(hex64.test(rv.rationale_hash || ""), "reviewer rationale_hash must be 64 hex");
  }
  const nEff = r.panel_n_eff === "UNMEASURED" ? null : Number(r.panel_n_eff);
  req(r.panel_n_eff === "UNMEASURED" || /^\d+(\.\d+)?$/.test(String(r.panel_n_eff)), "panel_n_eff must be a decimal string or UNMEASURED");
  if ((reviewers || []).length === 0) {
    req(r.panel_state === "NOT_CONVENED", "no reviewers means panel_state NOT_CONVENED");
    req(r.panel_n_eff === "UNMEASURED", "no reviewers means panel_n_eff UNMEASURED");
  } else if (nEff === null || nEff < 2) {
    req(r.panel_state === "ADVISORY", "panel_n_eff below 2 (or unmeasured) means panel_state ADVISORY");
  } else {
    req(r.panel_state === "INDEPENDENT", "panel_n_eff >= 2 means panel_state INDEPENDENT");
  }
  req(r.binding === "OWNER" && r.decider === "owner", "binding OWNER and decider owner (0.1 defines no other)");

  const keyed = (reviewers || []).filter((x) => typeof x.key === "string" && x.key.length > 0).length;
  const bftEarned = keyed >= 4 && nEff !== null && nEff >= 4;
  const { signature: _s, ...body } = r;
  if (!bftEarned) req(!BFT_WORDS.test(JSON.stringify(body)),
    "fault-tolerance vocabulary needs >= 4 independently keyed reviewers and measured n_eff >= 4");

  const src = r.owner_ruling_source || {};
  req(["QUOTED", "AS_RECORDED", "UNRECORDED"].includes(src.verbatim_status), "owner_ruling_source.verbatim_status required");
  req((src.verbatim_status === "UNRECORDED") === (r.owner_ruling_verbatim === "UNRECORDED"),
    "owner_ruling_verbatim is the literal UNRECORDED exactly when verbatim_status is UNRECORDED");
  req(/^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?Z)?|UNRECORDED)$/.test(r.decided_at || ""), "decided_at must be an ISO date/datetime or UNRECORDED");
  req(r.supersedes === null || /^R-\d{4}-\d{4}-\d{2}$/.test(r.supersedes), "supersedes must be null or a ruling_id");
  req(r.correction_ref === null || /^C-\d{4}-\d{4}-\d{2}$/.test(r.correction_ref), "correction_ref must be null or a correction id");
  // JCS must accept every value (throws on a non-integer number).
  try { jcs(body); } catch (e) { bad.push(String(e.message || e)); }
  if (bad.length) throw new Error("REFUSED: " + bad.join("; "));
  return true;
}

export function contentId(record) {
  const { signature: _s, ...body } = record;
  const canonical = jcs(body);
  return { content_id: sha256Hex(Buffer.from(canonical, "utf8")), bytes: Buffer.byteLength(canonical, "utf8") };
}

/** The board signer's preimage rule, copied from functions/_lib/cardSign.ts canonicalBytes. */
export function signerCanonical(obj) {
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

/** The exact bytes the signer signs; refuses unless the two canonical rules agree and it fits. */
export function attestationPreimage(att) {
  const a = jcs(att);
  const b = signerCanonical(att);
  if (a !== b) throw new Error("JCS and the board signer's canonical form disagree on this attestation; refusing");
  if (/[^\x20-\x7e]/.test(a)) throw new Error("attestation must be printable ASCII");
  if (Buffer.byteLength(a, "utf8") > SIGN_CAP) throw new Error(`attestation exceeds the ${SIGN_CAP}-byte signer cap`);
  return a;
}

export function buildAttestation(record, signedAt) {
  checkRecord(record);
  const { content_id, bytes } = contentId(record);
  const att = {
    schema: ATTESTATION_SCHEMA,
    ruling_id: record.ruling_id,
    class: record.class,
    decided_at: record.decided_at,
    content_id,
    content_id_rule: CONTENT_ID_RULE,
    record_canonical_bytes: bytes,
    signed_at: signedAt,
  };
  attestationPreimage(att);
  return att;
}

export function buildIndex(records) {
  const sorted = [...records].sort((a, b) => (a.ruling_id < b.ruling_id ? -1 : a.ruling_id > b.ruling_id ? 1 : 0));
  const ids = new Set();
  for (const r of sorted) {
    if (ids.has(r.ruling_id)) throw new Error(`duplicate ruling_id ${r.ruling_id}`);
    ids.add(r.ruling_id);
  }
  return {
    schema: INDEX_SCHEMA,
    read_only: true,
    count: sorted.length,
    rulings: sorted.map((r) => ({
      ruling_id: r.ruling_id,
      class: r.class,
      decided_at: r.decided_at,
      content_id: contentId(r).content_id,
      path: `/signed/rulings/${r.ruling_id}.json`,
    })),
  };
}

export function buildIndexAttestation(index, signedAt) {
  const { signature: _s, ...body } = index;
  const canonical = jcs(body);
  const att = {
    schema: INDEX_ATTESTATION_SCHEMA,
    content_id: sha256Hex(Buffer.from(canonical, "utf8")),
    content_id_rule: INDEX_CONTENT_ID_RULE,
    count: body.count,
    latest_ruling_id: body.rulings.length ? body.rulings[body.rulings.length - 1].ruling_id : "",
    signed_at: signedAt,
  };
  attestationPreimage(att);
  return att;
}

/** Ed25519 verify from a raw 32-byte public key, via a minimal SPKI wrapper. */
export function verifyRaw(msg, sigHex, pubHex) {
  const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pubHex, "hex")]);
  const key = createPublicKey({ key: spki, format: "der", type: "spki" });
  return edVerify(null, Buffer.from(msg, "utf8"), key, Buffer.from(sigHex, "hex"));
}

/**
 * VALID only when the Ed25519 signature over the attestation verifies AND the attestation's
 * content_id is the digest of the bytes being read. STALE: signature fine, body moved.
 * INVALID_SIGNATURE: bytes do not verify. UNSIGNED: no signature block.
 */
export function checkSigned(doc, { keyHex = BOARD_KEY_HEX, kind = "record" } = {}) {
  const sig = doc && doc.signature;
  if (!sig || !sig.attestation || typeof sig.sig_ed25519 !== "string") return { state: "UNSIGNED" };
  let ok = false;
  try { ok = verifyRaw(attestationPreimage(sig.attestation), sig.sig_ed25519, keyHex); } catch { ok = false; }
  if (!ok) return { state: "INVALID_SIGNATURE" };
  const { signature: _s, ...body } = doc;
  const recomputed = sha256Hex(Buffer.from(jcs(body), "utf8"));
  const wantSchema = kind === "index" ? INDEX_ATTESTATION_SCHEMA : ATTESTATION_SCHEMA;
  if (sig.attestation.schema !== wantSchema) return { state: "INVALID_SIGNATURE" };
  if (kind === "record" && sig.attestation.ruling_id !== doc.ruling_id) return { state: "INVALID_SIGNATURE" };
  return { state: recomputed === sig.attestation.content_id ? "VALID" : "STALE", recomputed };
}
