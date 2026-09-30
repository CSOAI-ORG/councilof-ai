// SPDX-License-Identifier: Apache-2.0
// csoai-verify: offline verifier for CSOAI board-signed records (csoai.signed-run/0.1). No dependencies, no network.
// Built into ONE ES module (dist/csoai-verify.mjs, also served at https://councilof.ai/lib/csoai-verify.mjs).
export { verifyCard, canon, sha256, sha512, ed25519Verify } from "../verifyCard.ts";
export type { VerifyResult, VerifyState, SignedRun } from "../verifyCard.ts";

/** Pinned keys {kid: base64url x} from a DID document you saved (e.g. https://csoai.org/.well-known/did.json).
 *  Only Ed25519 JsonWebKey entries are taken. Pass the saved document; do not fetch it at verification time. */
export function keysFromDid(did: { verificationMethod?: Array<{ id?: string; publicKeyJwk?: { kty?: string; crv?: string; x?: string } }> }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of did?.verificationMethod ?? []) {
    const j = m.publicKeyJwk;
    if (m.id && j && j.kty === "OKP" && j.crv === "Ed25519" && typeof j.x === "string") out[m.id] = j.x;
  }
  return out;
}
