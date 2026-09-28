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
  CSOAI_LID,
  type X402Env,
} from "../_x402";
import { railMode } from "../_x402_config";
import { sha256Hex } from "../../_lib/cardSign";
import { WRAPPER_ROSTER } from "../_wrapper_roster";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string };

const ORIGIN = "https://councilof.ai";
const SNAP_GLOB_PREFIX = "wrapped-asset-parity-";
const SNAP_GLOB_SUFFIX = ".json";

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extraHeaders,
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

function normalizedRead(record: Record<string, unknown>, name: "wrapped_total_supply" | "escrow_balance"): string | null {
  const reads = record.reads as Record<string, unknown> | undefined;
  const read = reads?.[name] as Record<string, unknown> | undefined;
  const value = read?.normalized ?? record[name];
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return null;
}

function exactDelta(current: string, previous: string): string | null {
  const parse = (value: string) => {
    const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
    if (!m) return null;
    const frac = m[3] || "";
    const atomic = BigInt((m[1] ? "-" : "") + m[2] + frac);
    return { atomic, scale: frac.length };
  };
  const a = parse(current); const b = parse(previous);
  if (!a || !b) return null;
  const scale = Math.max(a.scale, b.scale);
  const ai = a.atomic * (10n ** BigInt(scale - a.scale));
  const bi = b.atomic * (10n ** BigInt(scale - b.scale));
  const d = ai - bi; const neg = d < 0n; const abs = neg ? -d : d;
  if (scale === 0) return `${neg ? "-" : ""}${abs}`;
  const digits = abs.toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, -scale);
  const frac = digits.slice(-scale).replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const preview = url.searchParams.get("preview") === "1";
  const knownIds = (WRAPPER_ROSTER as readonly { id: string }[]).map((entry) => entry.id);

  if (!id || !/^[a-z0-9.]+:[a-z]+$/.test(id)) {
    return json({ schema: "csoai.wrapper.changes/0.1", error: "bad_request", reason: "pass id=<pair> (e.g. usdc.e:arbitrum)", known_ids: knownIds }, 400);
  }
  if (!knownIds.includes(id)) {
    return json({ schema: "csoai.wrapper.changes/0.1", error: "not_found", reason: `${id} is not on the wrapper roster. No payment was taken for a 404.`, known_ids: knownIds }, 404);
  }

  const resourceUrl = `${origin}/api/wrapper/changes?id=${encodeURIComponent(id)}`;
  const description = `Exact decimal delta of wrapped supply and escrow for ${id} since the previous ledger snapshot. Returns point-in-time arithmetic differences, not a rate or grade.`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { id },
    queryParamsSchema: { properties: { id: { type: "string", description: "wrapper roster id (e.g. usdc.e:arbitrum)" } }, required: ["id"] },
    outputExample: { schema: "csoai.wrapper.changes/0.1", id, wrapped_supply_delta: "<exact decimal>", escrow_delta: "<exact decimal>", state: "DELTA_READ" },
  });
  const challenge = (notPaidReason: string, readBeforeSettle?: Record<string, unknown>) => paymentRequiredResponseSigned(
    buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Wrapped-Asset Changes",
      tags: ["stablecoin", "bridge", "wrapped", "changes", "delta", "x402"],
      accepts,
      bazaar,
      csoai: {
        schema: "csoai.wrapper.changes/0.1",
        per: "pair-request",
        lid: CSOAI_LID,
        never: ["rating", "guarantee", "verdict", "rank", "certificate", "reserve attestation"],
        deliverable: "exact decimal delta between two published ledger snapshots, plus settlement echo and sha256 of the exact delivered JSON bytes",
        free_preview: `${resourceUrl}&preview=1`,
        source_preview: `${origin}/api/wrapper?id=${encodeURIComponent(id)}&preview=1`,
        rail: railMode(env),
        read_before_settle: readBeforeSettle ?? true,
        not_paid_reason: notPaidReason,
        catalog: `${origin}/api/x402`,
      },
    }), env,
  );

  // READ BEFORE SETTLE. Every source and arithmetic precondition is established before the
  // facilitator is contacted. A missing snapshot, pair, or field cannot become a paid result.
  const [current, previous] = await fetchLatestSnapshots();
  let result: Record<string, unknown>;
  if (!current) {
    result = { schema: "csoai.wrapper.changes/0.1", id, state: "UNCHECKABLE", reason: "No current snapshot found at /interop/wrapped-asset-parity-latest.json", current_as_of: null, previous_as_of: null, wrapped_supply_delta: null, escrow_delta: null };
  } else {
    const currentData = extractPairData(current, id);
    const currentAsOf = (current.as_of || current.fetched_at || null) as string | null;
    if (!currentData) {
      result = { schema: "csoai.wrapper.changes/0.1", id, state: "UNCHECKABLE", reason: `Pair ${id} not found in current snapshot`, current_as_of: currentAsOf, previous_as_of: null, wrapped_supply_delta: null, escrow_delta: null };
    } else if (!previous) {
      result = { schema: "csoai.wrapper.changes/0.1", id, state: "UNCHECKABLE", reason: "Only one snapshot exists — no previous ledger to compare", current_as_of: currentAsOf, previous_as_of: null, wrapped_supply_delta: null, escrow_delta: null };
    } else {
      const previousData = extractPairData(previous, id);
      const previousAsOf = (previous.as_of || previous.fetched_at || null) as string | null;
      if (!previousData) {
        result = { schema: "csoai.wrapper.changes/0.1", id, state: "UNCHECKABLE", reason: `Pair ${id} not found in previous snapshot`, current_as_of: currentAsOf, previous_as_of: previousAsOf, wrapped_supply_delta: null, escrow_delta: null };
      } else {
        const currentSupply = normalizedRead(currentData, "wrapped_total_supply");
        const previousSupply = normalizedRead(previousData, "wrapped_total_supply");
        const currentEscrow = normalizedRead(currentData, "escrow_balance");
        const previousEscrow = normalizedRead(previousData, "escrow_balance");
        const supplyDelta = currentSupply !== null && previousSupply !== null ? exactDelta(currentSupply, previousSupply) : null;
        const escrowDelta = currentEscrow !== null && previousEscrow !== null ? exactDelta(currentEscrow, previousEscrow) : null;
        if (supplyDelta === null || escrowDelta === null) {
          result = { schema: "csoai.wrapper.changes/0.1", id, state: "UNCHECKABLE", reason: "One or more normalized supply or escrow reads are absent or not exact decimals", current_as_of: currentAsOf, previous_as_of: previousAsOf, wrapped_supply_delta: null, escrow_delta: null };
        } else {
          result = {
            schema: "csoai.wrapper.changes/0.1", id, state: "DELTA_READ",
            current_as_of: currentAsOf, previous_as_of: previousAsOf,
            wrapped_supply_delta: supplyDelta, escrow_delta: escrowDelta,
            current_state: currentData.state || null, previous_state: previousData.state || null,
            arithmetic: "exact decimal subtraction via scaled integers; no binary floating point",
            note: "Deltas are arithmetic differences between two point-in-time snapshots. Not a rate, not a grade, not a reserve attestation.",
          };
        }
      }
    }
  }

  if (preview) {
    return json({ ...result, preview: true, preview_note: "Free arithmetic preview. A paid response adds the facilitator settlement echo and sha256 of these exact delivered JSON bytes." });
  }

  if (result.state !== "DELTA_READ") {
    return challenge(`read before settle: delta is ${String(result.state)} (${String(result.reason || "source precondition failed")}). Nothing was sent to the facilitator.`, { state: result.state, reason: result.reason || null, settled: false });
  }

  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  if (!payment.ok) return challenge(payment.reason);

  const text = JSON.stringify(result, null, 2);
  const deliverySha256 = await sha256Hex(new TextEncoder().encode(text));
  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "x-payment-response, x-csoai-delivery-sha256, x-csoai-maintenance-source",
      "x-csoai-delivery-sha256": deliverySha256,
      "x-csoai-maintenance-source": `${origin}/api/wrapper?id=${encodeURIComponent(id)}&preview=1`,
      ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
    },
  });
};

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
