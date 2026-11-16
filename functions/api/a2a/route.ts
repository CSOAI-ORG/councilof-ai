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

import { headFromGet } from "../_head";
import { decideGate, anchor, kid, loadKey, makeEnvelope, type L0Env } from "../../_lib/layer0";

interface Env extends L0Env {}

// An envelope describes one exchange; it is not a document store. Without a cap this door signed
// whatever it was sent (a 300 KiB body was signed and echoed on 2026-11-16).
export const MAX_ROUTE_BODY_BYTES = 64 * 1024;
// Signed into every envelope, so the signature cannot be read as vouching for what the caller typed.
export const ENVELOPE_SCOPE =
  "The signer attests the gate decision in `policy` for the stated action, at `ts`. `from`, `to`, `action` and " +
  "`payload` are caller-supplied and were not verified. Not a certification.";

// A BURST LIMIT, PER CLIENT AND PER EDGE INSTANCE (2026-11-16). Every request here can cost an Ed25519
// signature under the deployment's key, and until this date nothing limited how fast one client could
// ask. This counts requests per CF-Connecting-IP inside one Workers isolate: it stops one client
// hammering one edge instance. It is NOT a global quota - isolates do not share the count, so a client
// spread over many edges is not limited by it; a global quota is a Cloudflare rate-limiting rule on
// this path. A request without CF-Connecting-IP did not come through the Cloudflare edge (tests, local
// dev) and is not counted.
export const ROUTE_BURST_LIMIT = 60;
export const ROUTE_BURST_WINDOW_MS = 60_000;
const ROUTE_BURST_MAX_CLIENTS = 2_000;
const routeRecent = new Map<string, number[]>();

// Seconds until this client may ask again, or null when the request is within the limit (and is counted).
// Plain comments on purpose: scripts/build_openapi.py takes this route's description from the file's
// first JSDoc block, and a helper's JSDoc there would become the door's published description.
export function routeBurstRetryAfter(client: string | null, now: number = Date.now()): number | null {
  if (!client) return null;
  const stamps = (routeRecent.get(client) ?? []).filter((t) => t > now - ROUTE_BURST_WINDOW_MS);
  routeRecent.delete(client);
  if (stamps.length >= ROUTE_BURST_LIMIT) {
    routeRecent.set(client, stamps);
    return Math.max(1, Math.ceil((stamps[0] + ROUTE_BURST_WINDOW_MS - now) / 1000));
  }
  stamps.push(now);
  routeRecent.set(client, stamps);
  if (routeRecent.size > ROUTE_BURST_MAX_CLIENTS) routeRecent.delete(routeRecent.keys().next().value as string);
  return null;
}

// Tests only: forget every client.
export function resetRouteBurst(): void {
  routeRecent.clear();
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const retryAfter = routeBurstRetryAfter(request.headers.get("cf-connecting-ip"));
  if (retryAfter !== null) {
    return Response.json(
      {
        error: "too many requests from this client",
        retry_after_seconds: retryAfter,
        limit: {
          requests: ROUTE_BURST_LIMIT,
          window_seconds: ROUTE_BURST_WINDOW_MS / 1000,
          scope: "per client IP, per edge instance; not a global quota",
        },
      },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }
  const tooLarge = () =>
    Response.json({ error: `the request body exceeds ${MAX_ROUTE_BODY_BYTES} bytes` }, { status: 413 });
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_ROUTE_BODY_BYTES) return tooLarge();
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_ROUTE_BODY_BYTES) return tooLarge();
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ error: "the request body is not a JSON object" }, { status: 400 });
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
    scope: ENVELOPE_SCOPE,
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
