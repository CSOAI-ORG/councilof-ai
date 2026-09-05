/**
 * POST /api/report — governed incident intake.
 *
 * The submitted incident may contain sensitive text. When LEADS is bound, the
 * complete record is stored there. The response never reflects that text: it is
 * a compact acknowledgement carrying only the record digest and honest process
 * state. REPORTED means "received by this endpoint" — not verified, measured,
 * signed onto the GSPC board, witnessed, anchored, or admitted for training.
 */
interface Env {
  LEADS?: KVNamespace;
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

const KINDS = new Set([
  "Bias / discrimination",
  "Safety / physical harm",
  "Privacy / data",
  "Deception / manipulation",
  "Security / misuse",
  "Transparency (no AI disclosure)",
  "Other",
]);
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);

export const MAX_REPORT_RECEIPT_BYTES = 3072;

export function canonicalReportJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalReportJson(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalReportJson(record[key])}`)
    .join(",")}}`;
}

const utf8 = (value: string) => new TextEncoder().encode(value);
const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

async function sha256(value: string): Promise<string> {
  return hex(
    await crypto.subtle.digest(
      "SHA-256",
      utf8(value) as unknown as BufferSource,
    ),
  );
}

type ReportReceipt = {
  schema: "csoai.incident-intake-receipt/0.1";
  kind: "incident-intake-receipt";
  status: "REPORTED";
  report_id: string;
  received_at: string;
  record_digest: string;
  stored: boolean;
  stored_reason?: string;
  fallback?: string;
  writes_board: false;
  model_training: false;
  external_witness_upload: false;
  measurement_state: "UNMEASURED";
  anchoring: { state: "NOT_REQUESTED"; automatic: false };
  triage: { state: "NOT_STARTED"; separate: true };
  independent_measurement: { state: "UNMEASURED"; separate: true };
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

async function signReceipt(
  receipt: ReportReceipt,
  pkcs8Base64?: string,
): Promise<ReceiptProof> {
  const signedJson = canonicalReportJson(receipt);
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
        "Unsigned digest of this intake receipt only; it does not attest that the reported incident is true.",
    };
  }

  // A configured but malformed key is an operations failure, not permission to
  // silently downgrade a receipt to UNSIGNED.
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
  if (!privateJwk.x) throw new Error("signing key has no public component");
  const publicKeyJwk: JsonWebKey = {
    kty: "OKP",
    crv: "Ed25519",
    x: privateJwk.x,
    ext: true,
    key_ops: ["verify"],
  };
  const publicKeyDigest = await sha256(canonicalReportJson(publicKeyJwk));
  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    utf8(signedJson) as unknown as BufferSource,
  );
  return {
    alg: "Ed25519",
    kid: `urn:sha256:${publicKeyDigest}#incident-intake`,
    public_key_jwk: publicKeyJwk,
    sha256: digest,
    sig: hex(signature),
    signed_bytes: "canonical-json(all fields except proof)",
    attests:
      "The Council intake key acknowledged this receipt metadata and record digest; it does not attest that the reported incident is true.",
  };
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const description = String(body.description ?? "")
    .trim()
    .slice(0, 8000);
  if (!description) {
    return Response.json(
      {
        error: "description is required",
        detail: "An incident report with no description is not a report.",
      },
      { status: 400 },
    );
  }

  const record = {
    kind: "incident",
    report_id: `WD-${crypto.randomUUID()}`,
    received_at: new Date().toISOString(),
    incident_type: KINDS.has(String(body.incident_type))
      ? String(body.incident_type)
      : "Other",
    severity: SEVERITIES.has(String(body.severity))
      ? String(body.severity)
      : "Medium",
    system: String(body.system ?? "").slice(0, 500),
    location: String(body.location ?? "").slice(0, 300),
    description,
    meaning:
      "Submitted incident account. Not a finding, measurement, determination, or GSPC board entry.",
  };
  const recordDigest = await sha256(canonicalReportJson(record));

  let stored = false;
  let storedReason = "no datastore bound on this deployment";
  if (ctx.env.LEADS) {
    try {
      await ctx.env.LEADS.put(
        `incident:${record.received_at}:${record.report_id}`,
        JSON.stringify({ ...record, record_digest: `sha256:${recordDigest}` }),
      );
      stored = true;
      storedReason = "";
    } catch {
      // Do not echo infrastructure errors or pretend the write landed.
      storedReason = "datastore write failed on this deployment";
    }
  }

  const receipt: ReportReceipt = {
    schema: "csoai.incident-intake-receipt/0.1",
    kind: "incident-intake-receipt",
    status: "REPORTED",
    report_id: record.report_id,
    received_at: record.received_at,
    record_digest: `sha256:${recordDigest}`,
    stored,
    ...(stored
      ? {}
      : {
          stored_reason: storedReason,
          fallback:
            "Keep this acknowledgement and email your report to nicholas@csoai.org; the report text is not contained in this receipt.",
        }),
    writes_board: false,
    model_training: false,
    external_witness_upload: false,
    measurement_state: "UNMEASURED",
    anchoring: { state: "NOT_REQUESTED", automatic: false },
    triage: { state: "NOT_STARTED", separate: true },
    independent_measurement: { state: "UNMEASURED", separate: true },
    meaning:
      "Intake acknowledgement only. Triage and independent measurement are separate, non-automatic processes.",
  };
  const proof = await signReceipt(
    receipt,
    ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64,
  );
  const envelope = { ...receipt, proof };
  const bytes = utf8(JSON.stringify(envelope)).byteLength;
  if (bytes > MAX_REPORT_RECEIPT_BYTES) {
    throw new Error(
      `incident intake receipt is ${bytes} bytes; cap is ${MAX_REPORT_RECEIPT_BYTES}`,
    );
  }

  return Response.json(envelope, {
    headers: { "cache-control": "no-store" },
  });
};
