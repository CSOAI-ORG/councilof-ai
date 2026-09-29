/**
 * GET /api/wrapper/index.json — every asset on the wrapped-asset roster and in the per-deployment
 * archives, keyed by CAIP-19, with the lookup URL for each. The sides that have no CAIP-19 id (a fund
 * register, bank deposits) are listed separately with the reason, never dropped.
 *
 * Free and read-only; built from files this site already publishes; no chain read, no price.
 */
import { headFromGet } from "../_head";
import { CANDIDATE_BATCH, FREE_NOTE, INDEX_SCHEMA, LOOKUP_PREFIX, METHOD, NAME, NOT, PUBLIC_LEDGER, chainTable, index, json } from "./_caip19";

export async function onRequestGet(): Promise<Response> {
  const { assets, unkeyed } = index();
  const pairs = new Set(assets.flatMap((a) => a.pairs.map((p) => p.pair)));
  for (const u of unkeyed) pairs.add(u.pair);
  return json({
    schema: INDEX_SCHEMA,
    name: NAME,
    description: "Wrapped-asset measurements keyed by CAIP-19 asset id: which roster pairs an asset belongs to, the state each carries in the published parity ledger, and where its per-deployment archive is.",
    lookup: `${LOOKUP_PREFIX}{caip19}`,
    public_ledger: PUBLIC_LEDGER,
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

export const onRequestHead = headFromGet(onRequestGet);
