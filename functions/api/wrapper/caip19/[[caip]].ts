/**
 * GET /api/wrapper/caip19/<CAIP-19> — the FREE preview for one token contract, addressed the way a
 * wallet addresses it: eip155:<chainId>/erc20:<address>. Built for the transaction-insight Snap
 * (packages/sovx-wrapped-asset-insight-snap) and anything else that holds a CAIP-19 rather than a roster id.
 *
 * Same reader as /api/wrapper?id=…&preview=1 (functions/api/wrapper.ts): ordered keyless RPCs, a
 * finalized block per chain whose hash a second operator confirmed, the unsigned preview card. Every
 * roster record on that contract is read (one contract can carry two records, e.g. a token renamed
 * in place); chains are pinned once per request.
 *
 *   200  every record's state and as_of, the preview card, the short evidence link, and the state the
 *        free public ledger last published. UNMEASURED is a 200 like any other state.
 *   404  the contract is not on the roster: no wrapped-asset measurement is on record for it.
 *   400  not an eip155 erc20 CAIP-19.
 *
 * Never 402: nothing is sold here. The signed card stays on /api/wrapper. A state is not a rating, a
 * recommendation or an endorsement.
 */
import { headFromGet } from "../../_head";
import { ROSTER, CHAINS, buildPayload, previewCardFor, type PinMemo, type RosterEntry } from "../../wrapper";
import LEDGER from "../../../../public/interop/wrapped-asset-parity-latest.json";

export const SCHEMA = "csoai.wrapper-caip19/0.1";
export const PATH_PREFIX = "/api/wrapper/caip19/";
export const NAME = "SovX wrapped-asset measurements";
const CAIP19_RE = /^eip155:([1-9]\d{0,11})\/erc20:(0x[0-9a-fA-F]{40})$/;

type LedgerRec = { id: string; state: string };
const L = LEDGER as unknown as { as_of: string; records: LedgerRec[] };

export function parseCaip19(s: string): { chainId: number; address: string } | null {
  const m = CAIP19_RE.exec(s.trim());
  return m ? { chainId: Number(m[1]), address: m[2] } : null;
}

export const caip19Of = (e: RosterEntry) => `eip155:${CHAINS[e.wrapped.chain].chainId}/erc20:${e.wrapped.address}`;

export function recordsFor(chainId: number, address: string): RosterEntry[] {
  const a = address.toLowerCase();
  return ROSTER.filter((e) => CHAINS[e.wrapped.chain]?.chainId === chainId && e.wrapped.address.toLowerCase() === a);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60", "access-control-allow-origin": "*" },
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const raw = decodeURIComponent(url.pathname.slice(PATH_PREFIX.length)).replace(/\/+$/, "");
  const parsed = parseCaip19(raw);
  if (!parsed) {
    return json({ schema: SCHEMA, error: "bad_request", reason: "expected a CAIP-19 of the form eip155:<chainId>/erc20:<0x address>", example: `${origin}${PATH_PREFIX}eip155:42161/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8`, payment: { requested: false } }, 400);
  }
  const entries = recordsFor(parsed.chainId, parsed.address);
  if (!entries.length) {
    return json({
      schema: SCHEMA,
      error: "not_on_roster",
      caip19: raw,
      reason: "No wrapped-asset measurement is on record for this contract.",
      roster: ROSTER.map(caip19Of),
      token_list: `${origin}/wallet/measured-wrappers.tokenlist.json`,
      payment: { requested: false },
    }, 404);
  }
  const memo: PinMemo = new Map();
  const built = await Promise.all(entries.map(async (entry) => ({ entry, built: await buildPayload(entry, memo) })));
  const records = await Promise.all(
    built.map(async ({ entry, built: b }) => {
      const published = L.records.find((r) => r.id === entry.id);
      return {
        id: entry.id,
        state: String(b.payload.state),
        as_of: b.fetched_at,
        evidence: `${origin}/w/${entry.id}`,
        published: published ? { state: published.state, as_of: L.as_of, ledger: `${origin}/interop/wrapped-asset-parity-latest.json` } : null,
        card: await previewCardFor(entry, b),
      };
    }),
  );
  const states = [...new Set(records.map((r) => r.state))];
  return json({
    schema: SCHEMA,
    kind: "preview",
    free: true,
    name: NAME,
    caip19: caip19Of(entries[0]),
    state: states.length === 1 ? states[0] : null,
    states,
    as_of: records.map((r) => r.as_of).sort().at(-1),
    records,
    note: "A state names what was read at a pinned block. It is not a rating, a recommendation or an endorsement.",
    token_list: `${origin}/wallet/measured-wrappers.tokenlist.json`,
    signed_card: `${origin}/api/wrapper?id=<record id>`,
    payment: { requested: false },
  });
};

export const onRequestHead = headFromGet(onRequestGet);
