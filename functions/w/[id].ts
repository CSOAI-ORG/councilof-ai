/**
 * GET /w/<ledger id> — the short evidence link a wallet token list carries.
 *
 * public/wallet/measured-wrappers.tokenlist.json puts it in each token's extensions.evidence. The
 * token-list schema caps extension strings at 42 characters, so the link has to be this short:
 * https://councilof.ai/w/usdc:zksync-era is the longest id and fits.
 *
 * It answers with the ledger record VERBATIM from the free public ledger
 * (/interop/wrapped-asset-parity-latest.json), where that ledger came from, the other records on the
 * same contract, and the free live preview for the same contract. It reads no chain, takes no payment
 * and makes no new determination. A record is not a rating, a recommendation or an endorsement.
 */
import { headFromGet } from "../api/_head";
import LEDGER from "../../public/interop/wrapped-asset-parity-latest.json";

type Rec = { id: string; state: string; wrapped: { chain: string; chainId: number; address: string; symbol: string } } & Record<string, unknown>;
type Ledger = { as_of: string; states: Record<string, string>; records: Rec[]; license?: string };

export const L = LEDGER as unknown as Ledger;
export const SCHEMA = "csoai.wrapper-evidence/0.1";
export const PATH_PREFIX = "/w/";
export const datedLedgerPath = (asOf: string) => `/interop/wrapped-asset-parity-${asOf.slice(0, 10)}.json`;
export const caip19Of = (r: Rec) => `eip155:${r.wrapped.chainId}/erc20:${r.wrapped.address}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = decodeURIComponent(url.pathname.slice(PATH_PREFIX.length)).replace(/\/+$/, "").trim().toLowerCase();
  const rec = L.records.find((r) => r.id === id);
  if (!rec) {
    return json({ schema: SCHEMA, error: "not_found", reason: `${id || "<id>"} is not a record in the wrapped-asset ledger.`, known_ids: L.records.map((r) => r.id), ledger: `${origin}/interop/wrapped-asset-parity-latest.json` }, 404);
  }
  const dated = datedLedgerPath(L.as_of);
  const same = L.records.filter((r) => r.id !== rec.id && r.wrapped.chainId === rec.wrapped.chainId && r.wrapped.address.toLowerCase() === rec.wrapped.address.toLowerCase()).map((r) => r.id);
  return json({
    schema: SCHEMA,
    id: rec.id,
    state: rec.state,
    as_of: L.as_of,
    state_definition: L.states[rec.state] ?? null,
    caip19: caip19Of(rec),
    same_contract_records: same,
    record: rec,
    ledger: { url: `${origin}${dated}`, ots: `${origin}${dated}.ots`, latest: `${origin}/interop/wrapped-asset-parity-latest.json`, as_of: L.as_of, license: L.license ?? null },
    live_preview: `${origin}/api/wrapper/caip19/${caip19Of(rec)}`,
    token_list: `${origin}/wallet/measured-wrappers.tokenlist.json`,
    note: "The ledger record as published: what was read at the pinned blocks it names. Not a rating, a recommendation or an endorsement.",
  });
};

export const onRequestHead = headFromGet(onRequestGet);
