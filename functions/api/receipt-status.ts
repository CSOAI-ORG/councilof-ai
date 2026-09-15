/**
 * GET /api/receipt-status — current receipt issuance status.
 *
 * Free endpoint (no x402 gate). Reads aggregate counts from REVENUE_KV, the same
 * append-only store that /api/receipts and /api/revenue read from. Returns:
 *   { total_receipts, latest_receipt, receipts_today, receipts_this_week }
 *
 * When REVENUE_KV is not bound the response is honest: status UNRECORDED and every
 * count is null, never 0. Zero asserts a measured zero; null means "no source".
 *
 * Sibling doors:
 *   /api/revenue      — the three-SKU revenue instrumentation
 *   /api/receipts     — per-payer receipt lookup
 *   /api/receipts/latest — aggregate receipt feed
 *   /api/receipts/verify — POST a JWS, get VALID or INVALID
 */

/// <reference types="@cloudflare/workers-types" />
import { RECEIPT_KEY_PREFIX, type ReceiptRecord } from "./_x402_receipt";

export interface Env {
  REVENUE_KV?: KVNamespace;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });

type KvLike = {
  get: (k: string) => Promise<string | null>;
  list?: (o: { prefix: string; cursor?: string; limit?: number }) => Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
};

async function readAllReceiptKeys(kv: KvLike): Promise<ReceiptRecord[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list!({ prefix: RECEIPT_KEY_PREFIX, cursor, limit: 1000 });
    for (const k of page.keys) names.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && names.length < 5000);

  const rows: ReceiptRecord[] = [];
  for (const n of names) {
    const v = await kv.get(n);
    if (!v) continue;
    try {
      rows.push(JSON.parse(v) as ReceiptRecord);
    } catch {
      /* an unreadable row is skipped, never invented */
    }
  }
  return rows;
}

export async function buildReceiptStatus(env: Env) {
  const base = {
    schema: "csoai.receipt-status/0.1",
    as_of: new Date().toISOString(),
    endpoints: {
      receipts: "/api/receipts?payer=0x…",
      latest: "/api/receipts/latest",
      verify: "/api/receipts/verify",
      revenue: "/api/revenue",
    },
    note: "Free endpoint. Aggregate counts only — no wallet addresses, transaction IDs, or JWS payloads exposed.",
  };

  if (!env.REVENUE_KV) {
    return {
      ...base,
      status: "UNRECORDED",
      total_receipts: null,
      latest_receipt: null,
      receipts_today: null,
      receipts_this_week: null,
      reason:
        "REVENUE_KV is not bound on this deployment. Every count is null, never 0 — " +
        "null means no source, 0 would mean measured-zero. Bind REVENUE_KV to enable.",
    };
  }

  try {
    const rows = await readAllReceiptKeys(env.REVENUE_KV as unknown as KvLike);
    if (rows.length === 0) {
      return {
        ...base,
        status: "MEASURED",
        total_receipts: 0,
        latest_receipt: null,
        receipts_today: 0,
        receipts_this_week: 0,
        reason:
          "REVENUE_KV is bound and readable but holds zero stored receipts. " +
          "This is a measured zero: the store is live and empty.",
      };
    }

    // Sort newest first by issued_at.
    rows.sort((a, b) => (b.payload?.issuedAt || 0) - (a.payload?.issuedAt || 0));
    const latest = rows[0]!;

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const dayBoundary = startOfDay.getTime();

    // ISO week: Monday 00:00 UTC.
    const startOfWeek = new Date(startOfDay);
    const dow = startOfWeek.getUTCDay();
    const diff = (dow === 0 ? 7 : dow) - 1; // days since Monday
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - diff);
    const weekBoundary = startOfWeek.getTime();

    let today = 0;
    let thisWeek = 0;
    for (const r of rows) {
      const ts = (r.payload?.issuedAt || 0) * 1000;
      if (ts >= dayBoundary) today++;
      if (ts >= weekBoundary) thisWeek++;
    }

    return {
      ...base,
      status: "MEASURED",
      total_receipts: rows.length,
      latest_receipt: {
        issued_at: latest.issued_at || null,
        resource: latest.resource || null,
        kid: latest.kid || null,
        zero_value: latest.zero_value ?? null,
        self: latest.self ?? null,
        // Wallet addresses and tx hashes are never exposed by this aggregate endpoint.
      },
      receipts_today: today,
      receipts_this_week: thisWeek,
      coverage_note:
        "Counts cover at most the receipts stored in REVENUE_KV under the " +
        "receipt:tx: prefix. A receipt alone is not a buyer or revenue event — " +
        "self-settlements and zero-value settlements are included in the total " +
        "but excluded from revenue reporting at /api/revenue.",
    };
  } catch (e) {
    return {
      ...base,
      status: "UNRECORDED",
      total_receipts: null,
      latest_receipt: null,
      receipts_today: null,
      receipts_this_week: null,
      reason:
        `REVENUE_KV read failed (${(e as Error).message}) — counts stay null, ` +
        "never substituted. A read failure is not a zero.",
    };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  json(await buildReceiptStatus(env));
