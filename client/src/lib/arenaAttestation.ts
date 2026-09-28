import { canonicalJSON, sha256Hex } from "./verify";
import { PINNED_ANCHORS } from "../../../functions/_lib/cardVerify";

const BOARD_DID = "did:web:csoai.org#board-attestation-1";
const DID_URL = "https://csoai.org/.well-known/did.json";
const HEX_32 = /^[0-9a-f]{64}$/i;
const HEX_64 = /^[0-9a-f]{128}$/i;

export type ArenaVerification = {
  state: "VALID" | "INVALID" | "UNCHECKABLE";
  reason: string;
};

type RecordValue = Record<string, unknown>;
const asRecord = (value: unknown): RecordValue | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;

function hexBytes(hex: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(hex.match(/../g) || [], (pair) => parseInt(pair, 16));
}

function base64urlBytes(encoded: string): Uint8Array<ArrayBuffer> {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

/**
 * The arena signs an envelope containing the content ID of the displayed body.
 * The pod token authorises the signing request; the signature itself must check
 * against the public board-attestation DID key. This does not admit a GSPC cell.
 */
export async function verifyArenaEloSignature(eloValue: unknown, didValue: unknown): Promise<ArenaVerification> {
  const elo = asRecord(eloValue);
  const did = asRecord(didValue);
  if (!elo) return { state: "UNCHECKABLE", reason: "No arena reference was loaded." };
  const signature = asRecord(elo.signature);
  if (!signature) return { state: "UNCHECKABLE", reason: "The arena reference has no signature envelope." };
  if (signature.alg !== "Ed25519" || signature.did !== BOARD_DID) {
    return { state: "INVALID", reason: "The arena signature declares an unexpected algorithm or signer." };
  }
  const sigHex = signature.sig_ed25519;
  const payloadHash = signature.payload_sha256;
  const contentId = elo.content_id;
  if (typeof sigHex !== "string" || !HEX_64.test(sigHex) ||
      typeof payloadHash !== "string" || !HEX_32.test(payloadHash) ||
      typeof contentId !== "string" || !HEX_32.test(contentId)) {
    return { state: "INVALID", reason: "The arena signature or hashes are malformed." };
  }
  const envelope = asRecord(signature.envelope);
  if (!envelope || envelope.content_id !== contentId) {
    return { state: "INVALID", reason: "The signed envelope does not name this arena body." };
  }
  if (!globalThis.crypto?.subtle) {
    return { state: "UNCHECKABLE", reason: "This browser has no WebCrypto digest or Ed25519 verifier." };
  }
  const { signature: _signature, content_id: _contentId, ...body } = elo;
  if (await sha256Hex(canonicalJSON(body)) !== contentId.toLowerCase()) {
    return { state: "INVALID", reason: "The displayed arena body differs from its content ID." };
  }
  const envelopeBytes = new TextEncoder().encode(canonicalJSON(envelope));
  if (await sha256Hex(canonicalJSON(envelope)) !== payloadHash.toLowerCase()) {
    return { state: "INVALID", reason: "The signed envelope differs from its stated SHA-256." };
  }
  const pinned = PINNED_ANCHORS.find((anchor) => anchor.id === BOARD_DID);
  if (!pinned || !HEX_32.test(pinned.hex)) {
    return { state: "UNCHECKABLE", reason: "This verifier has no pinned board-attestation key." };
  }
  // A live DID read is a cross-check; the pinned key decides, including offline.
  if (did) {
    const method = Array.isArray(did.verificationMethod)
      ? did.verificationMethod.map(asRecord).find((entry) => entry?.id === BOARD_DID)
      : null;
    const jwk = asRecord(method?.publicKeyJwk);
    if (did.id !== "did:web:csoai.org" || jwk?.kty !== "OKP" || jwk?.crv !== "Ed25519" || typeof jwk?.x !== "string") {
      return { state: "UNCHECKABLE", reason: "The fetched DID document has no usable board-attestation key." };
    }
    let publishedKey: Uint8Array<ArrayBuffer>;
    try {
      publishedKey = base64urlBytes(jwk.x);
    } catch {
      return { state: "UNCHECKABLE", reason: "The fetched DID key could not be decoded." };
    }
    if (publishedKey.length !== 32) return { state: "UNCHECKABLE", reason: "The fetched DID key is not 32 bytes." };
    if (Array.from(publishedKey, (byte) => byte.toString(16).padStart(2, "0")).join("") !== pinned.hex) {
      return { state: "INVALID", reason: "The fetched DID key differs from this verifier's pinned board key." };
    }
  }
  try {
    const key = await crypto.subtle.importKey("raw", hexBytes(pinned.hex), { name: "Ed25519" }, false, ["verify"]);
    const verified = await crypto.subtle.verify("Ed25519", key, hexBytes(sigHex), envelopeBytes);
    return verified
      ? { state: "VALID", reason: `The pinned board DID key signed this envelope and its content ID matches the displayed arena body.${did ? " The published DID key also matches the pin." : " Live DID cross-check unavailable."}` }
      : { state: "INVALID", reason: "The arena envelope signature does not verify against the board DID key." };
  } catch (error) {
    if ((error as { name?: string }).name === "NotSupportedError") {
      return { state: "UNCHECKABLE", reason: "This browser does not support Ed25519 verification." };
    }
    return { state: "INVALID", reason: "The arena signature could not be verified." };
  }
}

export async function verifyPublishedArenaElo(elo: unknown): Promise<ArenaVerification> {
  let did: unknown;
  try {
    const response = await fetch(DID_URL, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    did = await response.json();
  } catch {
    did = null;
  }
  return verifyArenaEloSignature(elo, did);
}
