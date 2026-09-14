/**
 * GET /api/commission-queue — mill-visible QUEUED intents.
 *
 * Sources (read-only, no backfill writes):
 *   1) REVENUE_KV mill:commission:* written by /api/request-attestation after settle
 *   2) Legacy ras:* receipts classified on read — QUEUED + non-null model only
 *      (closes LIVE gap: CQ count=0 while /api/commissions queued≥1 for pre-enqueue admits)
 *
 * Aggregate public facts only. Never a score. SKU/UNFULFILLABLE never enter mill priority.
 */
import { classifyCommissionTarget } from "./_commission_target";

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
  fulfillment: "QUEUED" | "UNFULFILLABLE" | "RETRIEVABLE";
  source: "mill:commission" | "ras";
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

async function listPrefix(
  kv: KVNamespace,
  prefix: string,
  map: (name: string, r: Record<string, unknown>) => QueueRow | null,
): Promise<{ rows: QueueRow[]; unreadable: number }> {
  const rows: QueueRow[] = [];
  let unreadable = 0;
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      const raw = await kv.get(k.name);
      if (!raw) {
        unreadable++;
        continue;
      }
      try {
        const r = JSON.parse(raw) as Record<string, unknown>;
        const row = map(k.name, r);
        if (row) rows.push(row);
      } catch {
        unreadable++;
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { rows, unreadable };
}

function fromMillKey(name: string, r: Record<string, unknown>): QueueRow | null {
  const subject = typeof r.subject === "string" ? r.subject.trim() : name.slice("mill:commission:".length);
  if (!subject) return null;
  const fulfillment =
    r.fulfillment === "UNFULFILLABLE" ? "UNFULFILLABLE"
    : r.fulfillment === "RETRIEVABLE" ? "RETRIEVABLE"
    : "QUEUED";
  // Mill-visible queue is QUEUED only — RETRIEVABLE means signed cards already published.
  if (fulfillment !== "QUEUED") return null;
  return {
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
    source: "mill:commission",
  };
}

/** Legacy ras:* → mill-visible only when QUEUED with a non-null model (Measure #2255 prefer-queue). */
function fromRasKey(name: string, r: Record<string, unknown>): QueueRow | null {
  const subject = typeof r.subject === "string" ? r.subject.trim() : "";
  if (!subject) return null;
  const classified = classifyCommissionTarget(subject);
  const fulfillment =
    r.fulfillment === "QUEUED" || r.fulfillment === "UNFULFILLABLE" || r.fulfillment === "RETRIEVABLE"
      ? (r.fulfillment as "QUEUED" | "UNFULFILLABLE" | "RETRIEVABLE")
      : classified.fulfillment;
  // RETRIEVABLE / UNFULFILLABLE never enter mill priority
  if (fulfillment !== "QUEUED") return null;
  const model =
    typeof r.model === "string" && r.model
      ? r.model
      : classified.model;
  if (!model) return null;
  const subject_kind =
    typeof r.subject_kind === "string" ? r.subject_kind : classified.subject_kind;
  const bank =
    typeof r.bank === "string" && r.bank ? r.bank : classified.bank;
  return {
    subject,
    subject_kind,
    model,
    bank,
    axis: typeof r.axis === "string" && r.axis ? r.axis : null,
    tx: typeof r.tx === "string" && r.tx ? r.tx : null,
    as_of: typeof r.as_of === "string" ? r.as_of : null,
    receipt_sha: name.slice("ras:".length),
    card_sha: typeof r.card_sha === "string" ? r.card_sha : null,
    status: "QUEUED",
    fulfillment: "QUEUED",
    source: "ras",
  };
}

export async function listCommissionQueue(kv: KVNamespace): Promise<{ rows: QueueRow[]; unreadable: number }> {
  const mill = await listPrefix(kv, "mill:commission:", fromMillKey);
  const ras = await listPrefix(kv, "ras:", fromRasKey);
  // Prefer explicit mill:commission enqueue over classified ras:* for the same subject.
  const bySubject = new Map<string, QueueRow>();
  for (const row of ras.rows) bySubject.set(row.subject, row);
  for (const row of mill.rows) bySubject.set(row.subject, row);
  const rows = [...bySubject.values()].sort((a, b) =>
    String(a.as_of ?? "").localeCompare(String(b.as_of ?? "")),
  );
  return { rows, unreadable: mill.unreadable + ras.unreadable };
}

export async function buildCommissionQueue(env: Env) {
  const base = {
    schema: "csoai.commission-queue/0.1",
    endpoint: "/api/commission-queue",
    what: "Mill-visible commission intents. mill:commission:* after settle, plus legacy ras:* classified QUEUED with non-null model. UNFULFILLABLE/SKU/RETRIEVABLE never enter mill priority. Never a measurement.",
    source: "REVENUE_KV mill:commission:* ∪ classified ras:* (QUEUED + model)",
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
