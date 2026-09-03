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
