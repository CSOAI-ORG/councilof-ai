/**
 * GET /api/coverage-truth — distinguish indexed, runnable, measured, signed.
 *
 * Coverage harvest leaves and signed measurement cards are distinct artifact sets.
 * Every value here is derived from a committed artifact. Nothing typed.
 * Counts have different units across surfaces and cannot be added into a total.
 */

import rootJson from "../../public/root.json";
import cardIndex from "../../public/signed/card_index.json";
import stablecoinUniverse from "../../public/interop/stablecoin-universe-2026-09/index.json";
import mcpTrust from "../../public/interop/mcp-trust/latest.json";
import x402Census from "../../public/interop/x402-census/index.json";
import coverageRegister from "../../public/interop/coverage-register.json";

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

  // The root is a coverage-harvest commitment; the index lists signed measurement cards.
  const root = rootJson as { card_count?: number; card_sha256?: string[]; as_of?: string };
  const cards = cardIndex as { cards?: Array<{ signed?: boolean; card?: string }>; n_cards?: number };
  const cardRows = Array.isArray(cards.cards) ? cards.cards : [];
  const signedCardRows = cardRows.filter((c) => c.signed === true && typeof c.card === "string");
  const signedCardIds = new Set(signedCardRows.map((c) => c.card));

  // Surface 1: Coverage-harvest leaves (not signed measurement cards)
  const rootLeafCount = typeof root.card_count === "number" ? root.card_count : null;
  const rootLeafRows = Array.isArray(root.card_sha256) ? root.card_sha256.length : null;

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
      surface: "signed-cards (card_index.json)",
      indexed: cardRows.length,
      runnable: null,
      // A signed digest index does not itself prove a subject measurement.
      measured: null,
      signed: signedCardIds.size,
    },
    {
      surface: "coverage-harvest leaves (root.json)",
      indexed: rootLeafRows ?? 0,
      runnable: null,
      measured: null,
      signed: null,
    },
    {
      surface: "stablecoin-universe",
      indexed: scIndexed ?? 0,
      runnable: null,
      // Chain control facts are not a count of measured stablecoin assets.
      measured: null,
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

  // Validate each artifact against its own declared count. Never equate the two sets.

  const body = {
    schema: "csoai.coverage-truth/0.2",
    title: "Coverage truth — indexed / runnable / measured / signed",
    endpoint: "/api/coverage-truth",
    contract:
      "Distinguishes INDEXED (catalogued), RUNNABLE (responded), MEASURED (control facts), and SIGNED (measurement-card digests). " +
      "Coverage-harvest root leaves are not measurement cards. Counts are scoped to each surface and unit; heterogeneous surfaces cannot be summed.",
    summary: {
      aggregate_state: "NOT_ADDITIVE_DIFFERENT_UNITS",
      signed_card_ids_in_index: signedCardIds.size,
      card_index_declared_count: typeof cards.n_cards === "number" ? cards.n_cards : null,
      card_index_count_matches: typeof cards.n_cards === "number" && cards.n_cards === cardRows.length && signedCardIds.size === cardRows.length,
      root_harvest_leaf_count: rootLeafCount,
      root_harvest_as_of: root.as_of ?? null,
      root_leaf_count_matches: rootLeafCount !== null && rootLeafRows === rootLeafCount,
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
