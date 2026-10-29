// functions/api/a2a/verify.ts — POST /api/a2a/verify: verify an inbound A2A envelope.
//
// The path the @csoai/layer0 client calls to check an envelope someone else produced.
//
// @openapi-get-method-not-allowed
// WHAT IT CHECKS
// The signature covers the canonical form of the envelope with its sig field removed. This
// function rebuilds that same canonical form and checks the Ed25519 signature against a public
// key the caller supplies (__peerKey, base64 of the DER SPKI) or against this deployment's own
// published key.
//
// It returns valid true or false. It never returns "probably", and it never returns true for an
// envelope it could not check: an envelope with no signature, a malformed key, or a body it
// could not parse is answered false, with the reason.
//
// This is a verification, not a validation of the envelope's contents. A valid signature says
// the holder of the key signed these bytes. It does not say the decision inside was correct, and
// it is not a certification of the envelope's subject.

import { l0CanonBytes, loadKey, verifyBytes, type L0Env } from "../../_lib/layer0";

interface Env extends L0Env {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let envelope: Record<string, unknown>;
  try {
    envelope = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ valid: false, error: "the request body is not JSON" }, { status: 400 });
  }

  const sig = envelope.sig as { value?: string } | undefined;
  if (!sig || !sig.value) {
    return Response.json({ valid: false, error: "no sig" }, { status: 400, headers: { "content-type": "application/json; charset=utf-8" } });
  }

  // The peer key the caller names wins; otherwise this deployment's own published key is used.
  let peerKeyB64 = (envelope.__peerKey as string | undefined) || "";
  if (!peerKeyB64) {
    const loaded = await loadKey(env);
    if (!loaded.ok) {
      return Response.json(
        { valid: false, error: "no peer key was supplied and this deployment has no published key to check against" },
        { status: 400, headers: { "content-type": "application/json; charset=utf-8" } },
      );
    }
    peerKeyB64 = loaded.keys!.publicKeyB64;
  }

  const unsigned = { ...envelope };
  delete unsigned.sig;
  delete unsigned.__peerKey;

  const valid = await verifyBytes(l0CanonBytes(unsigned), sig.value, peerKeyB64);
  return Response.json(
    {
      valid,
      kid: sig.value ? (envelope.sig as { kid?: string }).kid ?? null : null,
      alg: "Ed25519",
      checked: "the canonical form of the envelope with its sig field removed",
      ...(valid ? {} : { note: "the signature did not verify against the supplied key, or the envelope could not be read" }),
    },
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
};

export const onRequestGet: PagesFunction<Env> = async () =>
  Response.json({ error: "use POST with the envelope to verify" }, { status: 405, headers: { allow: "POST" } });
