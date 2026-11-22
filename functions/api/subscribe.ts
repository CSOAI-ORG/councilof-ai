/**
 * POST /api/subscribe — bounded newsletter subscription storage.
 *
 * An acknowledged KV write is not a welcome email, a reviewed subscription or
 * consent to unrelated marketing. New copies expire after 30 days; previous
 * records are unchanged and require their own privacy/retention review.
 */
import { headFromGet } from "./_head";
import {
  cleanEmail, cleanOptionalField, NEW_LEAD_RETENTION_SECONDS, readIntakeJson,
} from "./_bounded-lead-body";

interface Env { LEADS?: KVNamespace }
const reply = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const parsed = await readIntakeJson(request, 2048);
  if (parsed.ok === false) return reply({ error: parsed.error }, parsed.status);
  const body = parsed.body;
  const email = cleanEmail(body.email);
  const source = cleanOptionalField(body.source ?? "newsletter", 60);
  if (!email) return reply({ error: "a valid email address is required" }, 400);
  if (source === null) return reply({ error: "invalid subscription source" }, 400);

  const record = { email, source, at: new Date().toISOString() };
  if (!env.LEADS) return reply({
    ok: true, stored: false, reason: "no datastore bound to this deployment yet",
  });
  try {
    await env.LEADS.put(`subscribe:${record.at}:${crypto.randomUUID()}`,
      JSON.stringify(record), { expirationTtl: NEW_LEAD_RETENTION_SECONDS });
    return reply({ ok: true, stored: true });
  } catch {
    return reply({ ok: false, stored: false, reason: "storage was not confirmed" }, 503);
  }
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
