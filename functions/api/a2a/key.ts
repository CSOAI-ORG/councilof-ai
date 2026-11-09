// functions/api/a2a/key.ts — GET /api/a2a/key: the public half of this deployment's signing key.
//
// A verifier needs the public key to check an envelope, and it needs to know WHICH key: the kid
// names it. So this endpoint publishes the kid and the public key.
//
// The public key is DERIVED from the same secret the signer uses, so the two can never drift
// apart. When the secret is absent there is no key, and this endpoint says so with 404 and a
// reason — it does not publish a placeholder that would fail verification in a confusing way.
//
// The public key is public. It is published on purpose and it is safe to publish.

import { headFromGet } from "../_head";
import { kid, loadKey, type L0Env } from "../../_lib/layer0";

interface Env extends L0Env {}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const loaded = await loadKey(env);
  if (!loaded.ok) {
    return Response.json(
      {
        kid: kid(env),
        alg: "Ed25519",
        published: false,
        reason: loaded.reason ?? "the signing key is not configured",
        note: "this deployment has no signing key configured, so it publishes no public key",
      },
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }
  return Response.json(
    {
      kid: kid(env),
      alg: "Ed25519",
      published: true,
      publicKey: loaded.keys!.publicKeyB64,
      publicKeyPem: loaded.keys!.publicKeyPem,
      key_encoding: "publicKey is base64 of the DER SPKI; the same form a client passes as __peerKey",
    },
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
};

/** Pages dispatches HEAD only to an onRequestHead export; the door exports GET. */
export const onRequestHead = headFromGet(onRequestGet);
