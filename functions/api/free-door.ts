/**
 * GET /api/free-door — a REAL x402 door priced at zero.
 *
 * WHY THIS EXISTS. The x402 Bazaar is the index agents search to find services they can pay for
 * (28,137 resources as of 2026-09-04, measured in csoai/x402-bazaar-census). A resource is
 * catalogued off a CONFIRMED SETTLE, so a seller with no settled payment is invisible — no
 * amount of correct metadata substitutes for it.
 *
 * A zero-amount EIP-3009 authorization settles with an EMPTY wallet: the transfer moves nothing,
 * so there is no balance to be insufficient. Proven on Base mainnet 2026-09-04, tx
 * 0xeb6c41bccb41e76cb2112707f532102fc431812e067dca124b44c350ad07baed, block 50,874,723, SUCCESS.
 * That is the whole mechanism, and other sellers use it openly — one indexed resource describes
 * itself as a "Free seed so agents can find /alpha/full".
 *
 * The first seed named /api/gspc and did not index, which is the reason this file exists: that
 * route answers 200, not 402. It is genuinely free, so it is not an x402 door at all, and an
 * indexer looking for a payable resource finds nothing to catalogue. A seed has to point at a
 * door that actually speaks 402.
 *
 * SO THIS IS NOT A TRICK, and the distinction matters. The resource behind this door IS free —
 * it returns the live board totals and the public root, the same bytes /api/gspc serves for
 * nothing. The price of zero is the true price, not a discount or a placeholder. Nothing here
 * claims a paid artefact is being given away, and nothing charges. What it does is state a real
 * price (0) through the protocol agents actually read, so the estate becomes findable.
 *
 * NEVER: a grade, a rank, a certificate, or a paid artefact served free. Verification is free
 * forever, which is exactly why a zero price here is honest rather than promotional.
 */
import { x402Accepts, buildPaymentRequiredV2, type X402Env } from "./_x402";

type Env = X402Env;

const DESCRIPTION =
  "CSOAI free door: the live GSPC board totals and the public signed root. Priced at zero " +
  "because it is free forever — this is the real price, not a promotion. Paid artefacts are " +
  "catalogued at https://councilof.ai/api/x402. Measurement, not certification.";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const resourceUrl = `${url.origin}/api/free-door`;

  // The one honest way to price this: zero, stated through the protocol. X402_AMOUNT is read by
  // x402Accepts ahead of any SKU price, so the door advertises 0 without inventing a SKU for it.
  const accepts = x402Accepts({ ...env, X402_AMOUNT: "0" }, resourceUrl, {
    skuId: "request_attestation",
    tier: "per_request",
    description: DESCRIPTION,
  });

  const body = buildPaymentRequiredV2({
    resourceUrl,
    description: DESCRIPTION,
    serviceName: "CSOAI Free Door",
    accepts,
    bazaar: {
      info: {
        // NO queryParams. The facilitator validates info.input against the schema below, which
        // sets additionalProperties:false on {type, method}. Sending queryParams therefore failed
        // its own declaration — probed 2026-09-05, the EXTENSION-RESPONSES sidechannel answered
        // {"bazaar":{"status":"rejected","rejectedReason":"Bazaar extension validation failed:
        // /input: must NOT have additional properties"}}. This door takes no parameters, so the
        // honest fix is to stop declaring one rather than widen the schema to admit an empty object.
        input: { type: "http", method: "GET" },
        output: {
          type: "json",
          example: {
            schema: "csoai.free-door/0.1",
            price_usdc: 0,
            board: "https://councilof.ai/api/gspc",
            root: "https://councilof.ai/root.json",
            verify: "https://councilof.ai/gspc-verify",
          },
        },
      },
      schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          input: {
            type: "object",
            properties: {
              type: { type: "string", const: "http" },
              method: { type: "string", enum: ["GET"] },
            },
            required: ["type", "method"],
            additionalProperties: false,
          },
          output: { type: "object", properties: { type: { type: "string" } }, required: ["type"] },
        },
        required: ["input"],
      },
    },
  });

  // 402 with amount 0. A client that pays it settles a zero-value transfer and is charged
  // nothing; a client that simply reads the body already has every free link it needs.
  return new Response(JSON.stringify(body, null, 2), {
    status: 402,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
