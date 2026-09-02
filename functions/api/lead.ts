/**
 * POST /api/lead — durable buyer intake when LEADS KV is bound.
 *
 * Receipt means only that a scope request was stored. It is not a measurement,
 * a score, a quote, a booking, a certificate, or an assurance conclusion.
 */
interface Env { LEADS?: KVNamespace }

const DISCLOSURES = new Set(["private-pack", "public-card", "undecided"]);
const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export type MeasurementEnquiry = {
  kind: "measurement-enquiry";
  enquiry_id: string;
  state: "RECEIVED";
  operator_state: "PENDING_SCOPE";
  received_at: string;
  email: string;
  contact_name: string;
  organization: string;
  system: string;
  intended_use: string;
  evidence_needed: string;
  target_date: string;
  disclosure_preference: "private-pack" | "public-card" | "undecided";
  endpoint: string;
  meaning: string;
};

export function parseMeasurementEnquiry(
  body: Record<string, unknown>,
  receivedAt: string,
  enquiryId: string,
): { ok: true; record: MeasurementEnquiry } | { ok: false; error: string } {
  const email = clean(body.email, 200);
  const organization = clean(body.organization, 300);
  const system = clean(body.system, 1000);
  const intendedUse = clean(body.intended_use, 2000);
  const evidenceNeeded = clean(body.evidence_needed, 2000);
  const targetDate = clean(body.target_date, 10);
  const disclosure = clean(body.disclosure_preference, 40);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "a valid email address is required" };
  if (!organization) return { ok: false, error: "organization is required" };
  if (!system) return { ok: false, error: "system is required" };
  if (!intendedUse) return { ok: false, error: "intended_use is required" };
  if (!evidenceNeeded) return { ok: false, error: "evidence_needed is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return { ok: false, error: "target_date must be YYYY-MM-DD" };
  if (!DISCLOSURES.has(disclosure)) {
    return { ok: false, error: "disclosure_preference must be private-pack, public-card, or undecided" };
  }

  return {
    ok: true,
    record: {
      kind: "measurement-enquiry",
      enquiry_id: enquiryId,
      state: "RECEIVED",
      operator_state: "PENDING_SCOPE",
      received_at: receivedAt,
      email,
      contact_name: clean(body.contact_name, 200),
      organization,
      system,
      intended_use: intendedUse,
      evidence_needed: evidenceNeeded,
      target_date: targetDate,
      disclosure_preference: disclosure as MeasurementEnquiry["disclosure_preference"],
      endpoint: clean(body.endpoint, 1000),
      meaning:
        "Stored request for a human scope review. Not a measurement, score, quote, booking, certificate, or assurance conclusion.",
    },
  };
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: "body must be JSON" }, { status: 400 }); }

  if (body.kind !== "measurement-enquiry") {
    return Response.json({ error: "kind must be measurement-enquiry" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const enquiryId = `ME-${crypto.randomUUID()}`;
  const parsed = parseMeasurementEnquiry(body, now, enquiryId);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  if (!ctx.env.LEADS) {
    return Response.json(
      {
        ok: false,
        stored: false,
        state: "NOT_RECEIVED",
        reason: "LEADS datastore is not bound to this deployment",
        fallback: "Email nicholas@csoai.org with the six scope fields shown on this page.",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const workItem = {
    kind: "measurement-scope-work-item",
    enquiry_id: enquiryId,
    state: "PENDING_SCOPE",
    created_at: now,
    target_date: parsed.record.target_date,
  };
  await Promise.all([
    ctx.env.LEADS.put(`enquiry:${enquiryId}`, JSON.stringify(parsed.record)),
    ctx.env.LEADS.put(`work-item:measurement-intake:${now}:${enquiryId}`, JSON.stringify(workItem)),
  ]);

  return Response.json(
    {
      ok: true,
      stored: true,
      receipt: {
        enquiry_id: enquiryId,
        state: "RECEIVED",
        operator_state: "PENDING_SCOPE",
        received_at: now,
        meaning: parsed.record.meaning,
      },
      next_step: "A human reviews scope and evidence access before any measurement or commercial quote.",
    },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
};

/** Public diagnostic: reports binding health without exposing buyer record keys. */
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.LEADS) return Response.json({ bound: false, workflow_ready: false });
  const list = await ctx.env.LEADS.list({ limit: 1000 });
  const enquiryCount = list.keys.filter((key) => key.name.startsWith("enquiry:")).length;
  const pendingCount = list.keys.filter((key) => key.name.startsWith("work-item:measurement-intake:")).length;
  return Response.json({
    bound: true,
    workflow_ready: true,
    enquiries_visible_in_page: enquiryCount,
    pending_work_items_visible_in_page: pendingCount,
    list_complete: list.list_complete,
  });
};
