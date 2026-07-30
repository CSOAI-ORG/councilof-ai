/**
 * POST /api/lead — accepts the "email me the signed report" form.
 *
 * HONESTY OVER APPEARANCE
 * There is no datastore bound to this project yet, and this endpoint does not pretend
 * otherwise: it returns `stored: false` with the reason, every time, until a KV namespace is
 * bound (binding name LEADS) — at which point it writes and says `stored: true`. A 200 that
 * silently drops a lead is the false-success pattern this estate keeps hunting in itself;
 * a 500 would block the user's flow for something that is our gap, not theirs.
 *
 * Nothing here is used for anything else: no analytics, no enrichment, no third party.
 */

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
