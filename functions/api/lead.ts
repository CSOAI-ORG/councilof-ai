/**
 * POST /api/lead — accepts the "email me the signed report" form.
 *
 * HONESTY OVER APPEARANCE
 * The LEADS KV namespace is bound on this deployment (wrangler.jsonc, since 841ebbcde): a POST
 * writes the record there and says `stored: true`. If a deployment ever runs without that
 * binding, this endpoint does not pretend otherwise: it returns `stored: false` with the reason.
 * A 200 that silently drops a lead is the false-success pattern this estate keeps hunting in
 * itself; a 500 would block the user's flow for something that is our gap, not theirs.
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

  const email = String(body.email ?? "").slice(0, 200);
  if (!email.includes("@")) {
    return Response.json({ error: "an email address is required" }, { status: 400 });
  }

  const record = {
    email,
    name: String(body.name ?? "").slice(0, 200),
    report_id: String(body.report_id ?? ""),
    tier: String(body.tier ?? ""),
    wants: String(body.wants ?? ""),
    at: new Date().toISOString(),
  };

  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(`lead:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record));
    return Response.json({ ok: true, stored: true });
  }

  // No store bound. Say so — the front can tell the user to email us directly instead.
  return Response.json({
    ok: true,
    stored: false,
    reason: "no datastore bound to this deployment yet",
    fallback: "email nicholas@csoai.org with your report_id",
  });
};

/**
 * GET /api/lead — answers one question: is the LEADS binding present on this deployment?
 * The body is exactly {"bound": true} or {"bound": false}, and this handler never reads the
 * namespace to produce it.
 *
 * It used to list up to ten key names and a count. LEADS keys are named
 * `<kind>:<ISO timestamp>:<uuid>` (contact:, lead:, and older subscribe: records), so that public
 * GET told anyone when each inbound request arrived and how many there were. No contents leaked,
 * but lead timing and volume did. The question it was built to settle (stored:true while the
 * namespace looked empty from outside) is settled. An operator who needs the keys reads the
 * namespace directly, with `wrangler kv key list --namespace-id <the LEADS id in wrangler.jsonc>`
 * or in the Cloudflare dashboard. No public surface lists them.
 */
export const onRequestGet: PagesFunction<Env> = async (ctx) =>
  Response.json({ bound: Boolean(ctx.env.LEADS) }, { headers: { "cache-control": "no-store" } });

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
