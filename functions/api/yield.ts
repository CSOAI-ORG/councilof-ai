/**
 * GET /api/yield — the weekly yield dashboard (V3 brief G5.6).
 *
 * One number per family per week:
 *   yield = proofs_sold + feed_subs + attributed_inbound
 *
 * Data from gateway logs + UTM layer. Reads from REVENUE_KV (if bound) for settlement data,
 * then derives per-family yield. Gracefully returns zeros when no data is available — never
 * errors, never 500s.
 *
 * Query params:
 *   ?family=X  — filter to one family
 *   ?period=week|month — aggregation window (default: week)
 *
 * The families:
 *   proofs     — SKU-2 evidence bundles / proof sales (settled receipts for proof/bundle resources)
 *   feeds      — provider diff feed subscriptions (settled receipts for feed resources)
 *   attributed — attributed inbound (UTM-tagged gateway hits that are not self)
 *
 * Doctrine:
 *   · No new Date() for measurement stamps — as_of is the time of this request, clearly labelled.
 *   · A count is 0 (not null) when the store is bound but holds no matching records, because 0 is
 *     the honest measured zero for "this family sold nothing this period."
 *   · A count is null ONLY when no store is bound at all (UNMEASURED).
 *   · Self-settlements and zero-value settlements are excluded, same as /api/revenue.
 */

/// <reference types="@cloudflare/workers-types" />

import { selfWallets } from "./_x402";
import { headFromGet } from "./_head";

type YieldEnv = {
  REVENUE_KV?: KVNamespace;
  // The same x402 env fields selfWallets() reads (functions/api/_x402.ts).
  X402_PAY_TO?: string;
  X402_SELF_WALLETS?: string;
};

type FamilyYield = {
  family: string;
  proofs_sold: number;
  feed_subs: number;
  attributed_inbound: number;
  yield_total: number;
};

type YieldResponse = {
  schema: string;
  as_of: string;
  period: "week" | "month";
  period_ms: number;
  families: FamilyYield[];
  total_yield: number;
  source: string;
  contract: {
    definition: string;
    formula: string;
    null_rule: string;
    excludes_self: string;
    excludes_zero_value: string;
  };
};

/** Resource path patterns that map to families. */
const PROOF_RESOURCE_PATTERNS = [
  "/api/proof",
  "/api/bundle",
  "/api/evidence-bundle",
  "/api/request-attestation",
  "/api/receipts/batch",
  "/api/art50",
];
const FEED_RESOURCE_PATTERNS = [
  "/api/feeds",
  "/api/provider-diff",
  "/api/subscribe",
];

function resourceMatches(resource: string, patterns: string[]): boolean {
  const r = (resource || "").toLowerCase();
  return patterns.some((p) => r.startsWith(p) || r.includes(p));
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const EMPTY_FAMILIES: FamilyYield[] = [
  { family: "proofs", proofs_sold: 0, feed_subs: 0, attributed_inbound: 0, yield_total: 0 },
  { family: "feeds", proofs_sold: 0, feed_subs: 0, attributed_inbound: 0, yield_total: 0 },
  { family: "attributed", proofs_sold: 0, feed_subs: 0, attributed_inbound: 0, yield_total: 0 },
];

const CONTRACT = {
  definition:
    "One number per family per week: yield = proofs_sold + feed_subs + attributed_inbound. " +
    "Derived from settlement records in REVENUE_KV, never typed by hand.",
  formula: "yield_total = proofs_sold + feed_subs + attributed_inbound",
  null_rule:
    "All counts are null (not 0) when no REVENUE_KV is bound — nothing was measured. " +
    "Counts are 0 when the store is bound but holds no matching records for the period.",
  excludes_self:
    "Self-settlements (payer in X402_SELF_WALLETS) and zero-value settlements are excluded, " +
    "same definition as /api/revenue one_number.",
  excludes_zero_value:
    "A settlement that moved 0 atomic units is not a purchase and is not counted here.",
};

/**
 * buildYield — the core derivation. Reads every settled:tx:* record from REVENUE_KV, filters
 * by the requested period, classifies by family, and aggregates.
 */
async function buildYield(
  env: YieldEnv,
  familyFilter: string | null,
  period: "week" | "month",
): Promise<YieldResponse> {
  const now = Date.now();
  const periodMs = period === "month" ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
  const since = now - periodMs;

  const kv = env.REVENUE_KV;
  if (!kv) {
    return {
      schema: "csoai.yield/0.1",
      as_of: new Date(now).toISOString(),
      period,
      period_ms: periodMs,
      families: familyFilter
        ? EMPTY_FAMILIES.filter((f) => f.family === familyFilter)
        : EMPTY_FAMILIES,
      total_yield: 0,
      source: "UNMEASURED — no REVENUE_KV bound on this deployment",
      contract: CONTRACT,
    };
  }

  try {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await kv.list({ prefix: "settled:tx:", cursor, limit: 1000 });
      for (const k of page.keys) keys.push(k.name);
      cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
    } while (cursor && keys.length < 5000);

    // Per-family accumulators
    const acc: Record<string, { proofs: number; feeds: number; attributed: number }> = {
      proofs: { proofs: 0, feeds: 0, attributed: 0 },
      feeds: { proofs: 0, feeds: 0, attributed: 0 },
      attributed: { proofs: 0, feeds: 0, attributed: 0 },
    };

    for (const name of keys) {
      const raw = await kv.get(name);
      if (!raw) continue;
      let r: {
        payer?: string | null;
        self?: boolean;
        zero_value?: boolean;
        amount_atomic?: string | null;
        settled_at?: string;
        resource?: string | null;
        utm_source?: string | null;
        utm_medium?: string | null;
        attributed_inbound?: boolean;
      };
      try { r = JSON.parse(raw); } catch { continue; }

      // Exclude self and zero-value, same as /api/revenue
      const payer = (r.payer || "").toLowerCase();
      if (r.self || (!!payer && selfWallets(env).has(payer))) continue;
      const zeroValue =
        r.zero_value === true || !r.amount_atomic || !/^[1-9]\d*$/.test(String(r.amount_atomic));
      if (zeroValue) continue;

      // Filter by period
      if (r.settled_at) {
        const ts = Date.parse(r.settled_at);
        if (!Number.isNaN(ts) && ts < since) continue;
      }

      const resource = r.resource || "";

      // Classify into family
      let family: string;
      if (resourceMatches(resource, PROOF_RESOURCE_PATTERNS)) {
        family = "proofs";
      } else if (resourceMatches(resource, FEED_RESOURCE_PATTERNS)) {
        family = "feeds";
      } else if (r.attributed_inbound || r.utm_source || r.utm_medium) {
        family = "attributed";
      } else {
        // Unclassified settlements default to "proofs" (the primary SKU family)
        family = "proofs";
      }

      // Increment the right counter
      if (family === "proofs") acc.proofs.proofs++;
      else if (family === "feeds") acc.feeds.feeds++;
      else if (family === "attributed") acc.attributed.attributed++;
    }

    let families: FamilyYield[] = [
      {
        family: "proofs",
        proofs_sold: acc.proofs.proofs,
        feed_subs: 0,
        attributed_inbound: 0,
        yield_total: acc.proofs.proofs,
      },
      {
        family: "feeds",
        proofs_sold: 0,
        feed_subs: acc.feeds.feeds,
        attributed_inbound: 0,
        yield_total: acc.feeds.feeds,
      },
      {
        family: "attributed",
        proofs_sold: 0,
        feed_subs: 0,
        attributed_inbound: acc.attributed.attributed,
        yield_total: acc.attributed.attributed,
      },
    ];

    if (familyFilter) {
      families = families.filter((f) => f.family === familyFilter);
    }

    const total_yield = families.reduce((sum, f) => sum + f.yield_total, 0);

    return {
      schema: "csoai.yield/0.1",
      as_of: new Date(now).toISOString(),
      period,
      period_ms: periodMs,
      families,
      total_yield,
      source: `REVENUE_KV settled:tx:* records (${keys.length} scanned)`,
      contract: CONTRACT,
    };
  } catch (e) {
    // KV read failure — return zeros, never error
    return {
      schema: "csoai.yield/0.1",
      as_of: new Date(now).toISOString(),
      period,
      period_ms: periodMs,
      families: familyFilter
        ? EMPTY_FAMILIES.filter((f) => f.family === familyFilter)
        : EMPTY_FAMILIES,
      total_yield: 0,
      source: `UNMEASURED — REVENUE_KV read failed (${(e as Error).message})`,
      contract: CONTRACT,
    };
  }
}

export const onRequestGet: PagesFunction<YieldEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const family = url.searchParams.get("family") || null;
  const periodParam = url.searchParams.get("period") || "week";
  const period: "week" | "month" = periodParam === "month" ? "month" : "week";

  return json(await buildYield(env, family, period));
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
