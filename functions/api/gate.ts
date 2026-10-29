// functions/api/gate.ts — POST /api/gate: the CSOAI Layer-0 Sovereign Gate decision.
//
// The path the @csoai/layer0 client calls before it runs anything. It answers ONE question:
// what does the estate's policy say about the action that was asked about?
//
// It is a policy DECISION, not a certification and not a measurement. It says nothing about
// whether the caller is good, whether its model is safe, or whether anything actually happened.
// The decision is about an action on request; execution is somebody else's job.
//
// The rule set is the canonical one (functions/_lib/layer0.ts), and a parity test checks it
// against the estate's own product so the two cannot drift apart quietly.
//
// @openapi-get-method-not-allowed
// No signature here: the gate's answer is a decision about a request, not an attestation. The
// signed artefact is the A2A envelope, and that is /api/a2a/route.

import { decideGate, kid, type L0Env } from "../_lib/layer0";

interface Env extends L0Env {}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "the request body is not JSON" }, { status: 400 });
  }
  const decision = decideGate(
    {
      action: body.action as string | undefined,
      identity: body.identity as string | undefined,
      g_score: body.g_score as number | string | null | undefined,
      domain: body.domain as string | undefined,
    },
    env,
  );
  return Response.json(
    {
      ...decision,
      nonce: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
      ts: new Date().toISOString(),
      kid: kid(env),
      layer0_tier: "L0-3 Attested / L0-5 A2A",
      doctrine: "policy decision about an action on request — not a certification, not a ranking, and not a statement that anything was executed",
    },
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
};

/** A GET on a POST path is a method error, not a 404. */
export const onRequestGet: PagesFunction<Env> = async () =>
  Response.json({ error: "use POST: { action, identity, inputsHash }" }, { status: 405, headers: { allow: "POST" } });
