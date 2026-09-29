/**
 * Check the board stamp (GET /api/gspc → measured_on.living_stamp) in the reader's own browser.
 *
 * The stamp publishes its rule in sig_input: Ed25519 over the raw UTF-8 bytes of canonical JSON of
 * `preimage` — keys sorted by code point, no whitespace, non-ASCII literal, numbers by ECMAScript
 * Number::toString. JSON.stringify over recursively sorted keys is exactly that rule.
 *
 * The key is PINNED from the DID document, never taken from the stamp alone: a stamp checked
 * against the key it carries proves only that it is self-consistent. Three outcomes, never two:
 * VALID, INVALID (with the failed check), UNCHECKABLE (the check could not run, e.g. no Ed25519 in
 * this browser). The check runs only when the reader asks for it, so no result is ever baked into
 * a prerendered page.
 */
export type StampCheck =
  | { state: "VALID"; keyId: string }
  | { state: "INVALID"; reason: string }
  | { state: "UNCHECKABLE"; reason: string };

type Stamp = { preimage?: unknown; signature?: unknown; public_key_x?: unknown; signer?: unknown };
type DidDoc = { verificationMethod?: { id?: string; publicKeyJwk?: { x?: string } }[] };

export function canonicalJcs(v: unknown): string {
  if (v === null || typeof v !== "object") {
    if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite number");
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(canonicalJcs).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJcs(o[k])}`)
    .join(",")}}`;
}

const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const fromHex = (s: string) => Uint8Array.from((s.match(/../g) ?? []).map((b) => parseInt(b, 16)));

export async function verifyBoardStamp(stamp: Stamp, did: DidDoc, subtle: SubtleCrypto | null = globalThis.crypto?.subtle ?? null): Promise<StampCheck> {
  const keyId = typeof stamp.signer === "string" ? stamp.signer : "did:web:csoai.org#board-attestation-1";
  const frag = keyId.split("#")[1] ?? "";
  if (!stamp.preimage || typeof stamp.signature !== "string" || !/^[0-9a-f]{128}$/i.test(stamp.signature))
    return { state: "UNCHECKABLE", reason: "the stamp publishes no preimage or no 64-byte signature" };
  const vm = (did.verificationMethod ?? []).find((m) => typeof m.id === "string" && m.id.endsWith(`#${frag}`));
  const x = vm?.publicKeyJwk?.x;
  if (!x) return { state: "UNCHECKABLE", reason: `the DID document names no key for #${frag}` };
  if (typeof stamp.public_key_x === "string" && stamp.public_key_x !== x)
    return { state: "INVALID", reason: "the stamp names a key that is not the one in the DID document" };
  if (!subtle) return { state: "UNCHECKABLE", reason: "this browser exposes no WebCrypto" };
  let key: CryptoKey;
  try {
    key = await subtle.importKey("raw", fromB64u(x), { name: "Ed25519" }, false, ["verify"]);
  } catch {
    return { state: "UNCHECKABLE", reason: "this browser has no Ed25519 in WebCrypto" };
  }
  let msg: Uint8Array;
  try {
    msg = new TextEncoder().encode(canonicalJcs(stamp.preimage));
  } catch (e) {
    return { state: "UNCHECKABLE", reason: `cannot canonicalise the preimage: ${(e as Error).message}` };
  }
  const ok = await subtle.verify({ name: "Ed25519" }, key, fromHex(stamp.signature), msg);
  return ok ? { state: "VALID", keyId } : { state: "INVALID", reason: "the signature does not verify over the published preimage" };
}
