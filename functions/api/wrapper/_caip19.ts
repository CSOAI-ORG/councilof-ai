/**
 * The wrapped-asset roster keyed by CAIP-19 — shared by GET /api/wrapper/caip19/<id> and
 * GET /api/wrapper/index.json. Free, read-only, and it performs NO chain read: it maps ids to the
 * records this site already publishes (the wrapper roster, the public parity ledger, the per-deployment
 * archives) and points at the existing /api/wrapper door for a fresh read.
 *
 * CAIP-2 / SLIP-44 table: ./_caip2.json — the same file scripts/readers/wrapper-caip-ledger.mjs reads,
 * so the lookup and the candidate ledger can never key one asset two ways. ERC-20 references are
 * lower-cased; a side off any public ledger (fund register, bank deposits) has no id and says why.
 */
import CAIP2 from "./_caip2.json";
import ARCHIVE from "./_caip_archive.json";
import DOORS from "../_wrapper_asset_doors.json";
import { WRAPPER_ROSTER } from "../_wrapper_roster";

export const INDEX_SCHEMA = "csoai.wrapper-caip19-index/0.1";
export const LOOKUP_SCHEMA = "csoai.wrapper-caip19-lookup/0.1";
export const NAME = "SovX wrapped-asset measurements";
export const PUBLIC_LEDGER = "/interop/wrapped-asset-parity-latest.json";
export const LOOKUP_PREFIX = "/api/wrapper/caip19/";
export const METHOD = "measurement/wrapper-caip19-ledger-method.md";

export const NOT = [
  "not a rate, grade, score or ranking",
  "not a certificate, attestation, audit or proof of reserve",
  "not legal evidence and not a statutory verification",
  "no reserve adequacy, no solvency, no redemption or safety claim",
  "a listing is not an endorsement",
] as const;

/** The five-state vocabulary of the CAIP-19 ledger. Its first batch is staged unsigned and HELD. */
export const CANDIDATE_STATES = ["CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "UNMEASURED"] as const;

type ChainRow = { caip2: string | null; native: string | null; native_symbol: string | null; why_null?: string };
type Side = { chain: string; symbol: string; address: string };
type RosterRow = { id: string; wrapped: Side; canonical: Side; backing_model: string; escrow?: string | null; escrow_name?: string | null; note?: string };
type ArchiveRow = { caip19: string; caip2: string; chain: string; symbol: string; address: string; archive: string };

const CHAINS = (CAIP2 as { chains: Record<string, ChainRow> }).chains;
const ROSTER = WRAPPER_ROSTER as unknown as RosterRow[];
const ARCHIVE_ROWS = (ARCHIVE as { rows: ArchiveRow[] }).rows;
const ASSET_DOORS = (DOORS as { doors: { asset: string; symbol: string }[] }).doors;

export type Keyed = { caip2: string | null; caip19: string | null; why_null?: string };

export function caip2Of(chain: string): string | null {
  return CHAINS[chain]?.caip2 ?? null;
}

/** CAIP-19 of one roster side, or null with the reason. */
export function caip19Of(side: Side): Keyed {
  const c = CHAINS[side.chain];
  if (!c) return { caip2: null, caip19: null, why_null: `chain "${side.chain}" has no CAIP-2 entry` };
  if (!c.caip2) return { caip2: null, caip19: null, why_null: c.why_null };
  if (c.caip2.startsWith("eip155:") && /^0x[0-9a-fA-F]{40}$/.test(side.address || ""))
    return { caip2: c.caip2, caip19: `${c.caip2}/erc20:${side.address.toLowerCase()}` };
  if (c.native && side.symbol === c.native_symbol) return { caip2: c.caip2, caip19: `${c.caip2}/${c.native}` };
  return { caip2: c.caip2, caip19: null, why_null: `"${side.address}" is not a token contract on ${side.chain}` };
}

// CAIP-19: chain_id "/" asset_namespace ":" asset_reference ["/" token_id]
const CAIP19_RE = /^([-a-z0-9]{3,8}):([-_a-zA-Z0-9]{1,32})\/([-a-z0-9]{3,8}):([-.%a-zA-Z0-9]{1,128})(\/[-.%a-zA-Z0-9]{1,78})?$/;

/** Validate and normalise a CAIP-19 id (erc20 references lower-cased). null when it is not CAIP-19. */
export function normalizeCaip19(input: string): string | null {
  const s = (input || "").trim();
  const m = CAIP19_RE.exec(s);
  if (!m) return null;
  const [, ns, ref, assetNs, assetRef, tokenId = ""] = m;
  if (ns === "eip155" && assetNs === "erc20") {
    if (!/^0x[0-9a-fA-F]{40}$/.test(assetRef)) return null;
    return `${ns}:${ref}/${assetNs}:${assetRef.toLowerCase()}${tokenId}`;
  }
  return s;
}

export type PairRef = {
  pair: string;
  side: "wrapped" | "canonical";
  mechanism: string;
  counterpart: { chain: string; symbol: string; caip19: string | null; why_null?: string };
  escrow: string | null;
  escrow_name: string | null;
  note: string | null;
  preview: string;
  door: string;
  asset_door: string | null;
};

export type IndexEntry = {
  caip19: string;
  caip2: string;
  chain: string;
  symbol: string;
  address: string;
  pairs: PairRef[];
  archive: string | null;
  lookup: string;
};

export type Unkeyed = { pair: string; side: "wrapped" | "canonical"; chain: string; symbol: string; why_null: string };

function pairRef(e: RosterRow, side: "wrapped" | "canonical"): PairRef {
  const other = side === "wrapped" ? e.canonical : e.wrapped;
  const k = caip19Of(other);
  const door = ASSET_DOORS.find((d) => d.symbol === e.canonical.symbol);
  return {
    pair: e.id,
    side,
    mechanism: e.backing_model,
    counterpart: { chain: other.chain, symbol: other.symbol, caip19: k.caip19, ...(k.why_null ? { why_null: k.why_null } : {}) },
    escrow: e.escrow ?? null,
    escrow_name: e.escrow_name ?? null,
    note: e.note ?? null,
    preview: `/api/wrapper?id=${encodeURIComponent(e.id)}&preview=1`,
    door: `/api/wrapper?id=${encodeURIComponent(e.id)}`,
    asset_door: door ? `/api/wrapper/asset/${door.asset}` : null,
  };
}

/** Built once per isolate from the roster and the archive map; ordered by CAIP-19. */
export function buildIndex(): { assets: IndexEntry[]; unkeyed: Unkeyed[] } {
  const byId = new Map<string, IndexEntry>();
  const unkeyed: Unkeyed[] = [];
  const entryFor = (caip19: string, caip2: string, side: Side): IndexEntry => {
    let e = byId.get(caip19);
    if (!e) {
      e = { caip19, caip2, chain: side.chain, symbol: side.symbol, address: side.address.toLowerCase(), pairs: [], archive: null, lookup: LOOKUP_PREFIX + caip19 };
      byId.set(caip19, e);
    }
    return e;
  };
  for (const r of ROSTER) {
    for (const side of ["wrapped", "canonical"] as const) {
      const s = r[side];
      const k = caip19Of(s);
      if (!k.caip19 || !k.caip2) {
        unkeyed.push({ pair: r.id, side, chain: s.chain, symbol: s.symbol, why_null: k.why_null ?? "no CAIP-19 id" });
        continue;
      }
      entryFor(k.caip19, k.caip2, s).pairs.push(pairRef(r, side));
    }
  }
  for (const a of ARCHIVE_ROWS) entryFor(a.caip19, a.caip2, a).archive = a.archive;
  const assets = [...byId.values()].sort((a, b) => a.caip19.localeCompare(b.caip19));
  return { assets, unkeyed };
}

let cached: ReturnType<typeof buildIndex> | null = null;
export const index = () => (cached ??= buildIndex());
export const lookup = (caip19: string): IndexEntry | undefined => index().assets.find((a) => a.caip19 === caip19);

export const chainTable = (): Record<string, string | null> =>
  Object.fromEntries(Object.entries(CHAINS).map(([k, v]) => [k, v.caip2]));

export type PublicRecord = { ledger: string; as_of: string | null; state: string; state_vocabulary: string; escrow_over_wrapped: string | null };

/**
 * The state each pair carries in the ALREADY-PUBLISHED parity ledger, read from this deployment's own
 * static asset (never a chain). Absent binding or file -> empty map; the lookup still answers.
 */
export async function publicStates(env: { ASSETS?: { fetch: (r: Request | string) => Promise<Response> } }, requestUrl: string): Promise<Map<string, PublicRecord>> {
  const out = new Map<string, PublicRecord>();
  if (!env?.ASSETS) return out;
  try {
    const res = await env.ASSETS.fetch(new Request(new URL(PUBLIC_LEDGER, requestUrl).toString()));
    if (!res.ok) return out;
    const doc = (await res.json()) as { schema?: string; as_of?: string; records?: { id: string; state: string; escrow_over_wrapped?: string | null }[] };
    for (const r of doc.records ?? []) {
      out.set(r.id, { ledger: PUBLIC_LEDGER, as_of: doc.as_of ?? null, state: r.state, state_vocabulary: doc.schema ?? "unknown", escrow_over_wrapped: r.escrow_over_wrapped ?? null });
    }
  } catch {
    /* the lookup never fails because the ledger file is missing */
  }
  return out;
}

export const CANDIDATE_BATCH = {
  status: "HELD",
  sign_status: "SIGN_PENDING",
  vocabulary: CANDIDATE_STATES,
  note: "A first batch of CAIP-19-keyed records in the five-state vocabulary (two-operator reads at pinned finalized blocks plus a verbatim quote of each custodian or bridge disclosure) is staged unsigned. It is published only with the owner's OK, because each record names an issuer. Until then this index serves the states of the records already public.",
} as const;

export const FREE_NOTE =
  "Free. This lookup performs no chain read: it maps a CAIP-19 id to records this site already publishes. A fresh read at pinned finalized blocks is the existing /api/wrapper door (preview free).";

export const json = (body: unknown, status = 200, cache = "public, max-age=300") =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
      "access-control-allow-origin": "*",
    },
  });
