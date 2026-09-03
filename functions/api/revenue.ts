/**
 * GET /api/revenue — the three-SKU revenue instrumentation (EXEC-A-REVENUE.md §5).
 *
 * Reads the revenue counters straight out of counters.json (the counter canon) and, WHERE A
 * store is bound, the live KV/D1 tallies. It follows the same honesty doctrine as /api/counters
 * and /api/state:
 *   · No new Date() — nothing here follows the clock.
 *   · A count is null, NEVER 0, when there is no source. 0 asserts a measured zero; there is no
 *     live settle path until a facilitator is provisioned; the rail state is READ from
 *     railMode(env) rather than asserted here, so every SKU count
 *     is honestly null until a receipt actually settles.
 *   · The north-of-truth number is settled_usdc — USDC that cleared to the estate pay_to on Base.
 *     Bytes/chain adjudicate revenue, not intent and not a CRM.
 *   · NO PRICES. This surface never imports _skus price atoms — doctrine forbids a public price,
 *     and the metered amount belongs only in an x402 402 challenge, never on a reporting surface.
 *
 * PROVISIONING (owner): bind a KV namespace (e.g. REVENUE_KV) for the replay/tally store and a
 * D1/licence registry; set REVENUE_KEY to gate the surface. Until then the counts read from the
 * canon (all null) and the surface reports UNMEASURED, which is the honest state of a rail that
 * has not yet taken money.
 */
import countersDoc from "../../counters.json";
import { railMode } from "./_x402_config";

type CanonCounter = {
  value: string | number | null;
  status: string;
  phrasing: string;
  evidence: string;
  owner: string;
  note?: string;
};

type Env = {
  // Optional KV store holding live tallies + the settled-receipt replay set. Absent ⇒ canon-only.
  REVENUE_KV?: KVNamespace;
  // Optional gate. When set, the caller must present ?key= or an x-revenue-key header that matches.
  REVENUE_KEY?: string;
};

const canon = (countersDoc as { counters: Record<string, CanonCounter> }).counters;

// Pull one revenue metric: prefer a live KV tally if bound, else the canon value (null).
async function metric(
  env: Env,
  canonKey: string,
  kvKey: string,
): Promise<{ id: string; count: number | null; status: string; source: string; owner: string; note: string }> {
  const c = canon[canonKey] || ({} as CanonCounter);
  let count: number | null = null;
  let source = "counters.json";
  let status = c.status || "UNMEASURED";
  if (env.REVENUE_KV) {
    try {
      const raw = await env.REVENUE_KV.get(kvKey);
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n)) {
          count = n;
          source = "REVENUE_KV";
          status = "MEASURED";
        }
      }
    } catch {
      // A KV read failure is not a zero. Leave count null and say the source could not be read.
      source = "REVENUE_KV (read failed — count stays null, never substituted)";
    }
  }
  // The canon value is a string; only adopt it when KV gave us nothing AND it is a real number.
  if (count == null && c.value != null) {
    const n = Number(c.value);
    if (Number.isFinite(n)) count = n;
  }
  return {
    id: canonKey,
    count,
    status: count != null ? status : "UNMEASURED",
    source,
    owner: c.owner || "Revenue",
    note: c.note || "",
  };
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // Soft gate: only enforced when the owner has set REVENUE_KEY. No key configured ⇒ the surface
  // carries nothing sensitive (all counts null, no prices), so it serves the canon read-through.
  if (env.REVENUE_KEY) {
    const url = new URL(request.url);
    const presented = url.searchParams.get("key") || request.headers.get("x-revenue-key") || "";
    if (presented !== env.REVENUE_KEY) {
      return json(
        {
          schema: "csoai.revenue/0.1",
          error: "unauthorized",
          reason: "This surface is gated (REVENUE_KEY set). Present ?key= or x-revenue-key.",
        },
        401,
      );
    }
  }

  const [issuances, proofs, licences, settled] = await Promise.all([
    metric(env, "revenue_issuances", "count:issuances"),
    metric(env, "revenue_proofs", "count:proofs"),
    metric(env, "revenue_licences", "count:licences"),
    metric(env, "revenue_settled_usdc", "settled:usdc_atomic"),
  ]);

  return json({
    schema: "csoai.revenue/0.1",
    contract: {
      derivation:
        "Counts read from counters.json (the counter canon) and, where bound, the REVENUE_KV " +
        "tallies. Nothing is fetched over HTTP and no count is typed by hand.",
      // DERIVED, never asserted. This sentence used to hardcode "x402 fail-closed, manifest
      // mode:mock". The facilitator was provisioned on 2026-09-03 and /.well-known/x402.json
      // began reporting mode:live from railMode(env) — while this endpoint went on telling the
      // public the rail was mock. Two neighbouring surfaces contradicting each other, and the
      // stale one was the surface about money. The counts stay null either way; only the reason
      // was wrong, which is exactly the kind of claim that has to read itself off the env.
      null_rule:
        `A count is null, never 0, when there is no source. The x402 rail is currently ` +
        `${railMode(env).mode}` +
        (railMode(env).facilitator_configured
          ? ` — a facilitator is provisioned, so a settled receipt can be counted; every count stays null until one settles.`
          : ` — no facilitator is provisioned, so no receipt can settle and every count is honestly null.`),
      north_of_truth:
        "settled_usdc is the honest revenue number: USDC that cleared to the estate pay_to on " +
        "Base, single-use. Chain adjudicates, not the CRM.",
      no_prices:
        "This surface never publishes a price. Metered amounts appear only in an x402 402 " +
        "challenge (the accepts array), never here and never on the free board.",
      not_a_grade: "Revenue is earned on issuance, assembly, and a durable signature — never a grade.",
    },
    skus: {
      issuance: { sku: "SKU-1", ...issuances },
      proofs: { sku: "SKU-2", ...proofs },
      licences: { sku: "SKU-3", ...licences },
    },
    settled_usdc: { ...settled, unit: "USDC atomic (6dp) on Base" },
    provisioning: {
      kv_bound: !!env.REVENUE_KV,
      gated: !!env.REVENUE_KEY,
      owner_switches: [
        "bind REVENUE_KV (replay + tally store)",
        "set X402_PAY_TO + choose facilitator (turns the rail live; see functions/api/_x402.ts)",
      ],
    },
    note: "Aggregate-only. NO telemetry, NO per-user data, NO fabricated counts. Measurement, never certification.",
  });
};
