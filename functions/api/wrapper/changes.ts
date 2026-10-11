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
import { headFromGet } from "../_head";
import {
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  verifyX402Payment,
  x402Accepts,
  type X402Env,
} from "../_x402";
import { WRAPPER_LID } from "../wrapper";
import { NOT_FOUND_HINT } from "../[[path]].js";
import { railMode } from "../_x402_config";
import { WRAPPER_CHANGES_DESCRIPTION } from "../_x402_descriptions";

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
  // The canonical reader emits `records`; retain `pairs` for older fixtures/clients.
  const records = (snap.records || snap.pairs) as Array<Record<string, unknown>> | undefined;
  if (records) {
    return records.find((p) => String(p.id || "").toLowerCase() === pairId) || null;
  }
  // If no pairs array, the snapshot might be the raw payload
  if (snap.id === pairId) return snap;
  return null;
}

function normalizedRead(record: Record<string, unknown>, name: "wrapped_total_supply" | "escrow_balance"): number | null {
  const reads = record.reads as Record<string, unknown> | undefined;
  const read = reads?.[name] as Record<string, unknown> | undefined;
  const value = read?.normalized ?? record[name];
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * THE 402 THIS DOOR OFFERS — ONE BUILD, SHARED BY GET AND BY THE UNPAID-POST PROBE.
 *
 * Index eligibility (2026-10-09): this file exported no POST handler, so a directory validator's
 * `POST {}` fell through to the /api catch-all's 404 — and x402scan lists exactly that shape as a
 * common failure ("Expected 402, got 404 … before payment challenge"). The probe now gets the
 * challenge. Everything is built here, once, so the two entry points cannot drift apart.
 */
function doorAccepts(env: Env, resourceUrl: string, description: string) {
  return x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
}

// Computed once, used twice: the 402 advertises this block and the paid path echoes the SAME
// object into the PaymentPayload sent to the facilitator (specs/extensions/bazaar.md, Client
// Behavior) — that echo is what gets a resource catalogued.
function doorBazaar(id: string) {
  return declareBazaarHttpGet({
    method: "GET",
    queryParams: { id },
    queryParamsSchema: { properties: { id: { type: "string", description: "pair id (e.g. usdc.e:arbitrum)" } }, required: ["id"] },
    outputExample: { schema: "csoai.wrapper.changes/0.1", id, wrapped_supply_delta: "<decimal>", escrow_delta: "<decimal>", state: "DELTA_READ" },
  });
}

async function doorChallenge(
  request: Request,
  env: Env,
  args: {
    resourceUrl: string;
    description: string;
    accepts: ReturnType<typeof doorAccepts>;
    bazaar: ReturnType<typeof doorBazaar>;
    notPaidReason: string;
  },
): Promise<Response> {
  const origin = new URL(request.url).origin;
  return paymentRequiredResponseSigned(
    buildPaymentRequiredV2({
      resourceUrl: args.resourceUrl,
      description: args.description,
      serviceName: "CSOAI Wrapped-Asset Changes",
      tags: ["stablecoin", "bridge", "wrapped", "changes", "delta", "x402"],
      accepts: args.accepts,
      bazaar: args.bazaar,
      csoai: {
        schema: "csoai.wrapper.changes/0.1",
        per: "pair-request",
        lid: WRAPPER_LID,
        never: ["rating", "guarantee", "verdict", "rank", "certificate"],
        deliverable: "delta of wrapped supply and escrow between two ledger snapshots",
        free_preview: `${args.resourceUrl}&preview=1`,
        rail: railMode(env),
        not_paid_reason: args.notPaidReason,
        catalog: `${origin}/api/x402`,
      },
    }),
    env,
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const preview = url.searchParams.get("preview") === "1";

  const resourceUrl = `${origin}/api/wrapper/changes?id=${encodeURIComponent(id || "<pair>")}`;
  const description = WRAPPER_CHANGES_DESCRIPTION;

  // Validate ID format
  if (!id || !/^[a-z0-9.]+:[a-z]+$/.test(id)) {
    return json({
      schema: "csoai.wrapper.changes/0.1",
      error: "bad_request",
      reason: "pass id=<pair> (e.g. usdc.e:arbitrum)",
    }, 400);
  }

  // x402 setup
  const accepts = doorAccepts(env, resourceUrl, description);
  const bazaar = doorBazaar(id);
  const payment = preview ? { ok: false as const, reason: "preview" } : await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });

  if (!preview && !payment.ok) {
    return doorChallenge(request, env, { resourceUrl, description, accepts, bazaar, notPaidReason: payment.reason });
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
  const currentSupply = normalizedRead(currentData, "wrapped_total_supply");
  const previousSupply = normalizedRead(previousData, "wrapped_total_supply");
  const currentEscrow = normalizedRead(currentData, "escrow_balance");
  const previousEscrow = normalizedRead(previousData, "escrow_balance");

  if ([currentSupply, previousSupply, currentEscrow, previousEscrow].some((value) => value === null)) {
    return json({
      schema: "csoai.wrapper.changes/0.1",
      id,
      state: "UNCHECKABLE",
      reason: "One or more normalized supply or escrow reads are absent",
      current_as_of: currentAsOf,
      previous_as_of: previousAsOf,
      wrapped_supply_delta: null,
      escrow_delta: null,
    });
  }

  const result = {
    schema: "csoai.wrapper.changes/0.1",
    id,
    state: "DELTA_READ",
    current_as_of: currentAsOf,
    previous_as_of: previousAsOf,
    wrapped_supply_delta: currentSupply! - previousSupply!,
    escrow_delta: currentEscrow! - previousEscrow!,
    current_state: currentData.state || null,
    previous_state: previousData.state || null,
    note: "Deltas are arithmetic differences between two point-in-time snapshots. Not a rate, not a grade, not a reserve attestation.",
  };

  if (preview) {
    return json({ ...result, preview: true, preview_note: "Full data requires payment." });
  }

  return json(result);
};

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);

/**
 * POST /api/wrapper/changes — INDEX ELIGIBILITY (2026-10-09).
 *
 * This door never exported a POST handler, so the platform routed POST to the /api catch-all's
 * 404. A directory validator probes with `POST {}` and no payment header, and x402scan names that
 * shape as a common failure ("Expected 402, got 404 …"), which Coinbase's Bazaar validator reads
 * as "this resource is not payable". The unpaid POST therefore gets the challenge first — with or
 * without an `id`, because an absent id is input validation and the challenge comes before it.
 *
 * A POST that DOES carry a payment header keeps the answer it has always had: this door has never
 * served POST, so it is still the /api catch-all's 404, body for body (same json() shape, same
 * NOT_FOUND_HINT). No paying client sees a changed byte.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (hasPaymentHeader(request)) {
    return json({ error: "not_found", path: "/api/wrapper/changes", hint: NOT_FOUND_HINT }, 404);
  }
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const resourceUrl = `${url.origin}/api/wrapper/changes?id=${encodeURIComponent(id || "<pair>")}`;
  const description = WRAPPER_CHANGES_DESCRIPTION;
  const accepts = doorAccepts(env, resourceUrl, description);
  const bazaar = doorBazaar(id);
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  return doorChallenge(request, env, { resourceUrl, description, accepts, bazaar, notPaidReason: payment.reason });
};
