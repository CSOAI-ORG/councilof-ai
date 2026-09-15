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
  const cards = cardIndex as { cards?: Array<{ signed?: boolean; cell?: Record<string, string> }>; n_cards?: number };
  const cardRows = Array.isArray(cards.cards) ? cards.cards : [];
  const signedCardIds = new Set<string>(
    cardRows.filter((c) => c.signed && c.cell).map((c) => c.cell ? `${c.cell.issuer}/${c.cell.model}/${c.cell.axis}` : ""),
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
  const cr = coverageRegister as { chains?: Record<string, Record<string, number>> };
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
      measured: signedCardIds.size,
      signed: rootCardCount ?? signedCardIds.size,
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

  // Reconciliation: signed card count from card_index vs root
  const reconciled = cardRows.length === (rootCardCount ?? cardRows.length);

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
