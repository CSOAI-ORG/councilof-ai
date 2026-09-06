/**
 * GET /api/receipts?payer=0x… — settlement receipts for one payer.
 *
 * WHY THIS EXISTS AND WHY IT IS EMPTY. After M-OS01 a buyer can sign an x402 authorization in
 * the browser, and a successful settle returns X-PAYMENT-RESPONSE carrying the facilitator's
 * tx hash, network and payer. Nothing records it. The response is handed to the caller and
 * discarded, so there is no per-payer history to serve — and this endpoint says so rather
 * than rendering an empty list that reads like "you have never paid".
 *
 * The distinction matters to the only person who would call this: a buyer who HAS paid and
 * wants their receipt. "No receipts recorded for this payer" and "receipts are not recorded
 * at all" are different answers, and only the second one is true today.
 *
 * WHAT IS MISSING, EXACTLY: durable storage for settle results. gaps-2026-09.md P0 #1 records
 * the same gap for the action-job ledger — "LEADS KV deliberately provides no concurrency
 * guarantee" — so writing receipts to KV would be the same defect twice. That is an
 * architectural decision (D1 or a Durable Object), not something this route should improvise.
 *
 * WHEN IT IS WIRED: only `readReceipts` changes. The response shape, the payer validation and
 * the honesty fields stay, so a client written against this today keeps working.
 *
 * Sibling doors: /api/receipts/latest (the same UNPUBLISHED state, no filter),
 * /api/receipts/batch (card-v0 leaves under the signed root — a different thing entirely,
 * and NOT payment receipts).
 */

/// <reference types="@cloudflare/workers-types" />

const EIP55_ISH = /^0x[0-9a-fA-F]{40}$/;

export interface ReceiptRow {
  payer: string;
  txHash: string;
  network: string;
  amount: string;
  asset: string;
  resource: string;
  settledAt: string;
}

/**
 * The one seam. Today there is no store, so this returns null — meaning "not recorded",
 * which is NOT the same as returning [] ("recorded, and there are none").
 */
export async function readReceipts(_payer: string): Promise<ReceiptRow[] | null> {
  return null;
}

/** The handler, with the reader injected so the wired path is testable before it is wired. */
export async function handle(
  request: Request,
  read: (payer: string) => Promise<ReceiptRow[] | null> = readReceipts,
): Promise<Response> {
  const url = new URL(request.url);
  const payer = (url.searchParams.get("payer") || "").trim();

  const body: Record<string, unknown> = {
    schema: "csoai.receipts.by-payer/0.1",
    as_of: new Date().toISOString(),
    query: { payer: payer || null },
    honesty: {
      empty_is_not_none:
        "An empty list here would mean 'this payer has no receipts'. That is not what is true. " +
        "Settlement receipts are not recorded anywhere yet, so no payer has a history — including " +
        "one who has paid. status distinguishes the two.",
      what_a_receipt_is_not:
        "These are payment receipts. /api/receipts/batch serves card-v0 measurement leaves under " +
        "the signed public root, which are a different artefact and are not evidence of payment.",
    },
    endpoints: {
      latest: "/api/receipts/latest",
      batch: "/api/receipts/batch",
      rail: "/.well-known/x402.json",
    },
  };

  if (!payer) {
    return Response.json(
      {
        ...body,
        status: "BAD_REQUEST",
        items: null,
        count: null,
        reason: "?payer=0x… is required. This door answers for one payer, never for everyone.",
      },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  if (!EIP55_ISH.test(payer)) {
    return Response.json(
      {
        ...body,
        status: "BAD_REQUEST",
        items: null,
        count: null,
        reason:
          "payer must be a 20-byte hex address (0x + 40 hex chars). Refusing to look up a value " +
          "that cannot be an EVM address rather than returning an empty result that looks like an answer.",
      },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const rows = await read(payer);

  if (rows === null) {
    return Response.json(
      {
        ...body,
        status: "UNRECORDED",
        items: null,
        count: null,
        unavailable_capability: {
          capability: "settlement-receipt persistence",
          detail:
            "A settle returns X-PAYMENT-RESPONSE (tx hash, network, payer) and nothing stores it, " +
            "so there is no per-payer history to read. Durable storage — D1 or a Durable Object — " +
            "is the missing piece; KV is not it (no concurrency guarantee, gaps-2026-09.md P0 #1).",
          proof: "GET /api/receipts/latest -> status UNPUBLISHED, count 0",
        },
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    { ...body, status: "OK", items: rows, count: rows.length },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}

export const onRequestGet: PagesFunction = async ({ request }) => handle(request);
