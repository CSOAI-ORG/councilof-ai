/**
 * GET /api/wrapper/caip19/<CAIP-19 id> — the wrapped-asset roster looked up by standard asset id, so a
 * wallet or explorer can ask about the token it is showing without knowing our pair names.
 *
 *   /api/wrapper/caip19/eip155:42161/erc20:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8
 *   /api/wrapper/caip19/eip155%3A42161%2Ferc20%3A0xFF97...   (encoded; case-insensitive for erc20)
 *   /api/wrapper/caip19?id=<CAIP-19 id>
 *
 * 200 — every roster pair the asset is a side of (wrapped or canonical), its counterpart's CAIP-19, the
 *       state it carries in the already-published parity ledger, and links to the existing /api/wrapper
 *       door (free preview; the paid read stays that door's) and to the asset's per-deployment archive.
 * 404 — a valid CAIP-19 id that is not on the roster or in the archives (nothing is inferred about it).
 * 400 — not a CAIP-19 id.
 *
 * Free and read-only. No chain read, no payment path, no price. A listing is not an endorsement.
 */
import { headFromGet } from "../../_head";
import {
  CANDIDATE_BATCH,
  FREE_NOTE,
  LOOKUP_SCHEMA,
  METHOD,
  NAME,
  NOT,
  json,
  lookup,
  normalizeCaip19,
  publicStates,
} from "../_caip19";

type Env = { ASSETS?: { fetch: (r: Request | string) => Promise<Response> } };
type Ctx = { request: Request; env: Env; params: { id?: string | string[] } };

function rawId(request: Request, params: Ctx["params"]): string {
  const segs = params?.id === undefined ? [] : Array.isArray(params.id) ? params.id : [params.id];
  let raw = segs.join("/");
  if (!raw) raw = new URL(request.url).searchParams.get("id") ?? "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function onRequestGet({ request, env, params }: Ctx): Promise<Response> {
  const raw = rawId(request, params);
  if (!raw) {
    return json({ error: "bad_request", message: "Give a CAIP-19 asset id, e.g. /api/wrapper/caip19/eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", index: "/api/wrapper/index.json" }, 400);
  }
  const id = normalizeCaip19(raw);
  if (!id) {
    return json({ error: "bad_request", message: "Not a CAIP-19 asset id (chain_id/asset_namespace:asset_reference).", received: raw.slice(0, 200), index: "/api/wrapper/index.json" }, 400);
  }
  const entry = lookup(id);
  if (!entry) {
    return json({ schema: LOOKUP_SCHEMA, name: NAME, caip19: id, found: false, message: "Not on the wrapped-asset roster or in the per-deployment archives. Nothing is inferred about an asset that is not listed.", index: "/api/wrapper/index.json" }, 404);
  }
  const states = await publicStates(env, request.url);
  return json({
    schema: LOOKUP_SCHEMA,
    name: NAME,
    caip19: entry.caip19,
    caip2: entry.caip2,
    chain: entry.chain,
    symbol: entry.symbol,
    address: entry.address,
    found: true,
    pairs: entry.pairs.map((p) => ({ ...p, public_record: states.get(p.pair) ?? null })),
    archive: entry.archive,
    candidate_batch: CANDIDATE_BATCH,
    method: METHOD,
    free: FREE_NOTE,
    not: NOT,
  });
}

export const onRequestHead = headFromGet(onRequestGet);
