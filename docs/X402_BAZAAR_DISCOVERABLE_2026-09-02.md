# x402 Bazaar discoverable routes — 2 Sep 2026

## Routes

| Route | What is sold | Bazaar |
| --- | --- | --- |
| `GET /api/proof?bundle=1` | Proof-bundle (re-serve inclusion proofs) | `extensions.bazaar` declared |
| `GET /api/request-attestation` | Request-attestation (RAS) per request | `extensions.bazaar` declared |

## `discoverable: true` (brief language vs current schema)

Research briefs often say “add Bazaar extension `discoverable: true`”. Under current
[x402 bazaar.md](https://github.com/x402-foundation/x402/blob/main/specs/extensions/bazaar.md)
and CDP “Get discovered” docs, **there is no `discoverable` field**. Maintainers have
warned that `extensions.bazaar.discoverable: true` is invalid and causes failed discovery
(x402-foundation/x402#2112, #2207).

**What we ship instead:** a conformant `extensions.bazaar` `{ info, schema }` on an
**x402 v2** `PaymentRequired` (JSON body + `PAYMENT-REQUIRED` header). That is how a
route becomes discoverable. CDP indexes after the first successful settle through the
CDP Facilitator.

## Price list (ESTIMATE, owner-overridable; surfaces only in 402)

| SKU | Tier | Default USDC (ESTIMATE) | Env override |
| --- | --- | --- | --- |
| `request_attestation` | `per_request` | $0.02 | `X402_PRICE_REQUEST_ATTESTATION_USD` |
| `issuance` (proof-bundle re-serve) | `reserve` | $0.02 | `X402_PRICE_ISSUANCE_RESERVE_USD` |

Never a rank sale. Lid: **22 axes · 14 fleets · 3 public leaders · 8 fact runs · not a certificate**.

## Listing status

**UNCHECKABLE** until:

1. Owner provisions `X402_PAY_TO` + `X402_FACILITATOR_URL` (rail is still fail-closed / mock).
2. At least one successful CDP Facilitator settle carries the echoed `bazaar` extension.
3. CDP `EXTENSION-RESPONSES` / catalog lag is accounted for (known issue #2112).

Public discovery reads need no CDP API key; verifying *our* listing still needs a settle.
