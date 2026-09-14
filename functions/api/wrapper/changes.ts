/**
 * GET /api/wrapper/changes?id=<pair> — delta of wrapped supply and escrow since the
 * previous ledger snapshot (from public/interop/wrapped-asset-parity-*.json).
 *
 * Reads the two latest snapshot files, computes per-field deltas, and returns the change
 * summary. 402 via buildPaymentRequiredV2 + declareBazaarHttpGet; &preview=1 free.
 *
 * The snapshot as_of values are read from the live files, never typed.
 * If only one snapshot exists, the delta is UNCHECKABLE (no previous to compare).
 */
import {
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  verifyX402Payment,
  x402Accepts,
  CSOAI_LID,
  type X402Env,
} from "../_x402";
import { railMode } from "../_x402_config";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string };

const ORIGIN = "https://councilof.ai";
const SNAP_GLOB_PREFIX = "wrapped-asset-parity-";
const SNAP_GLOB_SUFFIX = ".json";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

/**
 * Fetch the two latest snapshot files from the public site.
 * Returns [current, previous] or [current, null] if only one exists.
 */
async function fetchLatestSnapshots(): Promise<[Record<string, unknown> | null, Record<string, unknown> | null]> {
  // Fetch the latest snapshot index to find available dates
  const latestUrl = `${ORIGIN}/interop/wrapped-asset-parity-latest.json`;
  let latest: Record<string, unknown>;
  try {
    const res = await fetch(latestUrl);
    if (!res.ok) return [null, null];
    latest = await res.json() as Record<string, unknown>;
  } catch {
    return [null, null];
  }

  // The latest file IS the current snapshot
  const current = latest;
  const currentAsOf = (current.as_of || current.fetched_at || "") as string;

  // Try to find the previous snapshot by date
  // Snapshots are named wrapped-asset-parity-YYYY-MM-DD.json
  const dateMatch = currentAsOf.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return [current, null];

  const currentDate = dateMatch[1];
  // Try the previous day
  const d = new Date(currentDate);
  d.setDate(d.getDate() - 1);
  const prevDate = d.toISOString().slice(0, 10);
  const prevUrl = `${ORIGIN}/interop/wrapped-asset-parity-${prevDate}.json`;

  try {
    const res = await fetch(prevUrl);
    if (!res.ok) return [current, null];
    const prev = await res.json() as Record<string, unknown>;
    return [current, prev];
  } catch {
    return [current, null];
  }
}

/**
 * Extract the relevant supply/escrow fields from a snapshot for a specific pair.
 */
function extractPairData(snap: Record<string, unknown>, pairId: string): Record<string, unknown> | null {
  // The snapshot may have a 'pairs' array or be structured differently
  // Try to find the pair data in the snapshot
  const pairs = snap.pairs as Array<Record<string, unknown>> | undefined;
  if (pairs) {
    return pairs.find((p) => p.id === pairId) || null;
  }
  // If no pairs array, the snapshot might be the raw payload
  if (snap.id === pairId) return snap;
  return null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const preview = url.searchParams.get("preview") === "1";

  const resourceUrl = `${origin}/api/wrapper/changes?id=${encodeURIComponent(id || "<pair>")}`;
  const description = `Delta of wrapped supply and escrow for ${id || "<pair>"} since the previous ledger snapshot. Returns per-field changes, not a rate or grade.`;

  // Validate ID format
  if (!id || !/^[a-z0-9.]+:[a-z]+$/.test(id)) {
    return json({
      schema: "csoai.wrapper.changes/0.1",
      error: "bad_request",
      reason: "pass id=<pair> (e.g. usdc.e:arbitrum)",
    }, 400);
  }

  // x402 setup
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  const payment = preview ? { ok: false as const, reason: "preview" } : await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!preview && !payment.ok) {
    return paymentRequiredResponseSigned(
      buildPaymentRequiredV2({
        resourceUrl,
        description,
        serviceName: "CSOAI Wrapped-Asset Changes",
        tags: ["stablecoin", "bridge", "wrapped", "changes", "delta", "x402"],
        accepts,
        bazaar: declareBazaarHttpGet({
          method: "GET",
          queryParams: { id },
          queryParamsSchema: { properties: { id: { type: "string", description: "pair id (e.g. usdc.e:arbitrum)" } }, required: ["id"] },
          outputExample: { schema: "csoai.wrapper.changes/0.1", id, wrapped_supply_delta: "<decimal>", escrow_delta: "<decimal>", state: "DELTA_READ" },
        }),
        csoai: {
          schema: "csoai.wrapper.changes/0.1",
          per: "pair-request",
          lid: CSOAI_LID,
          never: ["rating", "guarantee", "verdict", "rank", "certificate"],
          deliverable: "delta of wrapped supply and escrow between two ledger snapshots",
          free_preview: `${resourceUrl}&preview=1`,
          rail: railMode(env),
          not_paid_reason: payment.reason,
          catalog: `${origin}/api/x402`,
        },
      }),
      env,
    );
  }

  // Fetch snapshots
  const [current, previous] = await fetchLatestSnapshots();

  if (!current) {
    return json({
      schema: "csoai.wrapper.changes/0.1",
      id,
      state: "UNCHECKABLE",
      reason: "No current snapshot found at /interop/wrapped-asset-parity-latest.json",
    });
  }

  const currentData = extractPairData(current, id);
  if (!currentData) {
    return json({
      schema: "csoai.wrapper.changes/0.1",
      id,
      state: "NOT_FOUND",
      reason: `Pair ${id} not found in current snapshot`,
    });
  }

  const currentAsOf = (current.as_of || current.fetched_at || null) as string | null;

  if (!previous) {
    // Only one snapshot — can't compute delta
    const result = {
      schema: "csoai.wrapper.changes/0.1",
      id,
      state: "UNCHECKABLE",
      reason: "Only one snapshot exists — no previous ledger to compare",
      current_as_of: currentAsOf,
      previous_as_of: null,
      wrapped_supply_delta: null,
      escrow_delta: null,
    };
    return preview ? json({ ...result, preview: true }) : json(result);
  }

  const previousData = extractPairData(previous, id);
  const previousAsOf = (previous.as_of || previous.fetched_at || null) as string | null;

  if (!previousData) {
    return json({
      schema: "csoai.wrapper.changes/0.1",
      id,
      state: "UNCHECKABLE",
      reason: `Pair ${id} not found in previous snapshot`,
      current_as_of: currentAsOf,
      previous_as_of: previousAsOf,
      wrapped_supply_delta: null,
      escrow_delta: null,
    });
  }

  // Compute deltas
  const currentSupply = Number(currentData.wrapped_total_supply || currentData.supply || 0);
  const previousSupply = Number(previousData.wrapped_total_supply || previousData.supply || 0);
  const currentEscrow = Number(currentData.escrow_balance || currentData.escrow || 0);
  const previousEscrow = Number(previousData.escrow_balance || previousData.escrow || 0);

  const result = {
    schema: "csoai.wrapper.changes/0.1",
    id,
    state: "DELTA_READ",
    current_as_of: currentAsOf,
    previous_as_of: previousAsOf,
    wrapped_supply_delta: currentSupply - previousSupply,
    escrow_delta: currentEscrow - previousEscrow,
    current_state: currentData.state || null,
    previous_state: previousData.state || null,
    note: "Deltas are arithmetic differences between two point-in-time snapshots. Not a rate, not a grade, not a reserve attestation.",
  };

  if (preview) {
    return json({ ...result, preview: true, preview_note: "Full data requires payment." });
  }

  return json(result);
};
