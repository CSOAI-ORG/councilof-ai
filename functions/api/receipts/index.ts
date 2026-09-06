/**
 * GET /api/receipts?payer=<wallet> — the settlement receipt register.
 *
 * Reads REVENUE_KV after the recordSettlement() writer (functions/api/_x402.ts):
 *   settled:tx:<tx> → one SettlementRecord (append-only)
 * Returns the matching records (all if no ?payer=) + derived honest counts.
 * THE RULES (same as /api/revenue, never weaker):
 *   · No count is 0 unless the store is bound and empty; null means unmeasured.
 *   · A SETTLEMENT OF ZERO IS NOT A PURCHASE — zero_value records are listed but
 *     are never counted as buyers.
 *   · Self settlements (estate paying itself) are never revenue — listed, counted apart.
 *   · The deliver outcome (DELIVERED/REFUSED) lives in the census corpus
 *     (docs/product/x402-settlement-census-*.jsonl), not in this record; this surface
 *     says "in census corpus" and never guesses it.
 *   · ?preview=1 = no records, only counts (cheap probe).
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = (env as { REVENUE_KV?: KVNamespace }).REVENUE_KV;
  const url = new URL(request.url);
  const payer = url.searchParams.get("payer")?.toLowerCase() ?? null;
  const preview = url.searchParams.get("preview") === "1";

  if (!kv) {
    return Response.json({
      schema: "csoai.receipts/0.1",
      status: "UNMEASURED",
      count: null,
      items: [],
      note: "no REVENUE_KV bound — no settlement record is recorded, so nothing is listed",
    });
  }

  try {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await kv.list({ prefix: "settled:tx:", cursor, limit: 1000 });
      for (const k of page.keys) keys.push(k.name);
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor && keys.length < 5000);

    const items: Record<string, unknown>[] = [];
    let unreadable = 0;
    let selfCount = 0;
    let zeroCount = 0;
    for (const name of keys) {
      const raw = await kv.get(name);
      if (!raw) { unreadable++; continue; }
      let r: Record<string, unknown>;
      try { r = JSON.parse(raw) as Record<string, unknown>; } catch { unreadable++; continue; }
      const recPayer = typeof r.payer === "string" ? r.payer.toLowerCase() : null;
      if (payer && recPayer !== payer) continue;
      if (r.self === true) selfCount++;
      if (r.zero_value === true) zeroCount++;
      items.push({
        transaction: r.transaction ?? null,
        payer: r.payer ?? null,
        self: r.self === true,
        zero_value: r.zero_value === true,
        amount_atomic: r.amount_atomic ?? null,
        resource: r.resource ?? null,
        settled_at: r.settled_at ?? null,
        deliver: "in census corpus (docs/product/x402-settlement-census-*.jsonl)",
      });
    }
    items.sort((a, b) => String(a.settled_at ?? "").localeCompare(String(b.settled_at ?? "")));

    const nonSelfBought = items.filter(
      (i) => i.self !== true && i.zero_value !== true,
    );
    const distinctNonSelf = new Set(nonSelfBought.map((i) => String(i.payer ?? "").toLowerCase())).size;

    return Response.json({
      schema: "csoai.receipts/0.1",
      status: "MEASURED",
      count: items.length,
      distinct_nonself_payers: distinctNonSelf,
      self_settlements: selfCount,
      zero_value_settlements: zeroCount,
      preview: preview,
      items: preview ? [] : items,
      note: "counts derive from settled:tx:* records; zero-value and self settlements are listed but are never buyers",
    });
  } catch {
    return Response.json({
      schema: "csoai.receipts/0.1",
      status: "UNMEASURED",
      count: null,
      items: [],
      note: "REVENUE_KV read failed — count stays null, never substituted",
    });
  }
};
