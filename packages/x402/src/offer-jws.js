/**
 * offer-jws.js — verify the x402 offer-receipt extension JWS (Ed25519/EdDSA)
 * against the published DID document. Verify BEFORE signing, always.
 * Spec: x402-foundation/x402 extensions/extension-offer-and-receipt.md
 * We are one of the few implementers; this makes our buyer the strictest on the wire.
 */
import crypto from 'node:crypto';

const DEFAULT_DID = 'https://csoai.org/.well-known/did.json';

export async function fetchDidDoc(url = DEFAULT_DID, fetchImpl = fetch) {
  const r = await fetchImpl(url);
  if (!r.ok) throw new Error(`did doc fetch ${r.status}`);
  return r.json();
}

/** Verify a compact JWS; returns {ok, kid, payload, reason?}. */
export async function verifyOfferJws(jws, { didUrl, didDoc, fetchImpl } = {}) {
  try {
    if (typeof jws !== 'string' || jws.split('.').length !== 3) return { ok: false, reason: 'not a compact JWS' };
    const [h, p, s] = jws.split('.');
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
    if (!['EdDSA', 'Ed25519'].includes(header.alg)) return { ok: false, reason: `alg ${header.alg} not Ed25519` };
    const doc = didDoc || (await fetchDidDoc(didUrl, fetchImpl));
    const vm = (doc.verificationMethod || []).find(v => v.id === header.kid)
      || (doc.verificationMethod || []).find(v => v.id.endsWith('#board-attestation-1'));
    if (!vm?.publicKeyJwk) return { ok: false, reason: `kid ${header.kid} not in did doc` };
    const key = crypto.createPublicKey({ key: vm.publicKeyJwk, format: 'jwk' });
    const ok = crypto.verify(null, Buffer.from(`${h}.${p}`), key, Buffer.from(s, 'base64url'));
    const payload = ok ? JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) : undefined;
    return ok ? { ok, kid: header.kid, payload } : { ok: false, reason: 'Ed25519 verify failed' };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
