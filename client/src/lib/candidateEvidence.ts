export const CANDIDATE_MESSAGE_TYPE = "csoai:candidate-observation";
export const CANDIDATE_PENDING_KEY = "coai.candidate.pending.v1";
export const CANDIDATE_RECEIPTS_KEY = "coai.candidate.receipts.v1";
export const MAX_CANDIDATE_BYTES = 3072;

const HEX64 = /^[0-9a-f]{64}$/;
const LEGAL_REVIEW_AXES = new Set([
  "governance",
  "provenance",
  "openness",
  "machinery-conformity",
  "care",
  "cross-reality",
  "art5-safeguard",
  "affect",
]);

export type CandidateObservation = {
  surface: string;
  activity: string;
  sourcePath: string;
  axis?: string;
  mode?: string;
  score?: number;
  metric?: string;
  n?: number;
  correct?: number;
  answered?: number;
  unparsed?: number;
  completed?: boolean;
  instrumentKey: string;
  instrumentId: string;
  instrumentVersion: string;
  instrumentDigest: string;
  limitations?: string[];
};

export type CandidateMessage = {
  type: typeof CANDIDATE_MESSAGE_TYPE;
  observation: CandidateObservation;
};

export type CandidateResultPayload = {
  activity: string;
  mode: string | null;
  metric: string | null;
  score: number | null;
  n: number | null;
  correct: number | null;
  answered: number | null;
  unparsed: number | null;
  completed: boolean;
  instrument_digest: string;
};

type Admission = {
  next: "REPRODUCED";
  required: readonly ["independent rerun", "published method", "review"];
  never_automatic: readonly ["MEASURED", "SIGNED_GSPC", "model_training"];
};

export type SignedCandidateReceipt = {
  schema: "csoai.evidence-observation/0.1";
  subject: { kind: "tool"; id: string; digest: string };
  source: { kind: "user"; uri: string; observed_at: string };
  instrument: { id: string; version: string; digest: string };
  executor: {
    provider: "end-user-browser";
    runtime: "councilof.ai/gspc-quests local-js";
    region: "";
  };
  result: {
    claim_type: "human-practice-run-summary";
    status: "CANDIDATE_FINDING";
    payload_digest: string;
    payload: CandidateResultPayload;
  };
  limitations: string[];
  legal_review_required: boolean;
  consent: {
    scope: "create-and-store-this-receipt-in-this-browser";
    network_submission: false;
    model_training: false;
  };
  admission: Admission;
  proof: {
    alg: "Ed25519";
    kid: string;
    public_key_jwk: JsonWebKey;
    sha256: string;
    sig: string;
    signed_bytes: "canonical-json(all fields except proof)";
    attests: string;
  };
};

export type MeasurementIntakeReceipt = {
  schema: "csoai.measurement-intake-receipt/0.1";
  intake_id: string;
  candidate_sha256: string;
  candidate_signature_verified: true;
  stored: boolean;
  state: "AWAITING_OPERATOR_REVIEW" | "VERIFIED_NOT_STORED";
  queued: false;
  worker_bound: false;
  measurement_state: "UNMEASURED";
  writes_board: false;
  model_training: false;
  public_release: false;
  witness_requested: false;
  meaning: string;
  proof: {
    alg: "Ed25519" | "UNSIGNED";
    sha256: string;
    sig: string;
  };
};

type UnsignedCandidateReceipt = Omit<SignedCandidateReceipt, "proof">;

function truncateUtf8(value: string, cap: number): string {
  let bytes = 0;
  let output = "";
  for (const character of value) {
    const next = new TextEncoder().encode(character).byteLength;
    if (bytes + next > cap) break;
    output += character;
    bytes += next;
  }
  return output;
}

function cleanText(value: unknown, fallback: string, byteCap: number): string {
  const cleaned = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const capped = truncateUtf8(cleaned, byteCap);
  return capped || fallback;
}

function finite(value: unknown, min: number, max: number): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : undefined;
}

/** Accept the small practice-result vocabulary; discard everything else. */
export function normalizeCandidateObservation(
  raw: unknown,
): CandidateObservation | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const surface = cleanText(value.surface, "", 80);
  const activity = cleanText(value.activity, "", 80);
  const sourcePath = cleanText(value.sourcePath, "/dashboard", 180);
  const instrumentKey = cleanText(value.instrumentKey, "", 80);
  const instrumentId = cleanText(value.instrumentId, "", 180);
  const instrumentVersion = cleanText(value.instrumentVersion, "", 80);
  const instrumentDigest = cleanText(
    value.instrumentDigest,
    "",
    64,
  ).toLowerCase();
  if (
    !surface ||
    !activity ||
    !sourcePath.startsWith("/") ||
    !instrumentKey ||
    !instrumentId ||
    !instrumentVersion ||
    !HEX64.test(instrumentDigest)
  )
    return null;

  const score = finite(value.score, 0, 1);
  const n = finite(value.n, 0, 100_000);
  const correct = finite(value.correct, 0, 100_000);
  const answered = finite(value.answered, 0, 100_000);
  const unparsed = finite(value.unparsed, 0, 100_000);
  const limitations = Array.isArray(value.limitations)
    ? value.limitations
        .map((item) => cleanText(item, "", 120))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  return {
    surface,
    activity,
    sourcePath,
    instrumentKey,
    instrumentId,
    instrumentVersion,
    instrumentDigest,
    ...(value.axis ? { axis: cleanText(value.axis, "", 60) } : {}),
    ...(value.mode ? { mode: cleanText(value.mode, "", 40) } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(value.metric ? { metric: cleanText(value.metric, "", 40) } : {}),
    ...(n !== undefined ? { n } : {}),
    ...(correct !== undefined ? { correct } : {}),
    ...(answered !== undefined ? { answered } : {}),
    ...(unparsed !== undefined ? { unparsed } : {}),
    completed: value.completed === true,
    ...(limitations.length ? { limitations } : {}),
  };
}

export function isCandidateMessage(raw: unknown): raw is CandidateMessage {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const value = raw as Record<string, unknown>;
  return (
    value.type === CANDIDATE_MESSAGE_TYPE &&
    normalizeCandidateObservation(value.observation) !== null
  );
}

/** Stable JSON used by the payload digest, receipt digest and signature. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) || [], (part) =>
    Number.parseInt(part, 16),
  );
}

function bytesOf(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJson(value));
}

async function digestHex(cryptoImpl: Crypto, value: unknown): Promise<string> {
  return hex(
    await cryptoImpl.subtle.digest(
      "SHA-256",
      bytesOf(value) as unknown as BufferSource,
    ),
  );
}

export function candidateReceiptBytes(receipt: SignedCandidateReceipt): number {
  return new TextEncoder().encode(JSON.stringify(receipt)).byteLength;
}

function receiptUri(observation: CandidateObservation): string {
  const path = observation.sourcePath.split("#")[0];
  return `https://councilof.ai${path}#${encodeURIComponent(observation.instrumentKey)}`;
}

function limitationsFor(observation: CandidateObservation): string[] {
  const rows = [
    "self-attested browser result",
    "not independently reproduced",
    "no user identity asserted",
    "raw item responses not retained",
    "not a GSPC measurement",
    "not a qualification/certificate",
    "not authorised for model training",
  ];
  if (typeof observation.n === "number" && observation.n < 30)
    rows.push("n < usable_n=30");
  if (observation.mode === "daily") rows.push("daily n=1");
  if (observation.mode === "one-device-co-op") rows.push("one-device co-op");
  rows.push(...(observation.limitations || []));
  return [
    ...new Set(rows.map((row) => cleanText(row, "", 220)).filter(Boolean)),
  ];
}

const ADMISSION: Admission = {
  next: "REPRODUCED",
  required: ["independent rerun", "published method", "review"],
  never_automatic: ["MEASURED", "SIGNED_GSPC", "model_training"],
};

/** Sign the complete evidence-observation envelope with an ephemeral browser key. */
export async function signCandidateObservation(
  observation: CandidateObservation,
  options: { crypto?: Crypto; now?: string } = {},
): Promise<SignedCandidateReceipt> {
  const normalized = normalizeCandidateObservation(observation);
  if (!normalized)
    throw new Error("The frozen instrument or result is incomplete.");
  const cryptoImpl = options.crypto ?? globalThis.crypto;
  if (!cryptoImpl?.subtle)
    throw new Error("This browser does not expose Web Crypto.");

  const payload: CandidateResultPayload = {
    activity: normalized.activity,
    mode: normalized.mode || null,
    metric: normalized.metric || null,
    score: normalized.score ?? null,
    n: normalized.n ?? null,
    correct: normalized.correct ?? null,
    answered: normalized.answered ?? null,
    unparsed: normalized.unparsed ?? null,
    completed: normalized.completed === true,
    instrument_digest: normalized.instrumentDigest,
  };
  const uri = receiptUri(normalized);
  const unsigned: UnsignedCandidateReceipt = {
    schema: "csoai.evidence-observation/0.1",
    subject: {
      kind: "tool",
      id: uri,
      digest: normalized.instrumentDigest,
    },
    source: {
      kind: "user",
      uri,
      observed_at: options.now || new Date().toISOString(),
    },
    instrument: {
      id: normalized.instrumentId,
      version: normalized.instrumentVersion,
      digest: normalized.instrumentDigest,
    },
    executor: {
      provider: "end-user-browser",
      runtime: "councilof.ai/gspc-quests local-js",
      region: "",
    },
    result: {
      claim_type: "human-practice-run-summary",
      status: "CANDIDATE_FINDING",
      payload_digest: await digestHex(cryptoImpl, payload),
      payload,
    },
    limitations: limitationsFor(normalized),
    legal_review_required: LEGAL_REVIEW_AXES.has(
      (normalized.axis || "").toLowerCase(),
    ),
    consent: {
      scope: "create-and-store-this-receipt-in-this-browser",
      network_submission: false,
      model_training: false,
    },
    admission: ADMISSION,
  };

  const keyPair = (await cryptoImpl.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const publicKey = await cryptoImpl.subtle.exportKey("jwk", keyPair.publicKey);
  const [signature, digest, publicKeyDigest] = await Promise.all([
    cryptoImpl.subtle.sign(
      "Ed25519",
      keyPair.privateKey,
      bytesOf(unsigned) as unknown as BufferSource,
    ),
    digestHex(cryptoImpl, unsigned),
    digestHex(cryptoImpl, publicKey),
  ]);
  const receipt: SignedCandidateReceipt = {
    ...unsigned,
    proof: {
      alg: "Ed25519",
      kid: `urn:sha256:${publicKeyDigest}#ephemeral-browser-key`,
      public_key_jwk: publicKey,
      sha256: digest,
      sig: hex(signature),
      signed_bytes: "canonical-json(all fields except proof)",
      attests:
        "This ephemeral browser key signed the complete candidate envelope; it does not attest that the result is true.",
    },
  };
  const size = candidateReceiptBytes(receipt);
  if (size > MAX_CANDIDATE_BYTES) {
    throw new Error(
      `Candidate receipt is ${size} bytes; the public card cap is ${MAX_CANDIDATE_BYTES}.`,
    );
  }
  return receipt;
}

export async function verifyCandidateReceipt(
  receipt: SignedCandidateReceipt,
  cryptoImpl: Crypto = globalThis.crypto,
): Promise<boolean> {
  try {
    if (
      receipt.schema !== "csoai.evidence-observation/0.1" ||
      receipt.result.status !== "CANDIDATE_FINDING" ||
      receipt.result.claim_type !== "human-practice-run-summary" ||
      receipt.admission.next !== "REPRODUCED" ||
      receipt.consent.network_submission !== false ||
      receipt.consent.model_training !== false ||
      !HEX64.test(receipt.instrument.digest) ||
      receipt.subject.digest !== receipt.instrument.digest
    )
      return false;
    const payloadDigest = await digestHex(cryptoImpl, receipt.result.payload);
    if (payloadDigest !== receipt.result.payload_digest) return false;
    if (receipt.result.payload.instrument_digest !== receipt.instrument.digest)
      return false;

    const { proof, ...unsigned } = receipt;
    const [digest, publicKeyDigest] = await Promise.all([
      digestHex(cryptoImpl, unsigned),
      digestHex(cryptoImpl, proof.public_key_jwk),
    ]);
    if (digest !== proof.sha256) return false;
    if (proof.kid !== `urn:sha256:${publicKeyDigest}#ephemeral-browser-key`)
      return false;
    const key = await cryptoImpl.subtle.importKey(
      "jwk",
      proof.public_key_jwk,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return cryptoImpl.subtle.verify(
      "Ed25519",
      key,
      fromHex(proof.sig) as unknown as BufferSource,
      bytesOf(unsigned) as unknown as BufferSource,
    );
  } catch {
    return false;
  }
}

/**
 * Submit only after a second, explicit user choice. A successful intake stores
 * the candidate for review; it still does not measure, publish, witness or use
 * the receipt for model training.
 */
export async function submitCandidateForMeasurement(
  receipt: SignedCandidateReceipt,
  fetchImpl: typeof fetch = fetch,
): Promise<MeasurementIntakeReceipt> {
  if (!(await verifyCandidateReceipt(receipt)))
    throw new Error("The local candidate signature no longer verifies.");
  const response = await fetchImpl("/api/evidence-intake", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      schema: "csoai.evidence-intake-request/0.1",
      candidate: receipt,
      consent: {
        network_submission: true,
        purpose: "independent-measurement-intake",
        model_training: false,
        public_release: false,
      },
    }),
  });
  const body: unknown = await response.json().catch(() => null);
  const bodyRecord =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  if (
    bodyRecord?.schema === "csoai.measurement-intake-receipt/0.1" &&
    (bodyRecord.state === "AWAITING_OPERATOR_REVIEW" ||
      bodyRecord.state === "VERIFIED_NOT_STORED") &&
    bodyRecord.candidate_signature_verified === true &&
    bodyRecord.measurement_state === "UNMEASURED" &&
    bodyRecord.model_training === false &&
    bodyRecord.public_release === false
  ) {
    return bodyRecord as unknown as MeasurementIntakeReceipt;
  }
  const error =
    bodyRecord && typeof bodyRecord.error === "string"
      ? bodyRecord.error
      : `/api/evidence-intake answered HTTP ${response.status}`;
  throw new Error(error);
}

export function storeCandidateReceipt(receipt: SignedCandidateReceipt): void {
  const current = (() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(CANDIDATE_RECEIPTS_KEY) || "[]",
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  localStorage.setItem(
    CANDIDATE_RECEIPTS_KEY,
    JSON.stringify([receipt, ...current].slice(0, 20)),
  );
}

export function removeCandidateReceipt(sha256: string): void {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(CANDIDATE_RECEIPTS_KEY) || "[]",
    );
    const receipts = Array.isArray(parsed) ? parsed : [];
    localStorage.setItem(
      CANDIDATE_RECEIPTS_KEY,
      JSON.stringify(
        receipts.filter(
          (item) =>
            !item ||
            typeof item !== "object" ||
            (item as { proof?: { sha256?: unknown } }).proof?.sha256 !== sha256,
        ),
      ),
    );
  } catch {
    localStorage.removeItem(CANDIDATE_RECEIPTS_KEY);
  }
}
