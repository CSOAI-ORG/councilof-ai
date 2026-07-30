/**
 * POST /api/contact — the contact form. Fields stored verbatim when KV (LEADS) is bound;
 * honest `stored:false` + fallback address when not. Nothing inferred, nothing forwarded
 * to third parties.
 */
interface Env { LEADS?: KVNamespace }

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: "body must be JSON" }, { status: 400 }); }

  const email = String(body.email ?? "").slice(0, 200);
  const message = String(body.message ?? "").slice(0, 5000);
  if (!email.includes("@") || !message) {
    return Response.json({ error: "email and message are required" }, { status: 400 });
  }
  const record = {
    kind: "contact", email,
    name: String(body.name ?? "").slice(0, 200),
    subject: String(body.subject ?? "").slice(0, 300),
    message, at: new Date().toISOString(),
  };

  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(`contact:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record));
    return Response.json({ ok: true, stored: true });
  }
  return Response.json({ ok: true, stored: false, reason: "no datastore bound yet", fallback: "email nicholas@csoai.org directly" });
};
