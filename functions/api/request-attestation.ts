/**
 * GET /api/request-attestation — paid request-attestation (RAS) via x402.
 *
 * Sell path: pay-to-recompute / re-attest per request — never a rank, never a
 * certificate. Lid: 22 axes · 14 fleets · 3 public leaders · 8 fact runs.
 *
 * Bazaar: declares extensions.bazaar (info + schema). That is how a route becomes
 * discoverable under current CDP / x402 bazaar.md — there is no valid
 * `discoverable: true` field inside the bazaar extension (x402 #2112 / #2207).
 *
 * Settlement stays fail-closed until X402_FACILITATOR_URL (+ X402_PAY_TO) are
 * provisioned. Human rail is Paddle; agent rail is x402. Do not touch Stripe.
 */
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponse,
  CSOAI_LID,
  type X402Env,
} from "./_x402";

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

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const resourceUrl = new URL("/api/request-attestation", origin).toString();
  const subject = (url.searchParams.get("subject") || "").trim();
  const axis = (url.searchParams.get("axis") || "").trim();

  const payment = await verifyX402Payment(request, env as X402Env, resourceUrl);

  if (!payment.ok) {
    const description =
      "Request attestation (RAS): pay-to-recompute / re-attest one subject on the frozen bank. " +
      "Never a rank. Never a certificate. " +
      CSOAI_LID +
      ".";
    const accepts = x402Accepts(env as X402Env, resourceUrl, {
      skuId: "request_attestation",
      tier: "per_request",
      description,
    });
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Request Attest",
      tags: ["attestation", "ras", "measurement", "x402"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        queryParams: {
          subject: subject || "model-or-subject-id",
          ...(axis ? { axis } : {}),
        },
        queryParamsSchema: {
          properties: {
            subject: {
              type: "string",
              description: "Subject to recompute / re-attest (model id, instrument id, or card sha)",
            },
            axis: {
              type: "string",
              description: "Optional axis slug; omit to request the subject-level challenge",
            },
          },
          required: ["subject"],
        },
        outputExample: {
          schema: "csoai.request-attestation/0.1",
          kind: "request-attestation",
          status: "accepted",
          subject: "model-or-subject-id",
          axis: null,
          lid: CSOAI_LID,
          never: ["rank", "certificate", "grade"],
          note: "Paid RAS acknowledgment. Scores are never invented here.",
        },
      }),
      csoai: {
        schema: "csoai.request-attestation/0.1",
        per: "request",
        lid: CSOAI_LID,
        never: ["rank", "certificate", "grade", "score-sale"],
        settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
        verification:
          "x402 facilitator /verify (fail-closed; unverified receipts are refused)",
        not_paid_reason: payment.reason,
        free_verify: "https://councilof.ai/verify",
        free_board: "https://councilof.ai/api/gspc",
        bazaar_note:
          "Listing is free; CDP indexes after first settled payment. Live catalog status is UNCHECKABLE until X402_PAY_TO + facilitator settle exist (and CDP EXTENSION-RESPONSES / #2112).",
      },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  // Paid path: honest acknowledgment only. Never invent scores or ranks.
  if (!subject) {
    return json(
      {
        schema: "csoai.request-attestation/0.1",
        error: "bad_request",
        reason: "pass subject=<id> (and optional axis=) after settlement",
        lid: CSOAI_LID,
        never: ["rank", "certificate", "grade"],
      },
      400,
    );
  }

  return json(
    {
      schema: "csoai.request-attestation/0.1",
      kind: "request-attestation",
      status: "accepted",
      subject,
      axis: axis || null,
      lid: CSOAI_LID,
      never: ["rank", "certificate", "grade"],
      note:
        "Paid RAS acknowledgment for a recompute / re-attest request on the frozen bank. " +
        "This is not a grade, not a rank, and not a certificate. Fresh MEASURED cells appear only " +
        "when a published run exists; this endpoint does not invent scores.",
      free: {
        board: "/api/gspc",
        verify: "/verify",
        one_inclusion: "/api/proof?sha=<64-hex>",
      },
      settlement: "facilitator-verified",
    },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};
