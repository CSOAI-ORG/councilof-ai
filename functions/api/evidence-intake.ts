/**
 * POST /api/evidence-intake — explicit candidate measurement intake.
 *
 * This is deliberately not a measurement endpoint. It verifies the ephemeral
 * browser signature on one <=3KB candidate receipt and, only when the user has
 * separately opted into network submission, stores the exact receipt for
 * operator review. Storage cannot promote a result to REPRODUCED, MEASURED,
 * SIGNED, WITNESSED, public, or training-eligible.
 */

interface Env {
  LEADS?: KVNamespace;
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

export const MAX_CANDIDATE_BYTES = 3072;
export const MAX_INTAKE_REQUEST_BYTES = 4096;
export const MAX_INTAKE_RECEIPT_BYTES = 3072;

type JsonRecord = Record<string, unknown>;

type IntakeRequest = {
  schema: "csoai.evidence-intake-request/0.1";
  candidate: JsonRecord;
  consent: {
    network_submission: true;
    purpose: "independent-measurement-intake";
    model_training: false;
    public_release: false;
  };
};

type IntakeReceipt = {
  schema: "csoai.measurement-intake-receipt/0.1";
  intake_id: string;
  received_at: string;
  candidate_sha256: string;
  candidate_signature_verified: true;
  idempotency_key: string;
  stored: boolean;
  state: "AWAITING_OPERATOR_REVIEW" | "VERIFIED_NOT_STORED";
  queued: false;
  worker_bound: false;
  measurement_state: "UNMEASURED";
  writes_board: false;
  model_training: false;
  public_release: false;
  witness_requested: false;
  next_required: readonly [
    "independent rerun",
    "published method",
    "independent admission",
  ];
  meaning: string;
};

type ReceiptProof =
  | {
      alg: "Ed25519";
      kid: string;
      public_key_jwk: JsonWebKey;
      sha256: string;
      sig: string;
      signed_bytes: "canonical-json(all fields except proof)";
      attests: string;
    }
  | {
      alg: "UNSIGNED";
      kid: "";
      public_key_jwk: null;
      sha256: string;
      sig: "";
      signed_bytes: "none";
      attests: string;
    };

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;
const BASE64URL_32 = /^[A-Za-z0-9_-]{43}$/;
const utf8 = (value: string) => new TextEncoder().encode(value);

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function text(value: unknown, cap: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= cap;
}

function nullableText(value: unknown, cap: number): boolean {
  return value === null || (typeof value === "string" && value.length <= cap);
}

function nullableNumber(value: unknown, min: number, max: number): boolean {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max)
  );
}

/** Recursively sorted-key JSON, matching the browser candidate signer. */
export function canonicalIntakeJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalIntakeJson(item)).join(",")}]`;
  const record = value as JsonRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalIntakeJson(record[key])}`)
    .join(",")}}`;
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) || [], (part) =>
    Number.parseInt(part, 16),
  );
}

async function sha256(value: string): Promise<string> {
  return hex(
    await crypto.subtle.digest(
      "SHA-256",
      utf8(value) as unknown as BufferSource,
    ),
  );
}

function validCandidateShape(candidate: JsonRecord): boolean {
  if (
    !hasExactKeys(candidate, [
      "schema",
      "subject",
      "source",
      "instrument",
      "executor",
      "result",
      "limitations",
      "legal_review_required",
      "consent",
      "admission",
      "proof",
    ]) ||
    candidate.schema !== "csoai.evidence-observation/0.1" ||
    typeof candidate.legal_review_required !== "boolean" ||
    !Array.isArray(candidate.limitations) ||
    candidate.limitations.length > 12 ||
    !candidate.limitations.every(
      (item) =>
        typeof item === "string" && item.length > 0 && item.length <= 220,
    )
  )
    return false;

  const subject = candidate.subject;
  const source = candidate.source;
  const instrument = candidate.instrument;
  const executor = candidate.executor;
  const result = candidate.result;
  const consent = candidate.consent;
  const admission = candidate.admission;
  const proof = candidate.proof;
  if (
    !isRecord(subject) ||
    !isRecord(source) ||
    !isRecord(instrument) ||
    !isRecord(executor) ||
    !isRecord(result) ||
    !isRecord(consent) ||
    !isRecord(admission) ||
    !isRecord(proof)
  )
    return false;

  if (
    !hasExactKeys(subject, ["kind", "id", "digest"]) ||
    subject.kind !== "tool" ||
    !text(subject.id, 320) ||
    !subject.id.startsWith("https://councilof.ai/") ||
    typeof subject.digest !== "string" ||
    !HEX64.test(subject.digest)
  )
    return false;

  if (
    !hasExactKeys(source, ["kind", "uri", "observed_at"]) ||
    source.kind !== "user" ||
    source.uri !== subject.id ||
    !text(source.observed_at, 40) ||
    !Number.isFinite(Date.parse(source.observed_at))
  )
    return false;

  if (
    !hasExactKeys(instrument, ["id", "version", "digest"]) ||
    !text(instrument.id, 180) ||
    !text(instrument.version, 80) ||
    instrument.digest !== subject.digest
  )
    return false;

  if (
    !hasExactKeys(executor, ["provider", "runtime", "region"]) ||
    executor.provider !== "end-user-browser" ||
    executor.runtime !== "councilof.ai/gspc-quests local-js" ||
    executor.region !== ""
  )
    return false;

  if (
    !hasExactKeys(result, [
      "claim_type",
      "status",
      "payload_digest",
      "payload",
    ]) ||
    result.claim_type !== "human-practice-run-summary" ||
    result.status !== "CANDIDATE_FINDING" ||
    typeof result.payload_digest !== "string" ||
    !HEX64.test(result.payload_digest) ||
    !isRecord(result.payload)
  )
    return false;
  const payload = result.payload;
  if (
    !hasExactKeys(payload, [
      "activity",
      "mode",
      "metric",
      "score",
      "n",
      "correct",
      "answered",
      "unparsed",
      "completed",
      "instrument_digest",
    ]) ||
    !text(payload.activity, 80) ||
    !nullableText(payload.mode, 40) ||
    !nullableText(payload.metric, 40) ||
    !nullableNumber(payload.score, 0, 1) ||
    !nullableNumber(payload.n, 0, 100_000) ||
    !nullableNumber(payload.correct, 0, 100_000) ||
    !nullableNumber(payload.answered, 0, 100_000) ||
    !nullableNumber(payload.unparsed, 0, 100_000) ||
    typeof payload.completed !== "boolean" ||
    payload.instrument_digest !== instrument.digest
  )
    return false;

  if (
    !hasExactKeys(consent, ["scope", "network_submission", "model_training"]) ||
    consent.scope !== "create-and-store-this-receipt-in-this-browser" ||
    consent.network_submission !== false ||
    consent.model_training !== false
  )
    return false;

  if (
    !hasExactKeys(admission, ["next", "required", "never_automatic"]) ||
    admission.next !== "REPRODUCED" ||
    JSON.stringify(admission.required) !==
      JSON.stringify(["independent rerun", "published method", "review"]) ||
    JSON.stringify(admission.never_automatic) !==
      JSON.stringify(["MEASURED", "SIGNED_GSPC", "model_training"])
  )
    return false;

  if (
    !hasExactKeys(proof, [
      "alg",
      "kid",
      "public_key_jwk",
      "sha256",
      "sig",
      "signed_bytes",
      "attests",
    ]) ||
    proof.alg !== "Ed25519" ||
    !text(proof.kid, 160) ||
    typeof proof.sha256 !== "string" ||
    !HEX64.test(proof.sha256) ||
    typeof proof.sig !== "string" ||
    !HEX128.test(proof.sig) ||
    proof.signed_bytes !== "canonical-json(all fields except proof)" ||
    !text(proof.attests, 240) ||
    !isRecord(proof.public_key_jwk)
  )
    return false;
  const jwk = proof.public_key_jwk;
  return (
    !("d" in jwk) &&
    jwk.kty === "OKP" &&
    jwk.crv === "Ed25519" &&
    typeof jwk.x === "string" &&
    BASE64URL_32.test(jwk.x) &&
    jwk.ext === true &&
    Array.isArray(jwk.key_ops) &&
    jwk.key_ops.length === 1 &&
    jwk.key_ops[0] === "verify"
  );
}

export async function verifyCandidateForIntake(
  candidate: unknown,
): Promise<{ ok: true; sha256: string } | { ok: false; reason: string }> {
  if (!isRecord(candidate) || !validCandidateShape(candidate))
    return { ok: false, reason: "candidate receipt has an unsupported shape" };
  if (utf8(JSON.stringify(candidate)).byteLength > MAX_CANDIDATE_BYTES)
    return { ok: false, reason: "candidate receipt exceeds the 3KB cap" };

  const proof = candidate.proof as JsonRecord;
  const result = candidate.result as JsonRecord;
  const { proof: _proof, ...unsigned } = candidate;
  const [candidateDigest, payloadDigest, publicKeyDigest] = await Promise.all([
    sha256(canonicalIntakeJson(unsigned)),
    sha256(canonicalIntakeJson(result.payload)),
    sha256(canonicalIntakeJson(proof.public_key_jwk)),
  ]);
  if (candidateDigest !== proof.sha256)
    return {
      ok: false,
      reason: "candidate digest does not match its signed bytes",
    };
  if (payloadDigest !== result.payload_digest)
    return { ok: false, reason: "candidate payload digest does not match" };
  if (proof.kid !== `urn:sha256:${publicKeyDigest}#ephemeral-browser-key`)
    return {
      ok: false,
      reason: "candidate key identifier does not match its public key",
    };

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      proof.public_key_jwk as JsonWebKey,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "Ed25519",
      key,
      fromHex(String(proof.sig)) as unknown as BufferSource,
      utf8(canonicalIntakeJson(unsigned)) as unknown as BufferSource,
    );
    return verified
      ? { ok: true, sha256: candidateDigest }
      : { ok: false, reason: "candidate Ed25519 signature is invalid" };
  } catch {
    return { ok: false, reason: "candidate Ed25519 key could not be verified" };
  }
}

function parseRequest(value: unknown): IntakeRequest | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["schema", "candidate", "consent"])
  )
    return null;
  if (
    value.schema !== "csoai.evidence-intake-request/0.1" ||
    !isRecord(value.candidate) ||
    !isRecord(value.consent) ||
    !hasExactKeys(value.consent, [
      "network_submission",
      "purpose",
      "model_training",
      "public_release",
    ]) ||
    value.consent.network_submission !== true ||
    value.consent.purpose !== "independent-measurement-intake" ||
    value.consent.model_training !== false ||
    value.consent.public_release !== false
  )
    return null;
  return value as unknown as IntakeRequest;
}

async function signReceipt(
  receipt: IntakeReceipt,
  pkcs8Base64?: string,
): Promise<ReceiptProof> {
  const signedJson = canonicalIntakeJson(receipt);
  const digest = await sha256(signedJson);
  if (!pkcs8Base64) {
    return {
      alg: "UNSIGNED",
      kid: "",
      public_key_jwk: null,
      sha256: digest,
      sig: "",
      signed_bytes: "none",
      attests:
        "Unsigned digest of the intake acknowledgement only; it does not attest that the candidate result is true.",
    };
  }
  const der = Uint8Array.from(atob(pkcs8Base64), (character) =>
    character.charCodeAt(0),
  );
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "Ed25519" },
    true,
    ["sign"],
  );
  const privateJwk = (await crypto.subtle.exportKey(
    "jwk",
    privateKey,
  )) as JsonWebKey;
  if (!privateJwk.x)
    throw new Error("intake signing key has no public component");
  const publicKeyJwk: JsonWebKey = {
    kty: "OKP",
    crv: "Ed25519",
    x: privateJwk.x,
    ext: true,
    key_ops: ["verify"],
  };
  const publicKeyDigest = await sha256(canonicalIntakeJson(publicKeyJwk));
  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    utf8(signedJson) as unknown as BufferSource,
  );
  return {
    alg: "Ed25519",
    kid: `urn:sha256:${publicKeyDigest}#measurement-intake`,
    public_key_jwk: publicKeyJwk,
    sha256: digest,
    sig: hex(signature),
    signed_bytes: "canonical-json(all fields except proof)",
    attests:
      "The Council intake key acknowledged this candidate digest and storage state; it does not attest that the result is true or measured.",
  };
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  if (!sameOrigin(ctx.request))
    return Response.json(
      { error: "cross-origin intake is not allowed" },
      { status: 403 },
    );

  const raw = await ctx.request.text();
  if (utf8(raw).byteLength > MAX_INTAKE_REQUEST_BYTES)
    return Response.json(
      { error: "intake request exceeds 4KB" },
      { status: 413 },
    );

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const request = parseRequest(parsed);
  if (!request)
    return Response.json(
      {
        error:
          "explicit network submission consent is required; training and public release must remain false",
      },
      { status: 400 },
    );

  const verified = await verifyCandidateForIntake(request.candidate);
  if (!verified.ok)
    return Response.json({ error: verified.reason }, { status: 400 });

  const receivedAt = new Date().toISOString();
  const intakeId = `CI-${verified.sha256.slice(0, 24)}`;
  const idempotencyKey = `sha256:${verified.sha256}`;
  let stored = false;
  if (ctx.env.LEADS) {
    try {
      await ctx.env.LEADS.put(
        `evidence-candidate:${verified.sha256}`,
        JSON.stringify({
          schema: "csoai.measurement-intake-record/0.1",
          intake_id: intakeId,
          received_at: receivedAt,
          idempotency_key: idempotencyKey,
          state: "AWAITING_OPERATOR_REVIEW",
          measurement_state: "UNMEASURED",
          model_training: false,
          public_release: false,
          candidate: request.candidate,
        }),
      );
      stored = true;
    } catch {
      stored = false;
    }
  }

  const receipt: IntakeReceipt = {
    schema: "csoai.measurement-intake-receipt/0.1",
    intake_id: intakeId,
    received_at: receivedAt,
    candidate_sha256: `sha256:${verified.sha256}`,
    candidate_signature_verified: true,
    idempotency_key: idempotencyKey,
    stored,
    state: stored ? "AWAITING_OPERATOR_REVIEW" : "VERIFIED_NOT_STORED",
    queued: false,
    worker_bound: false,
    measurement_state: "UNMEASURED",
    writes_board: false,
    model_training: false,
    public_release: false,
    witness_requested: false,
    next_required: [
      "independent rerun",
      "published method",
      "independent admission",
    ],
    meaning: stored
      ? "The signed candidate is stored for operator review. No measurement worker or automatic promotion is attached."
      : "The candidate signature verified, but no durable intake store accepted it. Keep the local receipt and retry later.",
  };
  const proof = await signReceipt(
    receipt,
    ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64,
  );
  const envelope = { ...receipt, proof };
  if (utf8(JSON.stringify(envelope)).byteLength > MAX_INTAKE_RECEIPT_BYTES)
    throw new Error("measurement intake receipt exceeded the 3KB cap");
  return Response.json(envelope, {
    status: stored ? 202 : 503,
    headers: { "cache-control": "no-store" },
  });
};
