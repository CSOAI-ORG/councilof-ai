/**
 * GET /api/door-settles — for each door the site holds a settlement record for: when it last
 * settled and the transaction the facilitator named. Read from the SAME records /api/revenue
 * counts (`settled:tx:*` in REVENUE_KV, written by recordSettlement in functions/api/_x402.ts),
 * through the same enumerator (listSettlementRecords in revenue.ts) — one parser, two surfaces.
 *
 * WHY. An x402 index drops a resource that has not settled for 30 days (docs/product/
 * X402-BAZAAR-AUDIT.md; the owner's build spec of 2026-09-22 §A). The /pay page turns a door
 * red at 25 days from its last settle so the heartbeat can happen before the delist. The date
 * it turns red on has to be a date this site actually recorded, so this is where it comes from.
 *
 * NULL RULE. A door with no record here is ABSENT from `rows`; the page reads that as
 * last_settle null — UNMEASURED — and treats it as delist risk. Nothing here guesses a date
 * from a listing, a manifest or a tally. When no store is bound, or the read fails, `kind` is
 * UNMEASURED with the reason and `rows` is empty: every door is then null, and says so.
 *
 * WHAT A ROW IS NOT. It is the latest record the site wrote when a facilitator confirmed a
 * settle through that resource — self-funded heartbeats included, because a heartbeat is exactly
 * what keeps a listing alive, and flagged as `self` so nobody reads it as demand. It is not a
 * chain read; the transaction is the facilitator's word as the door relayed it. No payer here.
 */
import { listSettlementRecords, type RevenueEnv, type StoredSettlement } from "./revenue";
import { routeKey } from "./x402-listing";
import { headFromGet } from "./_head";

export const DOOR_SETTLES_SCHEMA = "csoai.door-settles/0.1";

export type DoorSettleRow = {
  resource: string;
  route_key: string;
  last_settle: string; // the record's settled_at, as written — an ISO instant
  tx: string | null; // the facilitator's transaction reference; null when it named none
  network: string | null;
  self: boolean | null; // the estate paying itself (X402_SELF_WALLETS) — a heartbeat, not a buyer
  zero_value: boolean | null;
  settles: number; // records for this resource that carried a readable settled_at
};

export type DoorSettlesReading = {
  schema: typeof DOOR_SETTLES_SCHEMA;
  kind: "MEASURED" | "UNMEASURED";
  as_of: string;
  source: string;
  rows: DoorSettleRow[];
  records: number | null;
  records_unreadable: number | null;
  records_without_time: number | null;
  records_without_resource: number | null;
  truncated: boolean;
  reason: string | null;
  null_rule: string;
  note: string;
};

const NULL_RULE =
  "A door absent from rows has no settlement record on this site: its last settle is null (UNMEASURED), never a " +
  "date inferred from an index row, the manifest or a tally. When kind is UNMEASURED no door has a reading at all.";
const NOTE =
  "Each row is the latest facilitator-confirmed settle this site recorded for that resource, self-funded heartbeats " +
  "included and flagged. The transaction is the facilitator's claim as the door relayed it, verified by nothing here. " +
  "Measurement, not a mark: a settle keeps a listing alive; it grades nothing.";

/** Fold the records into one row per resource: latest readable settled_at wins. Pure. */
export function foldDoorSettles(records: StoredSettlement[]): {
  rows: DoorSettleRow[];
  without_time: number;
  without_resource: number;
} {
  const latest = new Map<string, { row: DoorSettleRow; at: number }>();
  let withoutTime = 0;
  let withoutResource = 0;
  for (const r of records) {
    const resource = typeof r.resource === "string" ? r.resource.trim() : "";
    if (!resource) { withoutResource++; continue; }
    const at = typeof r.settled_at === "string" ? Date.parse(r.settled_at) : NaN;
    if (!Number.isFinite(at)) { withoutTime++; continue; }
    const prev = latest.get(resource);
    if (prev) prev.row.settles += 1;
    if (!prev || at > prev.at) {
      latest.set(resource, {
        at,
        row: {
          resource,
          route_key: routeKey(resource),
          last_settle: r.settled_at as string,
          tx: typeof r.transaction === "string" && r.transaction ? r.transaction : null,
          network: typeof r.network === "string" && r.network ? r.network : null,
          self: typeof r.self === "boolean" ? r.self : null,
          zero_value: typeof r.zero_value === "boolean" ? r.zero_value : null,
          settles: prev ? prev.row.settles : 1,
        },
      });
    }
  }
  const rows = [...latest.values()].map((v) => v.row).sort((a, b) => a.resource.localeCompare(b.resource));
  return { rows, without_time: withoutTime, without_resource: withoutResource };
}

export async function buildDoorSettles(env: RevenueEnv): Promise<DoorSettlesReading> {
  const asOf = new Date().toISOString();
  const base = (partial: Partial<DoorSettlesReading>): DoorSettlesReading => ({
    schema: DOOR_SETTLES_SCHEMA,
    kind: "UNMEASURED",
    as_of: asOf,
    source: "REVENUE_KV settled:tx:* records, via listSettlementRecords (functions/api/revenue.ts)",
    rows: [],
    records: null,
    records_unreadable: null,
    records_without_time: null,
    records_without_resource: null,
    truncated: false,
    reason: null,
    null_rule: NULL_RULE,
    note: NOTE,
    ...partial,
  });
  const kv = env.REVENUE_KV;
  if (!kv) return base({ reason: "no REVENUE_KV bound — nothing is recorded, so no door has a last settle here" });
  try {
    const listed = await listSettlementRecords(kv);
    const folded = foldDoorSettles(listed.records.map((x) => x.record));
    return base({
      kind: "MEASURED",
      rows: folded.rows,
      records: listed.records.length,
      records_unreadable: listed.unreadable,
      records_without_time: folded.without_time,
      records_without_resource: folded.without_resource,
      truncated: listed.truncated,
      reason: listed.truncated
        ? "the store holds more settled:tx:* keys than one read enumerates; a later settle may be missing from a row"
        : null,
    });
  } catch (e) {
    return base({ reason: `REVENUE_KV read failed (${(e as Error).message}) — no door has a reading; nothing is substituted` });
  }
}

export const onRequestGet: PagesFunction<RevenueEnv> = async ({ env }) => {
  const reading = await buildDoorSettles(env);
  return new Response(JSON.stringify(reading, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
