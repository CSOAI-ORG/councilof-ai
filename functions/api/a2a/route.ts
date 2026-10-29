// functions/api/a2a/route.ts — POST /api/a2a/route: build and sign an A2A attestation envelope.
//
// The path the @csoai/layer0 client calls after its action has run, to obtain a signed envelope
// describing what was asked, what was decided, and what was carried.
//
// @openapi-get-method-not-allowed
// THE POLICY IS THE SAME GATE
// The route asks the same gate /api/gate asks. A denied action is refused with 403 and no
// envelope is produced: an envelope exists to describe a permitted exchange, and issuing a signed
// envelope for a prohibited one would put the estate's own signature on it.
//
// THE KEY
// Signing uses the Ed25519 key in the Pages secret LAYER0_SIGN_KEY_PKCS8_B64. When that secret
// is absent this route refuses with 503 and names the reason. It does NOT generate a key: a
// self-signed envelope that nobody can verify looks like an attestation and is not one. The
// estate's rule is that an unsigned artefact is honest and a fabricated signature is not.
//
// A missing key is therefore a DEPLOYMENT state, not a bug, and the answer says so.

import { headFromGet } from "../../_head";
import { decideGate, anchor, kid, loadKey, makeEnvelope, type L0Env } from "../../_lib/layer0";

interface Env extends L0Env {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "the request body is not JSON" }, { status: 400 });
  }

  const from = body.from as { party?: string; endpoint?: string } | undefined;
  const to = body.to as { endpoint?: string; party?: string } | undefined;
  const decision = decideGate(
    {
      action: body.action as string | undefined,
      identity: (body.identity as string | undefined) || from?.party,
      g_score: body.g_score as number | string | null | undefined,
      domain: body.domain as string | undefined,
    },
    env,
  );

  if (decision.state === "deny") {
    return Response.json(
      { error: "denied", decision },
      { status: 403, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const loaded = await loadKey(env);
  if (!loaded.ok) {
    // Honest 503: the policy works, the signature cannot be produced yet, and the reason is named.
    return Response.json(
      {
        status: "unsigned",
        error: "this deployment cannot sign envelopes yet",
        reason: loaded.reason,
        decision,
        unsigned_reason: loaded.reason,
        note: "no envelope is issued rather than an unverifiable one; the gate decision above is still the policy answer",
      },
      { status: 503, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const envelope = await makeEnvelope({
    from,
    to,
    intent: (body.intent as string | undefined) || "attestation",
    action: body.action,
    payload: body.payload,
    decision,
    privateKey: loaded.keys!.privateKey,
    signKid: kid(env),
    episodeAnchor: anchor(env),
  });

  return Response.json(
    {
      status: decision.state === "escalate" ? "escalated" : "routed",
      envelope,
      decision,
      forwarded: null,
      public_key: loaded.keys!.publicKeyB64,
    },
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
};

export const onRequestGet: PagesFunction<Env> = async () =>
  Response.json({ error: "use POST: { from, to, intent, action, payload, identity }" }, { status: 405, headers: { allow: "POST" } });

/** Pages dispatches HEAD only to an onRequestHead export; the door exports a GET that answers 405. */
export const onRequestHead = headFromGet(onRequestGet);
