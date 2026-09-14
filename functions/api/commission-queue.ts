/**
 * GET /api/commission-queue — mill-visible QUEUED intents written by /api/request-attestation
 * after settle (`mill:commission:<subject>` in REVENUE_KV).
 *
 * Aggregate public facts only. Never a score. fulfillment is QUEUED | UNFULFILLABLE.
 * model/bank name the fulfillable mill target when known; SKU-only subjects stay UNFULFILLABLE.
 */
type Env = { REVENUE_KV?: KVNamespace };

type QueueRow = {
  subject: string;
  subject_kind: string | null;
  model: string | null;
  bank: string | null;
  axis: string | null;
  tx: string | null;
  as_of: string | null;
  receipt_sha: string | null;
  card_sha: string | null;
  status: "QUEUED";
  fulfillment: "QUEUED" | "UNFULFILLABLE";
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30",
      "access-control-allow-origin": "*",
    },
  });

export async function listCommissionQueue(kv: KVNamespace): Promise<{ rows: QueueRow[]; unreadable: number }> {
  const rows: QueueRow[] = [];
  let unreadable = 0;
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "mill:commission:", cursor, limit: 1000 });
    for (const k of page.keys) {
      const raw = await kv.get(k.name);
      if (!raw) {
        unreadable++;
        continue;
      }
      try {
        const r = JSON.parse(raw) as Record<string, unknown>;
        const subject = typeof r.subject === "string" ? r.subject.trim() : k.name.slice("mill:commission:".length);
        if (!subject) {
          unreadable++;
          continue;
        }
        const fulfillment = r.fulfillment === "UNFULFILLABLE" ? "UNFULFILLABLE" : "QUEUED";
        rows.push({
          subject,
          subject_kind: typeof r.subject_kind === "string" ? r.subject_kind : null,
          model: typeof r.model === "string" && r.model ? r.model : null,
          bank: typeof r.bank === "string" && r.bank ? r.bank : null,
          axis: typeof r.axis === "string" && r.axis ? r.axis : null,
          tx: typeof r.tx === "string" && r.tx ? r.tx : null,
          as_of: typeof r.as_of === "string" ? r.as_of : null,
          receipt_sha: typeof r.receipt_sha === "string" ? r.receipt_sha : null,
          card_sha: typeof r.card_sha === "string" ? r.card_sha : null,
          status: "QUEUED",
          fulfillment,
        });
      } catch {
        unreadable++;
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  rows.sort((a, b) => String(a.as_of ?? "").localeCompare(String(b.as_of ?? "")));
  return { rows, unreadable };
}

export async function buildCommissionQueue(env: Env) {
  const base = {
    schema: "csoai.commission-queue/0.1",
    endpoint: "/api/commission-queue",
    what: "Mill-visible commission enqueue intents after settle. QUEUED means a fulfillable model/bank target; UNFULFILLABLE means receipt only (e.g. payai-wrapper SKU). Never a measurement.",
    source: "REVENUE_KV mill:commission:* (written by /api/request-attestation)",
  };
  if (!env.REVENUE_KV) {
    return { ...base, status: "UNMEASURED", rows: null, note: "no store bound — null, never empty" };
  }
  try {
    const { rows, unreadable } = await listCommissionQueue(env.REVENUE_KV);
    return {
      ...base,
      status: "MEASURED",
      as_of: new Date().toISOString(),
      count: rows.length,
      queued: rows.filter((r) => r.fulfillment === "QUEUED").length,
      unfulfillable: rows.filter((r) => r.fulfillment === "UNFULFILLABLE").length,
      rows,
      records_unreadable: unreadable,
    };
  } catch (e) {
    return {
      ...base,
      status: "UNMEASURED",
      rows: null,
      note: `REVENUE_KV read failed (${(e as Error).message}) — null, never substituted`,
    };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await buildCommissionQueue(env));
