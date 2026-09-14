/**
 * GET /api/commissions — the open commission queue, read from the same store that holds the
 * settlements (REVENUE_KV, `ras:<receipt sha>` records written by /api/request-attestation).
 *
 * Typed contract (Stage68): every row exposes subject_kind / model / bank / fulfillment.
 * Legacy ras:* records without fields are classified on read (never invented MEASURED).
 * payai-wrapper → UNFULFILLABLE, not a model mill target.
 */
import { classifyCommissionTarget, type Fulfillment, type SubjectKind } from "./_commission_target";

type Env = { REVENUE_KV?: KVNamespace };

type Commission = {
  subject: string;
  subject_kind: SubjectKind;
  model: string | null;
  bank: string | null;
  fulfillment: Fulfillment;
  axis: string | null;
  tx: string | null;
  as_of: string | null;
  receipt_sha: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60", "access-control-allow-origin": "*" },
  });

function typedFields(subject: string, r: Record<string, unknown>) {
  const classified = classifyCommissionTarget(subject);
  const subject_kind = (typeof r.subject_kind === "string" ? r.subject_kind : classified.subject_kind) as SubjectKind;
  const fulfillment = (r.fulfillment === "QUEUED" || r.fulfillment === "UNFULFILLABLE"
    ? r.fulfillment
    : classified.fulfillment) as Fulfillment;
  const model =
    typeof r.model === "string" && r.model
      ? r.model
      : fulfillment === "QUEUED"
        ? classified.model
        : null;
  const bank = typeof r.bank === "string" && r.bank ? r.bank : classified.bank;
  return { subject_kind, model, bank, fulfillment };
}

export async function listCommissions(kv: KVNamespace): Promise<{ commissions: Commission[]; unreadable: number }> {
  const out: Commission[] = [];
  let unreadable = 0;
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "ras:", cursor, limit: 1000 });
    for (const k of page.keys) {
      const raw = await kv.get(k.name);
      if (!raw) { unreadable++; continue; }
      try {
        const r = JSON.parse(raw) as Record<string, unknown>;
        const subject = typeof r.subject === "string" ? r.subject.trim() : "";
        if (!subject) { unreadable++; continue; }
        const typed = typedFields(subject, r);
        out.push({
          subject,
          ...typed,
          axis: typeof r.axis === "string" && r.axis ? r.axis : null,
          tx: typeof r.tx === "string" && r.tx ? r.tx : null,
          as_of: typeof r.as_of === "string" ? r.as_of : null,
          receipt_sha: k.name.slice("ras:".length),
        });
      } catch { unreadable++; }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  out.sort((a, b) => String(a.as_of ?? "").localeCompare(String(b.as_of ?? "")));
  return { commissions: out, unreadable };
}

export async function buildCommissions(env: Env) {
  const base = {
    schema: "csoai.commissions/0.2",
    endpoint: "/api/commissions",
    what: "Subjects that a paid request-attestation commissioned. Typed: subject_kind/model/bank/fulfillment. Mill grades QUEUED model/hub targets only; UNFULFILLABLE (e.g. payai-wrapper) is receipt-only. Never a score.",
    source: "REVENUE_KV ras:* records (written by /api/request-attestation on a facilitator-settled request)",
  };
  if (!env.REVENUE_KV) {
    return { ...base, status: "UNMEASURED", commissions: null, subjects: null, note: "no store bound — the list is null, not empty" };
  }
  try {
    const { commissions, unreadable } = await listCommissions(env.REVENUE_KV);
    const subjects = [...new Set(commissions.map((c) => c.subject))];
    return {
      ...base,
      status: "MEASURED",
      as_of: new Date().toISOString(),
      count: commissions.length,
      subjects,
      queued: commissions.filter((c) => c.fulfillment === "QUEUED").length,
      unfulfillable: commissions.filter((c) => c.fulfillment === "UNFULFILLABLE").length,
      commissions,
      records_unreadable: unreadable,
    };
  } catch (e) {
    return { ...base, status: "UNMEASURED", commissions: null, subjects: null, note: `REVENUE_KV read failed (${(e as Error).message}) — null, never substituted` };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await buildCommissions(env));
