/**
 * POST /api/subscribe — the newsletter signup behind the homepage daily-report band
 * and the footer email capture.
 *
 * HONESTY OVER APPEARANCE
 * The band renders a working form that posts here. Until 2026-11-04 this endpoint answered
 * 501 NOT_IMPLEMENTED while that form promised otherwise — a promise with no backend, caught
 * by the public-surface SOP sweep (2026-11-04). Now it stores, in the same LEADS namespace
 * /api/lead and /api/contact use, under the `subscribe:<ISO>:<uuid>` key convention the
 * namespace already carries (see lead.test.ts). The privacy page's LEADS disclosure covers
 * these records (client/src/pages/legal/PublicPrivacy.tsx).
 *
 * If a deployment ever runs without that binding, this endpoint does not pretend:
 * `stored: false` with the reason, exactly like lead.ts. A 200 that silently drops an
 * address is the false-success pattern this estate keeps hunting in itself.
 *
 * Nothing here is used for anything else: no analytics, no enrichment, no third party.
 */
import { headFromGet } from "./_head";

interface Env {
  LEADS?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().slice(0, 200);
  if (!email.includes("@")) {
    return Response.json({ error: "an email address is required" }, { status: 400 });
  }

  const record = {
    email,
    source: String(body.source ?? "newsletter").slice(0, 60),
    at: new Date().toISOString(),
  };

  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(
      `subscribe:${record.at}:${crypto.randomUUID()}`,
      JSON.stringify(record),
    );
    return Response.json({ ok: true, stored: true });
  }

  // No store bound. Say so — the front ends tell the user it did not stick.
  return Response.json({
    ok: true,
    stored: false,
    reason: "no datastore bound to this deployment yet",
  });
};

/**
 * GET /api/subscribe — answers one question: is the LEADS binding present? Exactly
 * {"bound": true} or {"bound": false}, and never the namespace's key list, for the same
 * reason lead.ts stopped listing keys: key names disclose timing and volume.
 */
export const onRequestGet: PagesFunction<Env> = async (ctx) =>
  Response.json({ bound: Boolean(ctx.env.LEADS) }, { headers: { "cache-control": "no-store" } });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
