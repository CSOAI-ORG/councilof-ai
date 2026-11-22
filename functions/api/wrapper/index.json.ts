/**
 * GET /api/wrapper/index.json — every asset on the wrapped-asset roster and in the per-deployment
 * archives, keyed by CAIP-19, with the lookup URL for each. The sides that have no CAIP-19 id (a fund
 * register, bank deposits) are listed separately with the reason, never dropped.
 *
 * Free and read-only; built from files this site already publishes; no chain read, no price.
 */
import { headFromGet } from "../_head";
import { CANDIDATE_BATCH, FREE_NOTE, INDEX_SCHEMA, LOOKUP_PREFIX, METHOD, NAME, NOT, PUBLIC_LEDGER, chainTable, index, json, publicStates } from "./_caip19";

type IndexCtx = { request?: Request; env?: Parameters<typeof publicStates>[0] };

/**
 * When the published parity ledger was read: its own `as_of` and how many roster pairs carry a record
 * in it. The roster count above is a static list; this is the only dated read behind "pairs read",
 * so a surface that prints that figure cites this date, never the serve time. Absent binding or
 * file -> `as_of` null and `pairs_with_a_record` 0; nothing is invented.
 */
async function publicLedgerRead(ctx?: IndexCtx) {
  const states = ctx?.env && ctx.request ? await publicStates(ctx.env, ctx.request.url) : new Map();
  const asOf = [...states.values()].map((r) => r.as_of).find((v): v is string => typeof v === "string" && v.length > 0) ?? null;
  return {
    ledger: PUBLIC_LEDGER,
    as_of: asOf,
    as_of_field: "as_of in the ledger file",
    pairs_with_a_record: states.size,
    note: "The ledger's own as_of, not the time this index was served. A pair with no record there has no read behind it.",
  };
}

export async function onRequestGet(ctx?: IndexCtx): Promise<Response> {
  const { assets, unkeyed } = index();
  const pairs = new Set(assets.flatMap((a) => a.pairs.map((p) => p.pair)));
  for (const u of unkeyed) pairs.add(u.pair);
  const public_ledger_read = await publicLedgerRead(ctx);
  return json({
    schema: INDEX_SCHEMA,
    name: NAME,
    description: "Wrapped-asset measurements keyed by CAIP-19 asset id: which roster pairs an asset belongs to, the state each carries in the published parity ledger, and where its per-deployment archive is.",
    lookup: `${LOOKUP_PREFIX}{caip19}`,
    public_ledger: PUBLIC_LEDGER,
    public_ledger_read,
    preview: "/api/wrapper?id={pair}&preview=1",
    caip2: chainTable(),
    counts: {
      assets: assets.length,
      pairs: pairs.size,
      assets_with_archive: assets.filter((a) => a.archive).length,
      unkeyed_sides: unkeyed.length,
    },
    assets,
    unkeyed,
    candidate_batch: CANDIDATE_BATCH,
    method: METHOD,
    free: FREE_NOTE,
    not: NOT,
  });
}

export const onRequestHead = headFromGet<{ request: Request; env?: IndexCtx["env"] }>(onRequestGet);
