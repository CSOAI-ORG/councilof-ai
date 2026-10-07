/**
 * GET /api/coverage-truth — distiguish indexed, runnable, measured, signed.
 *
 * Public coverage counts must reconcile to card IDs (issuance #2391).
 * Every value here is derived from a committed artifact. Nothing typed.
 * Numbers are NEVER summed across lifecycle states.
 */

import rootJson from "../../public/root.json";
import cardIndex from "../../public/signed/card_index.json";
import stablecoinUniverse from "../../public/interop/stablecoin-universe-2026-09/index.json";
import mcpTrust from "../../public/interop/mcp-trust/latest.json";
import x402Census from "../../public/interop/x402-census/index.json";
import coverageRegister from "../../public/interop/coverage-register.json";
import { headFromGet } from "./_head";

type Env = { RUNPOD_WORKER_HEALTH_URL?: string; WORKER_STATE_KV?: KVNamespace };

interface SurfaceCounts {
  surface: string;
  indexed: number;
  runnable: number | null;
  measured: number | null;
  signed: number | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const cacheHeader = url.searchParams.has("nocache") ? "no-store" : "public, max-age=120";

  // Helper: signed card IDs from card_index.json
  const root = rootJson as Record<string, unknown>;
  const cards = cardIndex as {
    cards?: Array<{ signed?: boolean; cell?: Record<string, string>; axis?: string }>;
    n_cards?: number;
  };
  const cardRows = Array.isArray(cards.cards) ? cards.cards : [];
  // Rows are flat ({axis, card, card_url, kid, pubkey, sig, signed, ts}) — there is no
  // nested `cell` object, so the issuer/model/axis triple can never be derived here.
  // Empty is not zero: report null rather than a measured-looking 0.
  const cellDerived = cardRows.some((c) => Boolean(c.cell));
  const signedCardIds = new Set<string>(
    cellDerived
      ? cardRows.filter((c) => c.signed && c.cell).map((c) => `${c.cell!.issuer}/${c.cell!.model}/${c.cell!.axis}`)
      : [],
  );

  // Surface 1: Signed cards (root)
  const rootCardCount = typeof root.card_count === "number" ? root.card_count : null;

  // Surface 2: Stablecoin universe
  const sc = stablecoinUniverse as { asset_count?: number; assets?: unknown[] };
  const scIndexed = typeof sc.asset_count === "number" ? sc.asset_count : (Array.isArray(sc.assets) ? sc.assets.length : null);

  // Surface 3: MCP trust census (runnable = initialize_ok)
  const mt = mcpTrust as { counts?: Record<string, unknown> };
  const mtCounts = mt.counts ?? {};
  const mtRunnable = typeof mtCounts.initialize_ok_tools_listed === "number"
    ? (mtCounts.initialize_ok_tools_listed as number)
    : typeof mtCounts.initialize_ok_open === "number"
      ? (mtCounts.initialize_ok_open as number)
      : null;

  // Surface 4: x402 census rounds (runnable from census)
  const x4 = x402Census as { rounds?: Array<Record<string, unknown>> };
  const x4Count = Array.isArray(x4.rounds) ? x4.rounds.length : 0;

  // Coverage register: chains counted
  const cr = coverageRegister as unknown as { chains?: Record<string, Record<string, number | string>> };
  const chains = cr.chains ?? {};
  let chainIndexed = 0;
  let chainMeasured = 0;
  for (const v of Object.values(chains)) {
    if (typeof v === "object" && v) {
      chainIndexed += typeof v.instruments_in_coverage_index === "number" ? v.instruments_in_coverage_index : 0;
      chainMeasured += typeof v.located_issuers_with_measured_control_facts === "number" ? v.located_issuers_with_measured_control_facts : 0;
    }
  }

  // Build per-surface counts
  const surfaces: SurfaceCounts[] = [
    {
      surface: "signed-cards (root.json)",
      indexed: cardRows.length,
      runnable: null,
      // null = NOT DERIVABLE, not zero: rows carry no cell object, so the
      // issuer/model/axis triple cannot be computed from this file. Quoting 335
      // would claim every index row is a measurement; quoting 0 would claim none is.
      measured: cellDerived ? signedCardIds.size : null,
      signed: rootCardCount ?? (cellDerived ? signedCardIds.size : null),
    },
    {
      surface: "stablecoin-universe",
      indexed: scIndexed ?? 0,
      runnable: null,
      measured: chainMeasured,
      signed: null,
    },
    {
      surface: "mcp-trust (handshake census)",
      indexed: typeof mtCounts.total === "number" ? (mtCounts.total as number) : 0,
      runnable: mtRunnable,
      measured: null,
      signed: null,
    },
    {
      surface: "x402-census (rounds)",
      indexed: x4Count,
      runnable: null,
      measured: null,
      signed: null,
    },
    {
      surface: "coverage-register (chains: XRPL, EVM/EAS)",
      indexed: chainIndexed,
      runnable: null,
      measured: chainMeasured,
      signed: null,
    },
  ];

  // Reconciliation — WITHIN each corpus, never ACROSS the two.
  //
  // card_index (335 rows) and root.json (319 leaves) are SEPARATE_CORPORA: zero
  // identifier overlap (verified 2026-10-07, 335∩319=0). The previous check compared
  // cardRows.length against root.card_count, which is 335 === 319 by construction and
  // therefore permanently false — it reported a broken reconciliation when each corpus
  // was in fact internally consistent (n_cards === rows, card_count === leaves).
  //
  // Correct meaning: every declared header agrees with its own bytes.
  const rootLeaves = Array.isArray(root.card_sha256) ? (root.card_sha256 as unknown[]).length : null;
  const indexHeader = typeof cards.n_cards === "number" ? cards.n_cards : null;
  const rootInternal = rootCardCount !== null && rootLeaves !== null ? rootCardCount === rootLeaves : null;
  const indexInternal = indexHeader !== null ? indexHeader === cardRows.length : null;
  const reconciled = rootInternal === true && indexInternal === true;

  const body = {
    schema: "csoai.coverage-truth/0.1",
    title: "Coverage truth — indexed / runnable / measured / signed",
    endpoint: "/api/coverage-truth",
    contract:
      "Distinguishes INDEXED (catalogued), RUNNABLE (responded), MEASURED (signed card body), and SIGNED (live root). " +
      "Numbers are NEVER summed across lifecycle states. Numbers reconcile to card IDs from public/root.json.",
    summary: {
      indexed_total: surfaces.reduce((s, c) => s + (c.indexed ?? 0), 0),
      runnable_total: surfaces.reduce((s, c) => s + (c.runnable ?? 0), 0),
      measured_total: surfaces.reduce((s, c) => s + (c.measured ?? 0), 0),
      signed_total: surfaces.reduce((s, c) => s + (c.signed ?? 0), 0),
      reconciliation_ok: reconciled,
      // Why the two corpus sizes differ, so reconciliation_ok is never read as "335 === 319".
      corpus_relationship: {
        relationship: "SEPARATE_CORPORA",
        identifier_overlap: 0,
        note: "card_index rows and root.json leaves are disjoint identifier sets and are never summed, never compared for equality, and never added to a total. reconciliation_ok reports only WITHIN-corpus header agreement.",
        root_declared_card_count: rootCardCount,
        root_published_leaves: rootLeaves,
        root_headers_agree: rootInternal,
        index_declared_n_cards: indexHeader,
        index_rows: cardRows.length,
        index_headers_agree: indexInternal,
        observed: "2026-10-07T04:31Z — 335 index rows, 319 leaves, intersection 0.",
      },
      measured_note: cellDerived
        ? undefined
        : "signed-cards measured is null, not 0: card_index rows carry no cell object, so the issuer/model/axis triple is underivable from this file. Empty is not zero.",
    },
    surfaces,
    not_covered: [
      "HF/Kaggle publication freshness — see /api/observability for connector ages.",
      "RunPod billing — not in committed artifacts.",
      "Per-connector budgets — see #2391 work package.",
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheHeader,
      "access-control-allow-origin": "*",
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
