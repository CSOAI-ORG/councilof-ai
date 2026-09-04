/**
 * Reference verifier for the EvaluationResult in-toto predicate.
 * spec/EVALUATION-RESULT.md · schema/evaluation-result.schema.json
 *
 * Three states, and UNCHECKABLE is decided BEFORE anything else runs: an input this verifier
 * could not evaluate must never come back as INVALID. "I could not check this" and "this is
 * forged" are different facts, and a boolean loses the one a reader needs.
 */
import { createHash, verify as edVerify, createPublicKey } from "node:crypto";

export const STATES = Object.freeze({ VALID: "VALID", INVALID: "INVALID", UNCHECKABLE: "UNCHECKABLE" });

export const PREDICATE_TYPE = "https://councilof.ai/attestations/evaluation-result/v1";
const STATEMENT_TYPE = "https://in-toto.io/Statement/v1";
const PAYLOAD_TYPE = "application/vnd.in-toto+json";
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const AGGREGATIONS = new Set(["mean", "nanmean", "median", "sum", "exact_match_rate"]);
const GRADINGS = new Set(["deterministic", "model_judge", "human", "mixed"]);
const PROPORTION_AGGS = new Set(["mean", "nanmean"]);

const ok = (v, why, detail) => ({ state: v, why, ...(detail ? { detail } : {}) });

export function canon(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
}

function pae(payloadType, payload) {
  return Buffer.concat([
    Buffer.from(`DSSEv1 ${payloadType.length} ${payloadType} ${payload.length} `, "utf8"),
    payload,
  ]);
}

/** Schema admissibility. Returns null when admissible, else the reason it is not. */
export function checkPredicate(p) {
  if (!p || typeof p !== "object") return "predicate is not an object";
  if (p.schemaVersion !== "councilof.ai/evaluation-result/1") return "unknown schemaVersion";
  if (typeof p.evaluatedAt !== "string" || Number.isNaN(Date.parse(p.evaluatedAt))) return "evaluatedAt is not a timestamp";

  const h = p.harness;
  if (!h || typeof h !== "object") return "harness absent";
  if (!h.name || !h.version) return "harness name/version absent";
  // A truncated pin is not a pin: a prefix is ambiguous and cannot be re-run by a stranger.
  if (!HEX40.test(String(h.commit ?? ""))) return "harness.commit is not a full 40-hex commit";

  const it = p.items;
  if (!it || typeof it !== "object") return "items absent";
  if (!Number.isInteger(it.n) || it.n < 1) return "items.n must be a positive integer";
  if (!HEX64.test(String(it.digest ?? ""))) return "items.digest is not sha256 hex";
  if ("heldOut" in it && typeof it.heldOut !== "boolean") return "items.heldOut must be boolean when present";

  const r = p.result;
  if (!r || typeof r !== "object") return "result absent";
  if (!r.metric) return "result.metric absent";
  if (!AGGREGATIONS.has(r.aggregation)) return `result.aggregation '${r.aggregation}' is outside the closed set`;
  if (typeof r.value !== "number" || !Number.isFinite(r.value)) return "result.value is not a finite number";
  if ("grading" in r && !GRADINGS.has(r.grading)) return "result.grading outside the closed set";

  if (r.interval) {
    const iv = r.interval;
    if (!["wilson", "bootstrap", "none"].includes(iv.kind)) return "interval.kind outside the closed set";
    if (typeof iv.confidence !== "number" || !(iv.confidence > 0 && iv.confidence < 1))
      return "interval.confidence is a probability strictly between 0 and 1";
    if (typeof iv.low !== "number" || typeof iv.high !== "number" || iv.low > iv.high)
      return "interval bounds are not ordered numbers";
    // The trap is the aggregation, not the metric name: a bootstrapped median over an all-zero
    // vector also reports 0.0, and a proportion interval does not describe a median.
    if (iv.kind === "wilson" && !PROPORTION_AGGS.has(r.aggregation))
      return `wilson interval requires a mean/nanmean aggregation, got '${r.aggregation}'`;
  }

  if (!Array.isArray(p.establishes) || p.establishes.length < 1) return "establishes must be a non-empty array";
  if ("doesNotEstablish" in p && !Array.isArray(p.doesNotEstablish)) return "doesNotEstablish must be an array";
  return null;
}

/**
 * @param env    DSSE envelope
 * @param resolveKey  async (keyid) => raw 32-byte Ed25519 public key, or null if unresolvable.
 */
export async function verifyEvaluationResult(env, resolveKey) {
  // ---- UNCHECKABLE gate: everything that means "I could not evaluate this" ----
  if (!env || typeof env !== "object") return ok(STATES.UNCHECKABLE, "input is not an envelope");
  if (env.payloadType !== PAYLOAD_TYPE) return ok(STATES.UNCHECKABLE, `payloadType '${env.payloadType}' outside the profile domain`);
  if (!Array.isArray(env.signatures) || env.signatures.length === 0) return ok(STATES.UNCHECKABLE, "no signatures to check");

  let payload;
  try {
    payload = Buffer.from(String(env.payload ?? ""), "base64");
    // Reject base64 that silently drops characters rather than treating it as a mismatch.
    if (payload.length === 0 || payload.toString("base64").replace(/=+$/, "") !== String(env.payload).replace(/=+$/, ""))
      return ok(STATES.UNCHECKABLE, "payload is not valid base64");
  } catch { return ok(STATES.UNCHECKABLE, "payload could not be decoded"); }

  let stmt;
  try { stmt = JSON.parse(payload.toString("utf8")); }
  catch { return ok(STATES.UNCHECKABLE, "payload is not JSON"); }

  if (!stmt || stmt._type !== STATEMENT_TYPE) return ok(STATES.UNCHECKABLE, "not an in-toto Statement v1");
  if (typeof stmt.predicateType !== "string") return ok(STATES.UNCHECKABLE, "no predicateType");
  if (stmt.predicateType !== PREDICATE_TYPE) {
    // A predicate version this verifier does not implement is an unanswered question, not a failure.
    if (stmt.predicateType.startsWith("https://councilof.ai/attestations/evaluation-result/"))
      return ok(STATES.UNCHECKABLE, `predicate version not implemented: ${stmt.predicateType}`);
    return ok(STATES.INVALID, `predicateType is not ${PREDICATE_TYPE}`);
  }

  const sig = env.signatures[0];
  if (!sig || typeof sig.sig !== "string" || sig.sig.length === 0)
    return ok(STATES.UNCHECKABLE, "signature field present but empty");

  const raw = await resolveKey(sig.keyid);
  if (!raw) return ok(STATES.UNCHECKABLE, `key '${sig.keyid}' could not be resolved`);

  // ---- from here a negative result is a real finding about the bytes ----
  let good = false;
  try {
    const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(raw)]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    good = edVerify(null, pae(PAYLOAD_TYPE, payload), key, Buffer.from(sig.sig, "base64"));
  } catch { good = false; }
  if (!good) return ok(STATES.INVALID, "signature does not verify over these bytes");

  const bad = checkPredicate(stmt.predicate);
  if (bad) return ok(STATES.INVALID, "predicate is inadmissible", bad);

  return ok(STATES.VALID, "signature verifies and the predicate is admissible", {
    subject: stmt.subject?.[0]?.name ?? null,
    evaluatedAt: stmt.predicate.evaluatedAt,
  });
}

export const sha256Hex = (b) => createHash("sha256").update(b).digest("hex");
