/**
 * POST /api/contact — durable enquiry intake.
 * A stored record is not an email notification, a confirmed commission, or a booking.
 */
interface Env { LEADS?: KVNamespace }
const LIMITS = { name: 100, email: 254, subject: 160, message: 5000 } as const;
type Field = keyof typeof LIMITS;
const reply = (body: unknown, status: number) => Response.json(body, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin)
        return reply({ stored: false, code: "CROSS_ORIGIN" }, 403);
    } catch { return reply({ stored: false, code: "CROSS_ORIGIN" }, 403); }
  }
  if (!/application\/json/i.test(request.headers.get("content-type") || ""))
    return reply({ stored: false, code: "JSON_REQUIRED" }, 415);
  const raw = await request.text();
  if (raw.length > 8500) return reply({ stored: false, code: "TOO_LARGE" }, 413);
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("not an object");
    body = parsed;
  } catch { return reply({ stored: false, code: "BAD_JSON" }, 400); }
  if (body.website) return reply({ stored: false, code: "BOT_FIELD" }, 400);
  const fields = {} as Record<Field, string>;
  for (const key of Object.keys(LIMITS) as Field[]) {
    if (typeof body[key] !== "string" || !body[key].trim() || body[key].length > LIMITS[key])
      return reply({ stored: false, code: "INVALID_FIELD", field: key }, 400);
    fields[key] = body[key].trim();
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email) ||
      /[\r\n]/.test(fields.name) || /[\r\n]/.test(fields.email) ||
      /[\r\n]/.test(fields.subject)) {
    return reply({ stored: false, code: "INVALID_CONTACT" }, 400);
  }
  if (!env.LEADS) return reply({
    stored: false, code: "INTAKE_UNAVAILABLE", fallback: "contact@csoai.org",
  }, 503);
  const id = crypto.randomUUID();
  const at = new Date().toISOString();
  try {
    await env.LEADS.put("contact:" + at + ":" + id, JSON.stringify({
      kind: "contact", ...fields, at, id, source: "councilof.ai/contact",
      notification_state: "NOT_CONFIGURED",
    }));
  } catch {
    return reply({ stored: false, code: "STORAGE_FAILED", fallback: "contact@csoai.org" }, 503);
  }
  return reply({
    stored: true, receipt_id: id, at, notification_state: "NOT_SENT",
    message: "Enquiry stored. No automatic email notification has been sent.",
  }, 202);
};
