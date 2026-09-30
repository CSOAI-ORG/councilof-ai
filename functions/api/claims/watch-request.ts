/**
 * POST /api/claims/watch-request — a person asks for a subject to be re-checked monthly.
 *
 * A REQUEST, NOT A SCHEDULE. The claim-maintenance register (GET /api/claims/register) is generated
 * from registry files a person commits (spec 7.5); this endpoint only records that someone asked,
 * for that person to accept or decline. Nothing is measured, scheduled, charged, signed or published
 * by it, and it never changes any state on the board or in the register.
 *
 * The body must say it was confirmed (confirmed: true): the GSPC evidence panel only sends it after
 * a Confirm click, and the request is logged in the panel's action log. Stored verbatim in KV
 * (LEADS, key watch-request:<at>:<uuid>) when bound; otherwise answered NOT_RECORDED, never a
 * pretend success. No personal data is asked for or stored: subject, cadence, where it came from.
 */
interface Env {
  LEADS?: KVNamespace;
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};
const NOTE =
  "A request, not a schedule: a person adds the subject to the claim-maintenance register or declines it. Nothing is measured, scheduled, charged or published by this request.";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const raw = await ctx.request.text();
  if (raw.length > 2048) return json({ state: "REJECTED", error: "body over 2048 bytes", note: NOTE }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ state: "REJECTED", error: "body must be JSON", note: NOTE }, 400);
  }
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  if (!subject || subject.length > 300 || /[\u0000-\u001f<>"]/.test(subject))
    return json({ state: "REJECTED", error: "subject: a URL, card id, model id or claim id of at most 300 characters", note: NOTE }, 400);
  if (body.confirmed !== true) return json({ state: "REJECTED", error: "confirmed must be true: a watch request is sent only after a person confirms it", note: NOTE }, 400);
  if (body.cadence !== undefined && body.cadence !== "monthly") return json({ state: "REJECTED", error: "cadence: monthly is the only cadence offered", note: NOTE }, 400);

  const at = new Date().toISOString();
  const request_id = `wr-${at.slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    schema: "csoai.watch-request/0.1",
    request_id,
    subject,
    cadence: "monthly",
    confirmed: true,
    requested_via: typeof body.requested_via === "string" ? body.requested_via.slice(0, 60) : "unspecified",
    at,
    state: "RECEIVED_FOR_REVIEW",
  };
  if (!ctx.env.LEADS) return json({ state: "NOT_RECORDED", stored: false, reason: "no datastore bound", note: NOTE }, 503);
  await ctx.env.LEADS.put(`watch-request:${at}:${request_id}`, JSON.stringify(record));
  return json({ state: "RECEIVED_FOR_REVIEW", stored: true, request_id, subject, cadence: "monthly", note: NOTE }, 202);
};
