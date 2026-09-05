/**
 * GET /api/revenue — the three-SKU revenue instrumentation (EXEC-A-REVENUE.md §5).
 *
 * Reads the revenue counters straight out of counters.json (the counter canon) and, WHERE A
 * store is bound, the live KV/D1 tallies. It follows the same honesty doctrine as /api/counters
 * and /api/state:
 *   · No new Date() — nothing here follows the clock.
 *   · A count is null, NEVER 0, when there is no source. 0 asserts a measured zero; there is no
 *     live settle path until a facilitator is provisioned; the rail state is READ from
 *     railMode(env) rather than asserted here — in contract.null_rule AND in every SKU note —
 *     so every SKU count is honestly null until a receipt actually settles.
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
  // Read by railMode(env) — the ONLY way this surface learns the rail state. Never typed here.
  X402_PAY_TO?: string;
  X402_FACILITATOR_URL?: string;
};

// The rail clause of every SKU note is DERIVED from env, never copied from counters.json.
// The canon note for SKU-1 used to carry "No live settle path (x402 is fail-closed, mode:mock)"
// as typed text. contract.null_rule below was already reading railMode(env) — so after the
// facilitator was provisioned (2026-09-03) this endpoint said "live" in one field and "mock" in
// another, on the same payload, about money. Same defect, second field. A note about the rail
// reads itself off railMode(env); counters.json keeps the doctrine and nothing about the env.
function withRailState(env: Env, canonNote: string | undefined): string {
  const r = railMode(env);
  const rail = r.facilitator_configured
    ? `x402 rail: ${r.mode} — a facilitator is provisioned, so a settled receipt can be counted; this count stays null until one settles.`
    : `x402 rail: ${r.mode} — no facilitator is provisioned, so no receipt can settle and this count is honestly null.`;
  return [(canonNote || "").trim(), rail].filter(Boolean).join(" ");
}

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
    note: withRailState(env, c.note),
  };
}

/**
 * THE ONE NUMBER — distinct wallets that are not ours and paid. Every outside read of this estate
 * on 2026-09-05 converged on it as the only figure that decides the next move. Derived from the
 * settlement records recordSettlement() writes (functions/api/_x402.ts), never from the tally:
 * a record names the payer, the tally does not. Null, never 0, when no store is bound. Zero is a
 * real zero only when the store is bound and holds no non-self record.
 */
async function oneNumber(env: Env): Promise<Record<string, unknown>> {
  const kv = env.REVENUE_KV;
  const base = {
    id: "distinct_nonself_payers",
    definition:
      "Count of distinct payer wallets, excluding payTo and X402_SELF_WALLETS, across facilitator-confirmed " +
      "settlements THAT MOVED A NON-ZERO AMOUNT. A wallet we control paying us is recorded but is neither " +
      "revenue nor a buyer, and neither is a wallet that paid nothing: a settlement of zero is not a purchase.",
  };
  if (!kv) {
    return { ...base, status: "UNMEASURED", all_time: null, last_30d: null, settlements: null, self_settlements: null,
      source: "no REVENUE_KV bound — nothing is recorded, so nothing is counted" };
  }
  try {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await kv.list({ prefix: "settled:tx:", cursor, limit: 1000 });
      for (const k of page.keys) keys.push(k.name);
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor && keys.length < 5000);
    const since = Date.now() - 30 * 24 * 3600 * 1000;
    const all = new Set<string>();
    const recent = new Set<string>();
    let settlements = 0;
    let selfSettlements = 0;
    let zeroValueSettlements = 0;
    let unreadable = 0;
    for (const name of keys) {
      const raw = await kv.get(name);
      if (!raw) { unreadable++; continue; }
      let r: { payer?: string | null; self?: boolean; settled_at?: string; zero_value?: boolean; amount_atomic?: string | null };
      try { r = JSON.parse(raw); } catch { unreadable++; continue; }
      if (r.self) { selfSettlements++; continue; }
      // A SETTLEMENT OF ZERO IS NOT A PURCHASE. Measured 2026-09-05: one zero-value settle through
      // /api/free-door, signed by an EPHEMERAL wallet created in a probe, moved all_time from 0 to
      // 1 — a wallet we created and controlled, paying nothing, counted as a distinct non-self
      // BUYER. That contradicts this number's own definition and is enough to trip its own gate,
      // "≥1 repeat: open the next door", on our own test traffic.
      //
      // `self` cannot catch it: that tests membership of X402_SELF_WALLETS, and a seed or probe
      // signs from a throwaway key no list can enumerate in advance. Amount is the only test that
      // holds for a wallet nobody can name beforehand.
      //
      // amount_atomic is read as a FALLBACK because records written before _x402.ts carried
      // `zero_value` have no such field — including the one that produced the 1. Reading only the
      // flag would have left the live number wrong for exactly the record that revealed the bug.
      // An absent or non-numeric amount counts as zero: it is not evidence of a purchase, and for
      // a revenue figure the honest direction is to decline the claim, not to assume it.
      const zeroValue =
        r.zero_value === true || !r.amount_atomic || !/^[1-9]\d*$/.test(String(r.amount_atomic));
      if (zeroValue) { zeroValueSettlements++; continue; }
      settlements++;
      const payer = (r.payer || "").toLowerCase();
      if (!payer) continue;
      all.add(payer);
      if (r.settled_at && Date.parse(r.settled_at) >= since) recent.add(payer);
    }
    return { ...base, status: "MEASURED", all_time: all.size, last_30d: recent.size, settlements, self_settlements: selfSettlements,
      // Reported, never silently dropped: a reader can see that records exist and why they are
      // not buyers. settlements counts only non-self settlements that moved a non-zero amount.
      zero_value_settlements: zeroValueSettlements,
      zero_value_note:
        "Non-self settlements that moved 0, or carried no readable amount. Recorded for audit, " +
        "never counted as a payer — paying nothing does not make a buyer. Seeds and probes land here.",
      records_unreadable: unreadable, source: "REVENUE_KV settled:tx:* records",
      gates: { "0 for 30 days": "shape or price is wrong; do not add doors", "≥1 repeat": "open the next door", "≥5 distinct in 30d": "it is a product" } };
  } catch (e) {
    return { ...base, status: "UNMEASURED", all_time: null, last_30d: null, settlements: null, self_settlements: null,
      source: `REVENUE_KV read failed (${(e as Error).message}) — count stays null, never substituted` };
  }
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

  const [issuances, proofs, licences, settled, one_number] = await Promise.all([
    metric(env, "revenue_issuances", "count:issuances"),
    metric(env, "revenue_proofs", "count:proofs"),
    metric(env, "revenue_licences", "count:licences"),
    metric(env, "revenue_settled_usdc", "settled:usdc_atomic"),
    oneNumber(env),
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
    settled_usdc: { ...settled, unit: "USDC atomic (6dp) on Base", excludes_self: true },
    one_number,
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
