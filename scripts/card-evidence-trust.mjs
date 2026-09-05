/**
 * Fail-closed trust classification for GSPC measurement-card envelopes.
 *
 * A board/card signature proves provenance and byte integrity. It does not, by
 * itself, prove that the measurement was independently admitted. New quotable
 * cards therefore need two independently pinned Ed25519 checks:
 *
 *   1. the card envelope under a key in the GSPC verifier profile; and
 *   2. `admission` under the configured measurement-adjudicator key.
 *
 * Historical envelopes are retained as LEGACY_UNADJUDICATED after their card
 * signature verifies. They are evidence inventory, but never quotable output.
 */
import { verifyCard, defaultProfile } from "../packages/gspc-card-verifier/src/index.mjs";

export const EVIDENCE_STATES = Object.freeze({
  ADMITTED_VERIFIED: "ADMITTED_VERIFIED",
  LEGACY_UNADJUDICATED: "LEGACY_UNADJUDICATED",
  UNVERIFIED: "UNVERIFIED",
});

export const ADMISSION_SCHEMA = "csoai.measurement-admission/0.1";

const SHA256 = /^[0-9a-f]{64}$/;
const ED25519_SIGNATURE = /^[0-9a-fA-F]{128}$/;
const ED25519_PUBLIC_KEY = /^[0-9a-fA-F]{64}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const ADMISSION_FIELDS = new Set([
  "schema",
  "body_sha256",
  "evidence_bundle_sha256",
  "reproduction_receipt_sha256",
  "method_sha256",
  "reviewer",
  "admitted_at",
  "adjudicator",
]);
const ADJUDICATOR_FIELDS = new Set(["kid", "alg", "signature"]);

const valid = (extra = {}) => ({ state: "VALID", code: "OK", ...extra });
const invalid = (code, reason) => ({ state: "INVALID", code, reason });
const uncheckable = (code, reason) => ({ state: "UNCHECKABLE", code, reason });

/**
 * Final defensive gate for derived quotable outputs. Requiring every field to
 * agree prevents a stale `signed:true` flag from becoming a score or finding.
 */
export function isQuotableMatrixCell(cell) {
  return Boolean(
    cell &&
      cell.evidence_state === EVIDENCE_STATES.ADMITTED_VERIFIED &&
      cell.signature_verified === true &&
      cell.admitted === true &&
      cell.quotable === true &&
      cell.signed === true &&
      typeof cell.accuracy === "number" &&
      Number.isFinite(cell.accuracy) &&
      cell.accuracy >= 0 &&
      cell.accuracy <= 1,
  );
}

function sameFields(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === expected.size && actual.every((key) => expected.has(key));
}

function sortedJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortedJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortedJsonValue(value[key])]),
    );
  }
  return value;
}

/** Match Python json.dumps(sort_keys=True,separators=(",",":"),ensure_ascii=False). */
export function admissionPreimage(admission) {
  const copy = structuredClone(admission);
  if (copy?.adjudicator && typeof copy.adjudicator === "object") {
    delete copy.adjudicator.signature;
  }
  return new TextEncoder().encode(JSON.stringify(sortedJsonValue(copy)));
}

function signerPublicKey(card, profile) {
  if (typeof card?.did === "string" && card.did) {
    if (profile?.pinnedKeys && Object.hasOwn(profile.pinnedKeys, card.did)) {
      return profile.pinnedKeys[card.did];
    }
    if (card.did === profile?.pinnedKeyId) return profile?.pinnedPubkeyHex;
    return null;
  }
  return typeof card?.pubkey === "string" ? profile?.pinnedPubkeyHex : null;
}

function measurementSignerAllowed(card, profile) {
  // Historical inline cards are already restricted to pinnedPubkeyHex by
  // verifyCard. DID-keyed cards additionally need a purpose allow-list: merely
  // appearing in a DID document does not authorise a site-release key to issue
  // measurement cards.
  if (typeof card?.did !== "string" || !card.did) return true;
  const allowed = new Set(
    Array.isArray(profile?.measurementSignerKeyIds)
      ? profile.measurementSignerKeyIds
      : [profile?.pinnedKeyId, "did:web:csoai.org#board-attestation-1"].filter(Boolean),
  );
  return allowed.has(card.did);
}

/**
 * Load the same externally pinned adjudicator identity used by sign_mill_cards.
 * The public key is configuration, never accepted from a card. No variables is
 * a valid empty configuration; a partial or malformed pin is a build error.
 */
export function admissionKeysFromEnvironment(env = process.env) {
  const kid = String(env.MILL_ADJUDICATOR_KID ?? "").trim();
  const publicKey = String(env.MILL_ADJUDICATOR_PUBLIC_KEY_HEX ?? "").trim();
  if (!kid && !publicKey) return {};
  if (!kid || !publicKey) {
    throw new Error(
      "MILL_ADJUDICATOR_KID and MILL_ADJUDICATOR_PUBLIC_KEY_HEX must be configured together",
    );
  }
  if (!ED25519_PUBLIC_KEY.test(publicKey)) {
    throw new Error("MILL_ADJUDICATOR_PUBLIC_KEY_HEX must be a raw 32-byte Ed25519 key in hex");
  }
  return { [kid]: publicKey.toLowerCase() };
}

export async function verifyMeasurementAdmission(
  admission,
  { bodySha256, allowedKeys = {}, cardSignerPublicKey = null } = {},
) {
  if (!sameFields(admission, ADMISSION_FIELDS)) {
    return invalid(
      "MALFORMED_ADMISSION",
      "admission must contain exactly the csoai.measurement-admission/0.1 fields",
    );
  }
  if (admission.schema !== ADMISSION_SCHEMA) {
    return invalid("ADMISSION_SCHEMA_MISMATCH", `admission schema must be ${ADMISSION_SCHEMA}`);
  }
  if (!SHA256.test(String(bodySha256 ?? "")) || admission.body_sha256 !== bodySha256) {
    return invalid("ADMISSION_BODY_MISMATCH", "admission does not bind the verified canonical card body");
  }
  for (const field of [
    "body_sha256",
    "evidence_bundle_sha256",
    "reproduction_receipt_sha256",
    "method_sha256",
  ]) {
    if (!SHA256.test(String(admission[field] ?? ""))) {
      return invalid("MALFORMED_ADMISSION", `admission.${field} must be lowercase sha256 hex`);
    }
  }
  if (
    typeof admission.reviewer !== "string" ||
    !admission.reviewer.trim() ||
    admission.reviewer.length > 256
  ) {
    return invalid("MALFORMED_ADMISSION", "admission.reviewer must be a non-empty string of at most 256 characters");
  }
  if (!RFC3339.test(String(admission.admitted_at ?? "")) || Number.isNaN(Date.parse(admission.admitted_at))) {
    return invalid("MALFORMED_ADMISSION", "admission.admitted_at must be RFC3339 with an explicit timezone");
  }

  const adjudicator = admission.adjudicator;
  if (!sameFields(adjudicator, ADJUDICATOR_FIELDS)) {
    return invalid("MALFORMED_ADMISSION", "admission.adjudicator must contain exactly kid, alg and signature");
  }
  if (typeof adjudicator.kid !== "string" || !adjudicator.kid.trim()) {
    return invalid("MALFORMED_ADMISSION", "admission.adjudicator.kid must be a non-empty string");
  }
  if (adjudicator.alg !== "Ed25519" || !ED25519_SIGNATURE.test(String(adjudicator.signature ?? ""))) {
    return invalid("MALFORMED_ADMISSION", "admission adjudicator must carry a 64-byte Ed25519 signature");
  }

  const pinned = allowedKeys[adjudicator.kid];
  if (typeof pinned !== "string") {
    return uncheckable(
      "NO_PINNED_ADJUDICATOR_KEY",
      `no independently pinned public key is configured for ${adjudicator.kid}`,
    );
  }
  if (!ED25519_PUBLIC_KEY.test(pinned)) {
    return uncheckable(
      "MALFORMED_ADJUDICATOR_PIN",
      `the configured public key for ${adjudicator.kid} is not raw 32-byte Ed25519 hex`,
    );
  }
  if (
    typeof cardSignerPublicKey === "string" &&
    pinned.toLowerCase() === cardSignerPublicKey.toLowerCase()
  ) {
    return invalid(
      "ADJUDICATOR_REUSES_CARD_SIGNER",
      "measurement admission must use an independently pinned key, not the card signer",
    );
  }

  let key;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(pinned.match(/../g), (byte) => Number.parseInt(byte, 16)),
      "Ed25519",
      false,
      ["verify"],
    );
  } catch {
    return uncheckable("NO_ED25519_RUNTIME", "this runtime could not import the pinned adjudicator key");
  }
  try {
    const ok = await crypto.subtle.verify(
      "Ed25519",
      key,
      Uint8Array.from(adjudicator.signature.match(/../g), (byte) => Number.parseInt(byte, 16)),
      admissionPreimage(admission),
    );
    return ok
      ? valid({ kid: adjudicator.kid })
      : invalid("ADMISSION_SIGNATURE_MISMATCH", "admission signature does not verify under the pinned adjudicator key");
  } catch (error) {
    return uncheckable("NO_ED25519_RUNTIME", `admission verification could not run: ${error.message}`);
  }
}

/**
 * Classify a card without ever collapsing missing verification into success.
 * `signatureVerified` reports the cryptographic fact; any legacy downstream
 * `signed` gate must use the stronger ADMITTED_VERIFIED/quotable state.
 */
export async function classifyCardEvidence(
  card,
  { profile = defaultProfile(), allowedAdmissionKeys = {} } = {},
) {
  const cardVerification = await verifyCard(card, profile);
  if (cardVerification.state !== "VALID") {
    return {
      state: EVIDENCE_STATES.UNVERIFIED,
      signatureVerified: false,
      admitted: false,
      quotable: false,
      cardVerification,
      admissionVerification: null,
    };
  }

  if (!measurementSignerAllowed(card, profile)) {
    return {
      state: EVIDENCE_STATES.UNVERIFIED,
      signatureVerified: true,
      admitted: false,
      quotable: false,
      cardVerification,
      signerAuthorization: invalid(
        "CARD_SIGNER_NOT_ALLOWED_FOR_MEASUREMENT",
        `${card.did} is pinned, but is not declared for the measurement-card signing purpose`,
      ),
      admissionVerification: null,
    };
  }

  if (!Object.hasOwn(card, "admission")) {
    return {
      state: EVIDENCE_STATES.LEGACY_UNADJUDICATED,
      signatureVerified: true,
      admitted: false,
      quotable: false,
      cardVerification,
      admissionVerification: uncheckable(
        "LEGACY_NO_ADMISSION",
        "card signature verifies, but this historical envelope carries no independent measurement admission",
      ),
    };
  }

  const admissionVerification = await verifyMeasurementAdmission(card.admission, {
    bodySha256: card.id,
    allowedKeys: allowedAdmissionKeys,
    cardSignerPublicKey: signerPublicKey(card, profile),
  });
  if (admissionVerification.state !== "VALID") {
    return {
      state: EVIDENCE_STATES.UNVERIFIED,
      signatureVerified: true,
      admitted: false,
      quotable: false,
      cardVerification,
      admissionVerification,
    };
  }
  if (card.body?.status !== "MEASURED") {
    return {
      state: EVIDENCE_STATES.UNVERIFIED,
      signatureVerified: true,
      admitted: false,
      quotable: false,
      cardVerification,
      admissionVerification: invalid(
        "BODY_NOT_MEASURED",
        "a valid admission cannot make a body quotable unless body.status is exactly MEASURED",
      ),
    };
  }
  if (
    typeof card.body.model !== "string" ||
    !card.body.model.trim() ||
    typeof card.body.axis !== "string" ||
    !card.body.axis.trim() ||
    !Number.isInteger(card.body.n) ||
    card.body.n <= 0 ||
    typeof card.body.accuracy !== "number" ||
    !Number.isFinite(card.body.accuracy) ||
    card.body.accuracy < 0 ||
    card.body.accuracy > 1
  ) {
    return {
      state: EVIDENCE_STATES.UNVERIFIED,
      signatureVerified: true,
      admitted: false,
      quotable: false,
      cardVerification,
      admissionVerification: invalid(
        "MALFORMED_MEASUREMENT_BODY",
        "an admitted mill body requires non-empty model/axis, positive integer n, and accuracy in [0,1]",
      ),
    };
  }

  return {
    state: EVIDENCE_STATES.ADMITTED_VERIFIED,
    signatureVerified: true,
    admitted: true,
    quotable: true,
    cardVerification,
    admissionVerification,
  };
}
