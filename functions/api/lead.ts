/**
 * POST /api/lead — bounded, explicitly acknowledged assessment enquiry.
 * Storage is NOT an email notification, acceptance, or promise of a report.
 */
import { headFromGet } from "./_head";
import {
  cleanEmail, cleanOptionalField, readIntakeJson,
} from "./_bounded-lead-body";

interface Env { LEADS?: KVNamespace }
const reply = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const parsed = await readIntakeJson(request, 8192);
  if (parsed.ok === false) return reply({ error: parsed.error }, parsed.status);
  const body = parsed.body;

  const email = cleanEmail(body.email);
  if (!email) return reply({ error: "a valid email address is required" }, 400);

  // The real assessment form sends result_id; earlier code ignored it and
  // retained only report_id. Keep both clients compatible without a false join.
  if (body.report_id !== undefined && body.result_id !== undefined &&
      body.report_id !== body.result_id)
    return reply({ error: "inconsistent result reference" }, 400);
  const name = cleanOptionalField(body.name, 100);
  const report_id = cleanOptionalField(body.report_id ?? body.result_id, 160);
  const tier = cleanOptionalField(body.tier, 64);
  const wants = cleanOptionalField(body.wants, 160);
  if ([name, report_id, tier, wants].some(v => v === null))
    return reply({ error: "invalid or oversized enquiry field" }, 400);

  const record = {
    email, name, report_id, tier, wants, at: new Date().toISOString(),
    source: "councilof.ai/assess", notification_state: "NOT_CONFIGURED",
  };

  if (!env.LEADS) return reply({
    ok: true, stored: false, reason: "no datastore bound to this deployment yet",
    fallback: "email contact@csoai.org with your report_id",
  });
  try {
    await env.LEADS.put(`lead:${record.at}:${crypto.randomUUID()}`,
      JSON.stringify(record));
    return reply({ ok: true, stored: true });
  } catch {
    return reply({
      ok: false, stored: false, reason: "storage was not confirmed",
      fallback: "email contact@csoai.org with your report_id",
    }, 503);
  }
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
