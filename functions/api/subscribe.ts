/**
 * POST /api/subscribe — the email-capture form on the homepage and blog.
 * Same honesty contract as /api/lead: stores when a KV namespace is bound (LEADS),
 * says `stored:false` with a fallback when it is not. Never a 200 that drops data silently.
 */
interface Env { LEADS?: KVNamespace }

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: "body must be JSON" }, { status: 400 }); }

  const email = String(body.email ?? "").slice(0, 200);
  if (!email.includes("@")) return Response.json({ error: "an email address is required" }, { status: 400 });

  const record = { kind: "subscribe", email, source: String(body.source ?? "").slice(0, 100), at: new Date().toISOString() };

  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(`subscribe:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record));
    return Response.json({ ok: true, stored: true });
  }
  return Response.json({ ok: true, stored: false, reason: "no datastore bound yet", fallback: "email nicholas@csoai.org" });
};
