/**
 * in-toto Statement v1 + DSSE for councilof-ai Functions (Move 2, TS port).
 *
 * Lets /api/detect (and any Function) emit its verdict/receipt as the standard
 * envelope auditors/GRC tools read, instead of a bespoke shape. Byte-compatible
 * with the .github reference (harness/receipts.py): same canonical rule, same DSSE
 * PAE, same payloadType — so a receipt signed here verifies with any DSSE verifier
 * (proven against the Python independent verifier).
 *
 * WebCrypto Ed25519 (Cloudflare Workers). Canonical = recursively sorted keys, no
 * whitespace (byte-identical to RFC 8785 for ASCII/number payloads).
 */

export const IN_TOTO_STATEMENT_TYPE = "https://in-toto.io/Statement/v1";
export const DSSE_PAYLOAD_TYPE = "application/vnd.in-toto+json";
export const MEASUREMENT_PREDICATE = "https://councilof.ai/attestations/measurement/v1";
export const DETECTION_PREDICATE = "https://councilof.ai/attestations/detection/v1";

export function canon(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 over canonical bytes of payload minus `drop` — the same bytes the site signs. */
export async function subjectDigest(payload: Record<string, unknown>, drop = "site_attestation"): Promise<string> {
  const body: Record<string, unknown> = {};
  for (const k of Object.keys(payload)) if (k !== drop) body[k] = payload[k];
  return sha256Hex(new TextEncoder().encode(canon(body)));
}

export async function toInTotoStatement(
  payload: Record<string, unknown>,
  opts: { subjectName: string; predicateType?: string; predicate?: Record<string, unknown> },
): Promise<Record<string, unknown>> {
  return {
    _type: IN_TOTO_STATEMENT_TYPE,
    subject: [{ name: opts.subjectName, digest: { sha256: await subjectDigest(payload) } }],
    predicateType: opts.predicateType ?? MEASUREMENT_PREDICATE,
    predicate: opts.predicate ?? payload,
  };
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function pae(payloadType: string, payload: Uint8Array): Uint8Array {
  const pt = new TextEncoder().encode(payloadType);
  const head = new TextEncoder().encode(`DSSEv1 ${pt.length} ${payloadType} ${payload.length} `);
  const out = new Uint8Array(head.length + payload.length);
  out.set(head, 0);
  out.set(payload, head.length);
  return out;
}

/** Sign an in-toto Statement into a DSSE envelope with a pkcs8 Ed25519 key. */
export async function toDsse(
  statement: Record<string, unknown>,
  pkcs8Der: Uint8Array,
  keyid: string,
): Promise<Record<string, unknown>> {
  const key = await crypto.subtle.importKey("pkcs8", pkcs8Der, { name: "Ed25519" }, false, ["sign"]);
  const payload = new TextEncoder().encode(canon(statement));
  const sig = new Uint8Array(await crypto.subtle.sign("Ed25519", key, pae(DSSE_PAYLOAD_TYPE, payload)));
  return { payloadType: DSSE_PAYLOAD_TYPE, payload: b64(payload), signatures: [{ keyid, sig: b64(sig) }] };
}

/**
 * measurementPredicate — the in-toto predicate for a GSPC measurement, carrying the inputs a
 * stranger needs to RECOMPUTE the number rather than trust our signature for it.
 *
 * WHY THIS EXISTS. A signed card fetched from the live site on 2026-09-04 had this complete body:
 *   accuracy 0.0968 · axis care-refusal-protect · model clan-csoai-plain:latest ·
 *   created · issuer · kind · prev · public_framing · verify
 * No inputs_sha256, no frozen-bank reference, no item digest, no grader, no n. 0.0968 cannot be
 * re-derived from it, so a reader's only route to believing the number is our Ed25519 key. That
 * is trust-as-a-service welded into the artefact, and it makes the signature answer "whether"
 * when a signature should only ever answer "when".
 *
 * in-toto is the right home for the fix — a predicate exists precisely to say how a subject was
 * produced — and toInTotoStatement already defaults `predicate` to the payload, which faithfully
 * wraps a card that still cannot be checked. This builds a predicate that names the inputs.
 *
 * IT DOES NOT INVENT THEM. Where an input is absent the predicate says so in `unreproducible[]`
 * and sets `reproducible:false`, because the estate's own rule is that UNMEASURED is first-class
 * and a gap is a finding rather than something to smooth over. A predicate that quietly omitted
 * a missing bank digest would be worse than the card it replaces: it would look like provenance.
 */
export type MeasurementInputs = {
  bank_sha256?: string;      // the frozen bank the probe ran against
  items_sha256?: string;     // digest over the exact item ids scored
  grader?: string;           // grader name and version, e.g. "gspc-arith@0.4.1"
  n?: number;                // sample size behind the figure
  rerun?: string;            // the command a stranger runs to reproduce it
};

export function measurementPredicate(
  figure: Record<string, unknown>,
  inputs: MeasurementInputs,
): Record<string, unknown> {
  const required: (keyof MeasurementInputs)[] = ["bank_sha256", "items_sha256", "grader", "n"];
  const missing = required.filter((k) => inputs[k] === undefined || inputs[k] === null || inputs[k] === "");
  return {
    figure,
    inputs: {
      bank_sha256: inputs.bank_sha256 ?? null,
      items_sha256: inputs.items_sha256 ?? null,
      grader: inputs.grader ?? null,
      n: inputs.n ?? null,
      rerun: inputs.rerun ?? null,
    },
    reproducible: missing.length === 0,
    unreproducible: missing,
    note:
      missing.length === 0
        ? "every input needed to recompute this figure is named above; the signature attests WHEN, the bank attests WHAT"
        : `cannot be recomputed from this attestation: ${missing.join(", ")} absent. The signature attests only that we published this figure at this time.`,
    never: ["a certificate", "a grade", "a rank", "a claim that the signature makes the figure true"],
  };
}
