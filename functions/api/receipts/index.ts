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
import { readReceiptsByPayer } from "../_x402_receipt";
import { readDeliveryByTransaction } from "../_x402_delivery_record";

const EIP55_ISH = /^0x[0-9a-fA-F]{40}$/;

export interface ReceiptRow {
  payer: string;
  txHash: string;
  network: string;
  amount: string;
  asset: string;
  resource: string;
  settledAt: string;
  /** The x402 offer-receipt extension artefact (§5). Verifiable against did.json alone. */
  receipt?: { format: "jws"; signature: string };
  kid?: string;
  zero_value?: boolean;
  self?: boolean | null;
  record_schema?: string;
  delivery?: {
    schema: string;
    response_sha256: string;
    response_bytes: number;
    content_type: string;
    delivered_at: string;
    signed: false;
    claim_boundary: string;
  } | null;
}

/**
 * The one seam, now wired. null still means "not recorded" (no store bound) and [] still means
 * "recorded, and this payer has none" — the distinction this door was built to preserve.
 *
 * WHY KV AFTER ALL. The note above rejected KV because "LEADS KV deliberately provides no
 * concurrency guarantee" (gaps-2026-09.md P0 #1). That objection is about read-modify-write —
 * a counter two writers increment at once loses one. Receipt rows are not that: each row is
 * written once, under a key derived from its own transaction hash, and never updated. A lost
 * update is impossible where there is no update. The read-add-put tally in recordSettlement IS
 * exposed to the race, which is exactly why /api/revenue derives its distinct-payer count from
 * the records rather than from that tally. Same reasoning, applied here.
 */
export async function readReceipts(
  payer: string,
  kv?: KVNamespace,
): Promise<ReceiptRow[] | null> {
  const rows = await readReceiptsByPayer(kv as unknown as Parameters<typeof readReceiptsByPayer>[0], payer);
  if (rows === null) return null;
  return Promise.all(rows.map(async (r) => {
    const transaction = r.payload.transaction || "";
    const deliveryRecord = transaction
      ? await readDeliveryByTransaction(
          kv as unknown as Parameters<typeof readDeliveryByTransaction>[0],
          transaction,
        )
      : null;
    return {
      payer: r.payload.payer,
      txHash: transaction,
      network: r.payload.network,
      amount: r.amount_atomic ?? "",
      asset: r.asset ?? "",
      resource: r.resource,
      settledAt: r.issued_at,
      // The artefact a stranger can check without trusting this endpoint, and the record around it.
      receipt: r.receipt,
      kid: r.kid,
      zero_value: r.zero_value,
      self: r.self,
      record_schema: r.schema,
      delivery: deliveryRecord
        ? {
            schema: deliveryRecord.schema,
            response_sha256: deliveryRecord.response_sha256,
            response_bytes: deliveryRecord.response_bytes,
            content_type: deliveryRecord.content_type,
            delivered_at: deliveryRecord.delivered_at,
            signed: false as const,
            claim_boundary: deliveryRecord.claim_boundary,
          }
        : null,
    };
  }));
}

/** The handler, with the reader injected so the wired path is testable before it is wired. */
export async function handle(
  request: Request,
  read: (payer: string) => Promise<ReceiptRow[] | null> = (p) => readReceipts(p),
): Promise<Response> {
  const url = new URL(request.url);
  const payer = (url.searchParams.get("payer") || "").trim();

  const body: Record<string, unknown> = {
    schema: "csoai.receipts.by-payer/0.1",
    as_of: new Date().toISOString(),
    query: { payer: payer || null },
    honesty: {
      empty_is_not_none:
        "An empty list means 'this payer has no receipts'. status UNRECORDED means something " +
        "different and stronger: this deployment has no receipt store bound, so nobody has a " +
        "history here — including one who has paid. Read status before you read count.",
      what_the_signature_covers:
        "Each item carries `receipt`, an x402 offer-receipt JWS signed by " +
        "did:web:csoai.org#board-attestation-1. The signature covers only the fields inside it " +
        "(version, network, resourceUrl, payer, issuedAt, transaction) — NOT amount, asset, " +
        "self or zero_value, which are this endpoint's own bookkeeping and are unsigned. " +
        "Check the JWS, not this envelope: POST it to /api/receipts/verify, or run " +
        "https://councilof.ai/verifier/verify_receipt.py against the public DID document or a retained copy; this checks the signature, not payment settlement.",
      what_a_receipt_is_not:
        "These are payment receipts. /api/receipts/batch serves card-v0 measurement leaves under " +
        "the signed public root, which are a different artefact and are not evidence of payment.",
      what_delivery_evidence_covers:
        "When an item carries delivery, it is an UNSIGNED CSOAI append-only record joined by the " +
        "settlement transaction. response_sha256 and response_bytes identify the exact payload bytes " +
        "the server says it emitted after the settle. It does NOT extend the x402 receipt signature " +
        "and does not prove buyer acceptance, payment finality, semantic truth, or that the buyer retained the bytes.",
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
            "Receipts ARE written now, to REVENUE_KV, one append-only row per settlement. This " +
            "answer means the binding is missing on THIS deployment — a preview build without " +
            "REVENUE_KV, typically — not that the estate records nothing. On production, a payer " +
            "who has settled gets rows and a payer who has not gets an empty list.",
          proof: "GET /api/revenue -> kv_bound tells you whether this deployment has the store",
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

export const onRequestGet: PagesFunction<{ REVENUE_KV?: KVNamespace }> = async ({ request, env }) =>
  handle(request, (p) => readReceipts(p, env?.REVENUE_KV));
