/**
 * _x402_jws — the ONE JWS (RFC 7515 compact, EdDSA/Ed25519) primitive behind x402 signed offers
 * and receipts (specs/extensions/extension-offer-and-receipt.md, x402-foundation/x402
 * @ 69652a69798f0b08f95bef33318896e36e210f7e).
 *
 * WHY JWS AND NOT EIP-712. The extension admits two formats: `eip712` (secp256k1 ECDSA, signer
 * recovered as an EVM address) and `jws` (any JOSE alg, signer named by a `kid` DID URL). The
 * edge holds exactly one signing secret — BOARD_SIGN_KEY_PKCS8_B64, an Ed25519 key published as
 * did:web:csoai.org#board-attestation-1 — and no secp256k1 key at all (payTo is a MetaMask the
 * edge never touches). So `jws` + `EdDSA` is the only format we can sign without inventing a key,
 * and it is spec-conformant as written: §3.3 names `EdDSA` as an example alg, §4.5.1 lists a
 * did:web document at /.well-known/did.json as an authorization mechanism.
 *
 * Canonicalisation: §10 requires JCS (RFC 8785) for JWS payloads. Offer/receipt payloads are flat
 * objects of strings and non-negative integers with ASCII keys, for which JCS is exactly
 * "sorted keys, compact separators, JSON.stringify number rendering" — `jcs()` below.
 *
 * Pure module: WebCrypto only. No key material is imported here; the caller passes the PKCS8
 * and it never leaves the runtime. Verification takes a raw 32-byte public key (the `x` of the
 * OKP JWK in did.json), so a stranger with did.json alone can run it.
 */

export const JWS_ALG = "EdDSA";

export function b64url(bytes: Uint8Array | string): string {
  const u8 = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** RFC 8785 JCS for the value space these payloads use (objects, arrays, strings, integers, booleans, null). */
export function jcs(v: unknown): string {
  const rec = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      // JCS orders property names by UTF-16 code units — JavaScript's default string sort.
      for (const k of Object.keys(o).sort()) if (o[k] !== undefined) out[k] = rec(o[k]);
      return out;
    }
    if (typeof x === "number" && !Number.isFinite(x)) throw new Error("non-finite number cannot be canonicalised");
    return x;
  };
  return JSON.stringify(rec(v));
}

export type JwsHeader = { alg: string; kid: string; [k: string]: unknown };

export type ParsedJws = {
  header: JwsHeader;
  payload: Record<string, unknown>;
  signingInput: string; // ASCII `b64url(header).b64url(payload)`
  signature: Uint8Array;
  raw: string;
};

/** Split and decode a compact JWS. Throws with a reason a verifier can echo. */
export function parseJws(compact: string): ParsedJws {
  if (typeof compact !== "string") throw new Error("jws is not a string");
  const parts = compact.split(".");
  if (parts.length !== 3) throw new Error("jws is not three dot-separated parts");
  const [h, p, s] = parts as [string, string, string];
  if (!/^[A-Za-z0-9_-]+$/.test(h) || !/^[A-Za-z0-9_-]+$/.test(p) || !/^[A-Za-z0-9_-]+$/.test(s)) {
    throw new Error("jws parts are not base64url");
  }
  let header: JwsHeader;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlDecode(h))) as JwsHeader;
  } catch {
    throw new Error("jws header is not JSON");
  }
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as Record<string, unknown>;
  } catch {
    throw new Error("jws payload is not JSON");
  }
  if (!header || typeof header !== "object" || typeof header.alg !== "string" || typeof header.kid !== "string") {
    throw new Error("jws header must carry alg and kid (extension §3.3)");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("jws payload is not an object");
  return { header, payload, signingInput: `${h}.${p}`, signature: b64urlDecode(s), raw: compact };
}

async function importPkcs8(pkcs8b64: string): Promise<CryptoKey> {
  const der = Uint8Array.from(atob(pkcs8b64.trim()), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, false, ["sign"]);
}

/**
 * signJws — EdDSA compact JWS over the JCS payload with header {alg:"EdDSA", kid}.
 * The payload octets are the JCS bytes, so a verifier that base64url-decodes the payload part
 * gets canonical JSON and can re-derive the signing input byte-for-byte.
 */
export async function signJws(payload: Record<string, unknown>, pkcs8b64: string, kid: string): Promise<string> {
  const header = b64url(jcs({ alg: JWS_ALG, kid }));
  const body = b64url(jcs(payload));
  const input = `${header}.${body}`;
  const key = await importPkcs8(pkcs8b64);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(input) as BufferSource));
  return `${input}.${b64url(sig)}`;
}

/** verifyJwsSignature — Ed25519 over the signing input, against a raw 32-byte public key. */
export async function verifyJwsSignature(parsed: ParsedJws, publicKey: Uint8Array): Promise<boolean> {
  if (parsed.header.alg !== JWS_ALG) return false;
  if (publicKey.length !== 32 || parsed.signature.length !== 64) return false;
  try {
    const key = await crypto.subtle.importKey("raw", publicKey as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      parsed.signature as BufferSource,
      new TextEncoder().encode(parsed.signingInput) as BufferSource,
    );
  } catch {
    return false;
  }
}

export const hexToBytes = (hex: string): Uint8Array => Uint8Array.from((hex.match(/../g) || []).map((h) => parseInt(h, 16)));

/** Pull the raw Ed25519 public key out of a did.json verificationMethod entry (OKP JWK `x`). */
export function publicKeyFromVerificationMethod(vm: unknown): Uint8Array | null {
  const jwk = (vm as { publicKeyJwk?: { kty?: string; crv?: string; x?: string } } | null)?.publicKeyJwk;
  if (!jwk || jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || typeof jwk.x !== "string") return null;
  try {
    const raw = b64urlDecode(jwk.x);
    return raw.length === 32 ? raw : null;
  } catch {
    return null;
  }
}
