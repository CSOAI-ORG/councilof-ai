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
import { readHubCardsIndex, readPodCardsIndex } from "./commissions";

type Env = { REVENUE_KV?: KVNamespace; ASSETS?: { fetch: (r: Request) => Promise<Response> } };

type QueueRow = {
  commission_id: string | null;
  request_scope_sha256: string | null;
  delivery_state?: "NOT_OBSERVED" | "EVIDENCE_PRESENT_NOT_REQUEST_BOUND" | "UNCHECKABLE";
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
  const cursors = new Set<string>();
  let pages = 0;
  do {
    if (++pages > 10) throw new Error("QUEUE_PAGE_LIMIT");
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
    cursor = !page.list_complete && "cursor" in page ? page.cursor : undefined;
    if (!page.list_complete && (!cursor || cursors.has(cursor))) throw new Error("QUEUE_CURSOR_INVALID");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return { rows, unreadable };
}

function fromMillKey(name: string, r: Record<string, unknown>): QueueRow | null {
  const versioned = r.schema === "csoai.commission-intent/0.2" || name.startsWith("mill:commission:v2:");
  if (versioned && (r.schema !== "csoai.commission-intent/0.2" ||
      typeof r.commission_id !== "string" || !/^[0-9a-f]{64}$/.test(r.commission_id) ||
      name !== `mill:commission:v2:${r.commission_id}` || r.status !== "QUEUED" ||
      typeof r.request_scope_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(r.request_scope_sha256))) return null;
  const subject = typeof r.subject === "string" ? r.subject.trim() : name.slice("mill:commission:".length);
  if (!subject) return null;
  const fulfillment =
    r.fulfillment === "UNFULFILLABLE" ? "UNFULFILLABLE"
    : r.fulfillment === "RETRIEVABLE" ? "RETRIEVABLE"
    : "QUEUED";
  // Mill-visible queue is QUEUED only — RETRIEVABLE means signed cards already published.
  if (fulfillment !== "QUEUED") return null;
  return {
    commission_id: typeof r.commission_id === "string" ? r.commission_id : null,
    request_scope_sha256: typeof r.request_scope_sha256 === "string" ? r.request_scope_sha256 : null,
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
  if (r.commission_id != null && (r.queue_ack !== "QUEUE_READBACK_CONFIRMED" || r.enqueued !== true)) return null;
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
    commission_id: typeof r.commission_id === "string" ? r.commission_id : null,
    request_scope_sha256: typeof r.request_scope_sha256 === "string" ? r.request_scope_sha256 : null,
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
  // New requests retain their immutable commission identity. Legacy copies deduplicate
  // only the same subject/axis scope; separate work must never collapse to one subject.
  const identity = (row: QueueRow) => row.commission_id ? `id:${row.commission_id}` : JSON.stringify([row.subject,row.axis]);
  const byRequest = new Map<string, QueueRow>();
  for (const row of ras.rows) byRequest.set(identity(row), row);
  for (const row of mill.rows) byRequest.set(identity(row), row);
  const rows = [...byRequest.values()].sort((a,b) => String(a.as_of ?? "").localeCompare(String(b.as_of ?? "")));

  return { rows, unreadable: mill.unreadable + ras.unreadable };
}

async function suppressDelivered(
  rows: QueueRow[],
  env: Env,
  origin: string,
  fetcher: typeof fetch,
): Promise<{ rows: QueueRow[]; suppressed: number; candidate_matches: number; state: "READ" | "UNCHECKABLE" }> {
  const needsPod = rows.some((r) => r.subject_kind !== "hub_model" && r.model);
  const needsHub = rows.some((r) => r.subject_kind === "hub_model" && r.model);
  const pod = needsPod ? await readPodCardsIndex(env, origin, fetcher) : new Map();
  const hub = needsHub ? await readHubCardsIndex(env, origin, fetcher) : new Map();
  if (pod === null || hub === null) return { rows:rows.map(r=>({...r,delivery_state:"UNCHECKABLE" as const})), suppressed: 0, candidate_matches:0, state: "UNCHECKABLE" };
  let candidate_matches = 0;
  const observed = rows.map(row => {
    const index = row.subject_kind === "hub_model" ? hub : pod;
    const cards = row.model ? index.get(row.model.toLowerCase()) ?? [] : [];
    const candidate = cards.some(card => row.axis === null || card.axis === row.axis);
    if (candidate) candidate_matches++;
    return {...row,delivery_state:candidate ? "EVIDENCE_PRESENT_NOT_REQUEST_BOUND" as const : "NOT_OBSERVED" as const};
  });
  // A model/axis index hit does not bind a result to this request, time, bank or
  // execution. No request disappears until an actual request-bound delivery exists.
  return { rows:observed, suppressed:0, candidate_matches, state:"READ" };

}

export async function buildCommissionQueue(env: Env, origin = "https://councilof.ai", fetcher: typeof fetch = fetch) {
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
    const listed = await listCommissionQueue(env.REVENUE_KV);
    const reconciled = await suppressDelivered(listed.rows, env, origin, fetcher);
    const rows = reconciled.rows;
    return {
      ...base,
      status: "MEASURED",
      as_of: new Date().toISOString(),
      count: rows.length,
      queued: rows.filter((r) => r.fulfillment === "QUEUED").length,
      unfulfillable: rows.filter((r) => r.fulfillment === "UNFULFILLABLE").length,
      delivery_reconciliation: {
        state: reconciled.state,
        suppressed: reconciled.suppressed,
        candidate_matches: reconciled.candidate_matches,
        meaning: "Model/axis index hits are candidates only, not request-bound delivery. They never suppress work here. Index unreadable keeps work visible and reports UNCHECKABLE.",
      },
      rows,
      records_unreadable: listed.unreadable,
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

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) =>
  json(await buildCommissionQueue(env, new URL(request.url).origin));
