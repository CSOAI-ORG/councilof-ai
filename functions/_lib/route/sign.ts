/**
 * GSPC Route: receipt signing under did:web:csoai.org#route-attestation-1.
 *
 * KEY SCOPE. The route-receipt key signs route records (profile csoai.route-evidence/0.1) and nothing
 * else. It is not the board key: route volume never touches #board-attestation-1. Custody is the same as
 * the board key: an Ed25519 PKCS#8 held only as the Cloudflare Pages secret ROUTE_SIGN_KEY_PKCS8_B64,
 * minted in memory on the builder pod on 2026-09-30 and piped straight to the secret store. The public half
 * is ROUTE_KEY_X below and is published additively in https://csoai.org/.well-known/did.json.
 *
 * WHAT IS SIGNED. The UTF-8 bytes of the record's event_id ("sha256:<64 hex>"), which is sha256 of the RFC
 * 8785 JCS of the record minus event_id, signature and anchors (evidence.ts computeEventId, event.py
 * compute_event_id). A verifier recomputes event_id from the record, then checks the Ed25519 signature
 * over that string: verifyReceipt() below (execute.test.ts group F). No Python or npm verifier for route
 * receipts exists yet.
 *
 * FAIL CLOSED. No secret, a secret that is not Ed25519, or a secret whose public half is not ROUTE_KEY_X
 * => no signature, and execute.ts refuses to execute (SIGNER_UNAVAILABLE, 503).
 */
import { computeEventId } from "./evidence";

export const ROUTE_KID = "did:web:csoai.org#route-attestation-1";
/** base64url of the raw 32-byte Ed25519 public key (hex 4a896b1f a6ce0e2b ccd92e41 ccca a788 ...). */
export const ROUTE_KEY_X = "SolrH6bODivM2S5BzMqniM3IL9yopfRO8IbXdMKWJcM";
export const ROUTE_KEY_JWK = { kty: "OKP", crv: "Ed25519", x: ROUTE_KEY_X } as const;

export type RouteSignature = { alg: "Ed25519"; kid: string; signed: "event_id"; sig: string };

export function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export type Signer = { kid: string; sign: (msg: Uint8Array) => Promise<Uint8Array> };

/** The route signer from the Pages secret, or the reason there is none. Never logs, never returns key bytes. */
export async function routeSigner(pkcs8b64: string | undefined): Promise<Signer | { unavailable: string }> {
  const b64 = (pkcs8b64 || "").trim();
  if (!b64) return { unavailable: "ROUTE_SIGN_KEY_PKCS8_B64 is absent in this Pages environment" };
  try {
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, true, ["sign"]);
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    if (jwk.x !== ROUTE_KEY_X) return { unavailable: "the configured route key is not the one did.json publishes as #route-attestation-1" };
    return {
      kid: ROUTE_KID,
      sign: async (msg) => new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, msg as BufferSource)),
    };
  } catch {
    return { unavailable: "the configured route key could not be imported as Ed25519 PKCS#8" };
  }
}

/** Sets event_id and signature on the record (in place) and returns it. */
export async function signRecord(rec: Record<string, unknown>, signer: Signer): Promise<Record<string, unknown>> {
  delete rec.signature;
  rec.event_id = await computeEventId(rec);
  const sig = await signer.sign(new TextEncoder().encode(String(rec.event_id)));
  rec.signature = { alg: "Ed25519", kid: signer.kid, signed: "event_id", sig: b64url(sig) } satisfies RouteSignature;
  return rec;
}

export type ReceiptVerdict = { result: "VALID" | "INVALID" | "UNVERIFIABLE_KEY"; reason: string };

/**
 * Verify one route receipt against a DID document (or the pinned key when none is given). A VALID result
 * says who signed these bytes and that they are unchanged; it says nothing about the target's answer.
 */
export async function verifyReceipt(rec: Record<string, unknown>, didDoc?: unknown): Promise<ReceiptVerdict> {
  const sg = rec?.signature as Partial<RouteSignature> | null | undefined;
  if (!sg || sg.alg !== "Ed25519" || sg.signed !== "event_id" || typeof sg.sig !== "string")
    return { result: "INVALID", reason: "no Ed25519 event_id signature on the record" };
  if (rec.profile !== "csoai.route-evidence/0.1")
    return { result: "INVALID", reason: "the route key signs csoai.route-evidence/0.1 records only" };
  if (sg.kid !== ROUTE_KID) return { result: "UNVERIFIABLE_KEY", reason: `kid ${String(sg.kid)} is not ${ROUTE_KID}` };
  let x: string | null = ROUTE_KEY_X;
  if (didDoc !== undefined) {
    x = null;
    for (const m of ((didDoc as { verificationMethod?: unknown[] })?.verificationMethod ?? []) as Record<string, any>[])
      if (typeof m?.id === "string" && m.id.endsWith("#route-attestation-1") && m.publicKeyJwk?.crv === "Ed25519") x = m.publicKeyJwk.x;
    if (!x) return { result: "UNVERIFIABLE_KEY", reason: "#route-attestation-1 is not in the DID document" };
  }
  const id = await computeEventId(rec);
  if (id !== rec.event_id) return { result: "INVALID", reason: "event_id does not recompute from the record" };
  try {
    const key = await crypto.subtle.importKey("raw", fromB64url(x) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, fromB64url(sg.sig) as BufferSource, new TextEncoder().encode(id) as BufferSource);
    return ok ? { result: "VALID", reason: `signed by ${ROUTE_KID}` } : { result: "INVALID", reason: "Ed25519 signature does not verify" };
  } catch {
    return { result: "INVALID", reason: "signature or key bytes malformed" };
  }
}
