/**
 * cardSign — the ONE canonical-form + sign rule for card-v0 leaves on Pages.
 *
 * Mirrors scripts/publish_public_root.py and /api/board-sign exactly:
 *   canonical  = UTF-8 JSON, sorted keys, separators (',', ':'), ensure_ascii=false
 *   sha256     = SHA-256 over the canonical PAYLOAD only (3KB hard cap on that payload)
 *   sig        = Ed25519 over those same payload bytes, under did:web:csoai.org#board-attestation-1
 *
 * Pure module: WebCrypto only (browsers + Cloudflare Workers + Node 20+). No key material is
 * imported by this file — the caller passes the PKCS8 (a Pages secret) and it never leaves the
 * runtime. When no key is present the caller MUST publish `sig_ed25519: null` and list
 * "sig_ed25519" in `unmeasured[]`: an unsigned card is honest; a fabricated signature is not.
 */

export const BOARD_ATTESTATION_DID = "did:web:csoai.org#board-attestation-1";
export const PAYLOAD_CAP_BYTES = 3072;

/** Canonical bytes: sorted keys, compact separators, non-ASCII kept as-is (ensure_ascii=false). */
export function canonicalBytes(obj: unknown): Uint8Array {
  const rec = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(rec);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o).sort()) out[k] = rec(o[k]);
      return out;
    }
    return v;
  };
  return new TextEncoder().encode(JSON.stringify(rec(obj)));
}

const hex = (bytes: ArrayBuffer | Uint8Array): string =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

export type SignedLeaf = {
  sha256: string;
  sig_ed25519: string | null;
  did: string | null;
  bytes: number;
  /** Why the signature is absent, when it is. */
  unsigned_reason: string | null;
};

/**
 * signPayload — hash the canonical payload and, if a PKCS8 Ed25519 key is supplied, sign it.
 * Throws on a payload over the 3KB cap (a card that cannot be a leaf must not be issued).
 */
export async function signPayload(payload: Record<string, unknown>, pkcs8b64: string | undefined): Promise<SignedLeaf> {
  const bytes = canonicalBytes(payload);
  if (bytes.byteLength > PAYLOAD_CAP_BYTES) {
    throw new Error(`payload ${bytes.byteLength} bytes exceeds ${PAYLOAD_CAP_BYTES} cap`);
  }
  const sha256 = await sha256Hex(bytes);
  const key64 = (pkcs8b64 || "").trim();
  if (!key64) {
    return { sha256, sig_ed25519: null, did: null, bytes: bytes.byteLength, unsigned_reason: "BOARD_SIGN_KEY_PKCS8_B64 absent in Pages env" };
  }
  try {
    const der = Uint8Array.from(atob(key64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, false, ["sign"]);
    const sig = await crypto.subtle.sign({ name: "Ed25519" }, key, bytes as BufferSource);
    return { sha256, sig_ed25519: hex(sig), did: BOARD_ATTESTATION_DID, bytes: bytes.byteLength, unsigned_reason: null };
  } catch (e) {
    return { sha256, sig_ed25519: null, did: null, bytes: bytes.byteLength, unsigned_reason: `sign failed: ${(e as Error).name || e}` };
  }
}

/**
 * verifyLeaf — recompute sha256 over the canonical payload and check the Ed25519 signature
 * against a raw 32-byte public key (hex). Used by tests and by any stranger with the did.json.
 */
export async function verifyLeaf(
  payload: Record<string, unknown>,
  sha256: string,
  sigHex: string,
  pubHex: string,
): Promise<{ sha_ok: boolean; sig_ok: boolean }> {
  const bytes = canonicalBytes(payload);
  const sha_ok = (await sha256Hex(bytes)) === sha256;
  const pub = Uint8Array.from(pubHex.match(/../g)!.map((h) => parseInt(h, 16)));
  const sig = Uint8Array.from(sigHex.match(/../g)!.map((h) => parseInt(h, 16)));
  let sig_ok = false;
  try {
    const key = await crypto.subtle.importKey("raw", pub as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    sig_ok = await crypto.subtle.verify({ name: "Ed25519" }, key, sig as BufferSource, bytes as BufferSource);
  } catch {
    sig_ok = false;
  }
  return { sha_ok, sig_ok };
}

/**
 * cardV0 — assemble the outer envelope around a signed/unsigned payload. `unmeasured` always
 * carries "sig_ed25519" when the signature is absent and "root_inclusion" until the public-root
 * workflow (the ONE root writer) includes the leaf — a Pages Function never advances root.json.
 */
export function cardV0(opts: {
  surface: string;
  subject: string;
  as_of: string;
  source_urls: string[];
  payload: Record<string, unknown>;
  leaf: SignedLeaf;
  tags?: string[];
  unmeasured?: string[];
}): Record<string, unknown> {
  const unmeasured = new Set<string>(opts.unmeasured || []);
  unmeasured.add("root_inclusion");
  if (!opts.leaf.sig_ed25519) unmeasured.add("sig_ed25519");
  return {
    schema: "https://councilof.ai/schema/card-v0.json",
    surface: opts.surface,
    subject: opts.subject,
    as_of: opts.as_of,
    source_urls: opts.source_urls,
    payload: opts.payload,
    sha256: opts.leaf.sha256,
    sig_ed25519: opts.leaf.sig_ed25519,
    ...(opts.leaf.did ? { did: opts.leaf.did } : {}),
    unmeasured: [...unmeasured].sort(),
    ...(opts.tags && opts.tags.length ? { tags: opts.tags } : {}),
  };
}
