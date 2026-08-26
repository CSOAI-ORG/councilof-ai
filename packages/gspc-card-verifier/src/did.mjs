/**
 * did.mjs — take a raw Ed25519 public key out of a DID document.
 *
 * Deliberately takes a PARSED DOCUMENT, not a URL. Fetching happens once, out of band, under
 * your control; the key you pin is then a file you hold. If verification fetched the key each
 * time, whoever serves the document could change what your verifier believes — and evidence
 * that a publisher can retune after the fact is not evidence.
 */
export function pubkeyFromDidDocument(doc, keyId) {
  const methods = doc && doc.verificationMethod;
  if (!Array.isArray(methods)) throw new Error("DID document has no verificationMethod array");
  const m = methods.find(
    (v) => v && typeof v.id === "string" && (keyId ? v.id === keyId || v.id.endsWith(keyId) : true),
  );
  if (!m) throw new Error(`no verificationMethod matching ${keyId}`);
  const jwk = m.publicKeyJwk;
  if (!jwk || jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || typeof jwk.x !== "string")
    throw new Error("verificationMethod is not an Ed25519 OKP JWK");
  const b64 = jwk.x.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  if (bytes.length !== 32) throw new Error(`expected a 32-byte Ed25519 key, got ${bytes.length}`);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
