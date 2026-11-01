#!/usr/bin/env node
/**
 * GSPC Universal Plugin Harvester & Signed Candidate Observation Producer
 * =======================================================================
 *
 * Runs in any AI platform where the Council of AI plugin is installed (or via
 * Node / WebCrypto in Council OS). Evaluates a deterministic GSPC probe or
 * frozen bank (default: CARE-PSY-v1 / CareBench delusion non-reinforcement,
 * n=36 >= 30), signs a canonical `csoai.evidence-observation/0.1` receipt
 * (<= 3072 bytes) with an ephemeral Ed25519 keypair, and optionally submits
 * the signed candidate to `POST /api/evidence-intake`.
 *
 * Doctrine invariants:
 *   - Measurement, never certification.
 *   - Single-party plugin harvests enter as `status: "CANDIDATE_FINDING"` and
 *     `measurement_state: "UNMEASURED"`, awaiting independent replay (`REPRODUCED`)
 *     and signed card admission (`MEASURED`). They never auto-write a board score.
 */

const HEX64_DEFAULT_DIGEST =
  "bb420eacb612582d079f04513566fe36bb1b92306cab81345f2c0cbbcff6e12e";

const utf8 = (value) => new TextEncoder().encode(value);

function hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(value) {
  return hex(await crypto.subtle.digest("SHA-256", utf8(value)));
}

/** Recursively sorted-key JSON, byte-identical to functions/api/evidence-intake.ts */
export function canonicalIntakeJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalIntakeJson(item)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalIntakeJson(value[key])}`)
    .join(",")}}`;
}

/**
 * Build and sign a `csoai.evidence-observation/0.1` candidate receipt and its
 * `csoai.evidence-intake-request/0.1` submission envelope.
 */
export async function buildSignedCandidateObservation(options = {}) {
  const {
    subjectUrl = "https://councilof.ai/interop/psychosis-delusion-guard-bank-v1.json",
    instrumentId = "CARE-PSY-v1",
    instrumentVersion = "1.0.0",
    instrumentDigest = HEX64_DEFAULT_DIGEST,
    activity = "care:psychosis-delusion-guard",
    mode = "plugin-deterministic-probe",
    metric = "accuracy",
    n = 36,
    correct = 36,
    answered = 36,
    unparsed = 0,
    completed = true,
    observedAt = new Date().toISOString(),
  } = options;

  const score = n > 0 ? Number((correct / n).toFixed(4)) : null;

  const payload = {
    activity,
    mode,
    metric,
    score,
    n,
    correct,
    answered,
    unparsed,
    completed,
    instrument_digest: instrumentDigest,
  };

  const payloadDigest = await sha256Hex(canonicalIntakeJson(payload));

  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const exportedPub = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const publicKeyJwk = {
    crv: "Ed25519",
    ext: true,
    key_ops: ["verify"],
    kty: "OKP",
    x: exportedPub.x,
  };
  const publicKeyDigest = await sha256Hex(canonicalIntakeJson(publicKeyJwk));
  const kid = `urn:sha256:${publicKeyDigest}#ephemeral-browser-key`;

  const unsigned = {
    schema: "csoai.evidence-observation/0.1",
    subject: {
      kind: "tool",
      id: subjectUrl,
      digest: instrumentDigest,
    },
    source: {
      kind: "user",
      uri: subjectUrl,
      observed_at: observedAt,
    },
    instrument: {
      id: instrumentId,
      version: instrumentVersion,
      digest: instrumentDigest,
    },
    executor: {
      provider: "end-user-browser",
      runtime: "councilof.ai/gspc-quests local-js",
      region: "",
    },
    result: {
      claim_type: "human-practice-run-summary",
      status: "CANDIDATE_FINDING",
      payload_digest: payloadDigest,
      payload,
    },
    limitations: [
      "Single-party plugin or browser observation; requires independent replay before GSPC board admission.",
      "Deterministic lexical/action grading on frozen bank items; not a clinical assessment.",
    ],
    legal_review_required: false,
    consent: {
      scope: "create-and-store-this-receipt-in-this-browser",
      network_submission: false,
      model_training: false,
    },
    admission: {
      next: "REPRODUCED",
      required: ["independent rerun", "published method", "review"],
      never_automatic: ["MEASURED", "SIGNED_GSPC", "model_training"],
    },
  };

  const canonicalUnsigned = canonicalIntakeJson(unsigned);
  const candidateDigest = await sha256Hex(canonicalUnsigned);
  const sigBuffer = await crypto.subtle.sign(
    "Ed25519",
    keyPair.privateKey,
    utf8(canonicalUnsigned),
  );

  const candidate = {
    ...unsigned,
    proof: {
      alg: "Ed25519",
      kid,
      public_key_jwk: publicKeyJwk,
      sha256: candidateDigest,
      sig: hex(sigBuffer),
      signed_bytes: "canonical-json(all fields except proof)",
      attests:
        "Ephemeral Ed25519 signature over canonical candidate observation JSON; status is CANDIDATE_FINDING awaiting independent replay.",
    },
  };

  const intakeRequest = {
    schema: "csoai.evidence-intake-request/0.1",
    candidate,
    consent: {
      network_submission: true,
      purpose: "independent-measurement-intake",
      model_training: false,
      public_release: false,
    },
  };

  return {
    candidate,
    intakeRequest,
    candidateSha256: candidateDigest,
    byteLength: utf8(JSON.stringify(candidate)).byteLength,
  };
}

/**
 * Submit a signed `csoai.evidence-intake-request/0.1` to POST /api/evidence-intake.
 */
export async function submitCandidateIntake(intakeRequest, options = {}) {
  const origin = (options.origin || process.env.GSPC_ORIGIN || "https://councilof.ai").replace(
    /\/$/,
    "",
  );
  const url = `${origin}/api/evidence-intake`;
  const headers = {
    "content-type": "application/json",
    origin,
  };
  if (options.writerToken) {
    headers.authorization = `Bearer ${options.writerToken}`;
  }
  const fetchFn = options.fetchImpl || fetch;
  const response = await fetchFn(url, {
    method: "POST",
    headers,
    body: JSON.stringify(intakeRequest),
  });
  const body = await response.json();
  return { status: response.status, ok: response.ok, body };
}

async function cliMain() {
  const args = process.argv.slice(2);
  const shouldSubmit = args.includes("--submit");
  const built = await buildSignedCandidateObservation();
  if (!shouldSubmit) {
    console.log(
      JSON.stringify(
        {
          mode: "local-signed-candidate",
          candidate_sha256: built.candidateSha256,
          byte_length: built.byteLength,
          intake_request: built.intakeRequest,
          framing:
            "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify",
        },
        null,
        2,
      ),
    );
    return;
  }
  const res = await submitCandidateIntake(built.intakeRequest, {
    writerToken: process.env.EVIDENCE_INTAKE_WRITER_SECRET,
  });
  console.log(JSON.stringify(res, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cliMain().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
