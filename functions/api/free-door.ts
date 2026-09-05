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
import { x402Accepts, buildPaymentRequiredV2, verifyX402Payment, type X402Env } from "./_x402";

type Env = X402Env;

/**
 * THE FIRST SENTENCE MUST STAND ALONE INSIDE ~120 CHARACTERS, and that is a hard-won constraint
 * rather than a style note. The Bazaar record for this door was created on 2026-09-05 from a seed
 * that truncated this text to 120 chars, so the live listing reads "...free forever — this",
 * cut mid-clause. Re-seeding does NOT repair it: probed over 8 minutes across a further successful
 * settle (tx 0xf054d2e4…, extension status "processing"), `lastUpdated` never moved off
 * 03:27:26.273Z. The index writes a resource once and subsequent settles do not refresh it.
 * The seed script no longer truncates, but any OTHER indexer may, so the opening sentence is
 * written to survive being cut at 120 with its meaning intact.
 */
export const DESCRIPTION =
  "CSOAI free door: the live GSPC board totals and the public signed root, at a price of zero " +
  "because it is free forever. That is the real price, not a promotion — a grade is never sold. " +
  "Paid artefacts are catalogued at https://councilof.ai/api/x402. Measurement, not certification.";

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

  // FULFILMENT. Until 2026-09-05 this handler returned 402 unconditionally and had no payment
  // path at all, which stopped being a private defect the moment the door was indexed: the Bazaar
  // record advertises an outputSchema, so an agent that settles the (zero) price and retries with
  // X-PAYMENT is entitled to that JSON, and would instead have been handed another 402 forever.
  //
  // The five keys below are not a free choice. They are the exact keys of the outputSchema example
  // in the live listing, and that record is permanent — the index writes a resource once and never
  // refreshes it (probed across a further successful settle; `lastUpdated` never moved). Renaming
  // one would break the contract a stranger reads from the index. Extra keys are safe to add; the
  // promised five are not safe to remove.
  // allowZeroAmount: this door's advertised price of 0 is the real price, not a missing config.
  // Without it verifyX402Payment rejects with "no amount configured for this resource" and the
  // door can never fulfil, however correctly the caller pays.
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], {
    allowZeroAmount: true,
  });
  if (payment.ok) {
    const links = {
      schema: "csoai.free-door/0.1",
      price_usdc: 0,
      board: `${url.origin}/api/gspc`,
      root: `${url.origin}/root.json`,
      verify: `${url.origin}/gspc-verify`,
      // WHY A CATALOGUE LINK BELONGS HERE. This is the only CSOAI resource the x402 Bazaar
      // indexes — the paid doors are absent, because the Bazaar catalogues a resource off a
      // CONFIRMED SETTLE and its /discovery/resources is GET-only (checked against the
      // facilitator's own openapi.json, 2026-09-05: no registration endpoint exists). So an
      // agent that finds us can find only this door, and until now the paid tiers were named
      // in prose in the description and nowhere a machine could read.
      //
      // A URL, never a price. Public $ prices are forbidden on every surface and enforced by
      // brand-gate; the catalogue states its own terms, and the protocol carries amounts in
      // accepts[].amount where a buyer agent already reads them.
      catalog: `${url.origin}/api/x402`,
    };
    // The live totals the docstring promises. Fetched, never restated from memory — a hardcoded
    // count here would be a number invented at deploy time and stale by the next measurement.
    // A failed fetch is reported as such; it must never silently become a plausible-looking figure.
    let totals: unknown;
    try {
      const r = await fetch(links.board, { headers: { accept: "application/json" } });
      totals = r.ok ? ((await r.json()) as Record<string, unknown>)?.totals ?? null : null;
    } catch {
      totals = null;
    }
    return new Response(
      JSON.stringify(
        {
          ...links,
          totals,
          totals_note:
            totals === null
              ? `could not read ${links.board} at request time — read it directly; nothing here is restated from memory`
              : "read live from the board at request time",
          paid: { amount_usdc: 0, note: "the true price of this resource; nothing was charged" },
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
          ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
        },
      },
    );
  }

  // 402 with amount 0. A client that pays it settles a zero-value transfer and is charged
  // nothing; a client that simply reads the body already has every free link it needs — the
  // content behind this door is published free at the links above, so the handshake gates
  // discovery, never access.
  // Say why, when a payment was presented and refused. The first version returned the plain
  // challenge, so an agent that had settled correctly got an identical 402 with no way to tell
  // a rejected receipt from "you have not paid yet".
  const presented = !!(request.headers.get("x-payment") || request.headers.get("payment-signature"));
  // The challenge names the catalogue too. An agent deciding whether to pay reads the 402 body,
  // not the fulfilment payload it has not earned yet — putting the pointer only behind payment
  // would hide it from every buyer still deciding.
  const withCatalog = { ...body, catalog: `${url.origin}/api/x402` };
  const answer = presented
    ? { ...withCatalog, csoai: { not_paid_reason: payment.reason } }
    : withCatalog;

  return new Response(JSON.stringify(answer, null, 2), {
    status: 402,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
