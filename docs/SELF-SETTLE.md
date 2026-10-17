# SELF-SETTLE — the post-merge $0.001 settlement per route (the settlement IS the listing)

**DO NOT RUN FROM THIS RUNBOOK'S COMMIT. NO SPEND IS AUTHORIZED.** This is the owner's
post-merge sequence: one self-settled $0.001 test call per priced route. It is run by the owner
(or an operator with the owner's explicit go), never automatically, never by an agent lane.

**Why a self-settle at all.** The x402 Bazaar indexes a resource off a CONFIRMED SETTLEMENT, not
off metadata (x402-foundation/x402#2156, PayAINetwork/x402-solana#36): **the settlement IS the
listing.** Until one payment settles against a route, that route stays invisible no matter how
correct its `/.well-known/x402.json` entry is. This estate proved the mechanism with the zero-amount
free door (tx `0xeb6c41bccb41e76cb2112707f532102fc431812e067dca124b44c350ad07baed`, Base mainnet,
SUCCESS) and re-learned it on 2026-09-08 with the single non-self payer. A self-settle is a
**ZERO-VALUE PROBE classification** in the settlement ledger (`ZERO_VALUE_PROBE` / `INTERNAL_SELF_FUNDED`),
recorded but never counted as revenue and never as a buyer.

## Amounts

- The authorization MUST name exactly the amount the 402's `accepts[]` advertises. Your wallet signs
  what the challenge says and nothing else.
- **Target test amount: $0.001 = 1000 atomic USDC (6 decimals).** To make the test call cost
  $0.001, run against a preview deployment where the owner has set `X402_AMOUNT=1000`
  (Pages → Settings → Environment variables → Preview), **or** accept the live challenge amount
  (the launch campaign on existing-data doors advertises 10000 atomic = $0.01 USDC until
  2027-01-11). Never re-price production for a test.

## Prerequisites

- A SELF wallet the estate controls, funded with ≥ $0.02 USDC on Base. Add its address to the
  Pages env `X402_SELF_WALLETS` so the settlement is classified SELF and can never pollute revenue.
  Never commit its key (pr-gates' wallet-credential-gate blocks that; see tui4-x402-test/KEY-COMPROMISED.md
  for why).
- `jq`, `curl`, and one x402 signer. The only non-curl step is step 2 (signing the EIP-3009
  `transferWithAuthorization`); use any x402 client (`@x402/fetch`, the `x402` CLI) or the
  machine-readable walkthrough at `https://councilof.ai/quickstart.json`. Do NOT use
  `tui4-x402-test/sign-payment.cjs` — that wallet's key is burned.

## The exact sequence (one route; loop at the bottom)

```bash
BASE=https://councilof.ai
ROUTE='api/request-attestation?subject=qwen3'   # pick from PRICES.json `route`

# ── 1. read the live challenge (the amount lives ONLY here) ─────────────────────────
curl -sS -o 402.json -D hdrs.txt "$BASE/$ROUTE"
jq '{resource, accepts: .accepts[0] | {scheme, network, amount, asset, payTo, extra}}' 402.json
# expect: scheme "exact", network "eip155:8453" (or "base"), asset 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,
#         extra.name "USD Coin" (the EIP-712 domain you sign under), payTo 0x212686404A7D1E1fD88F35e…,
#         amount = the challenge's atomic amount (1000 for a $0.001 test on a X402_AMOUNT=1000 deployment)
# also present (the discovery repair): extensions.bazaar = {info, schema} with input + inputSchema
#         + outputSchema at the paths indexers read.

# ── 2. sign and settle (the ONE non-curl step) ──────────────────────────────────────
# Sign an EIP-3009 transferWithAuthorization for accepts[0].amount to accepts[0].payTo under the
# USD Coin v2 domain, with a fresh validAfter/validBefore + nonce, then have your x402 client wrap
# it into the X-PAYMENT envelope (x402Version 2, resource non-null — our /settle backfills it
# server-side if a client leaves it null, per x402#2156).
# With the x402 CLI this is one call:
#   x402 pay --url "$BASE/$ROUTE" --amount <accepts[0].amount>   # or your client's equivalent

# ── 3. retry the resource with the payment envelope ────────────────────────────────
curl -sS -o paid.json -D paid-hdrs.txt \
  -H "X-PAYMENT: $X_PAYMENT_B64" \
  "$BASE/$ROUTE"
# expect: HTTP 200, the paid artifact in paid.json, and the header
#         X-PAYMENT-RESPONSE: base64 JSON SettlementResponse (transaction, network, payer) —
#         plus extensions["offer-receipt"].info.receipt (JWS) when the Pages signing key is provisioned.
# verify it yourself, free: curl -sS -X POST https://councilof.ai/api/receipts/verify -d @paid.json
```

## What to expect on our side (the listing event)

- The facilitator's `/settle` response carries the sidechannel
  **`EXTENSION-RESPONSES: {"bazaar":{"status":"processing"}}`** — that is the facilitator telling US
  the Bazaar indexing has been queued. Per spec it is server-internal and is never forwarded to the
  buyer; `readBazaarOutcome()` in `functions/api/_x402.ts` reads it and reports `REPORTED`
  (with the facilitator's exact detail), `UNREPORTED` (the facilitator said nothing — which is NOT
  the same as not indexed) or `UNREADABLE`. Nothing is ever inferred.
- `{"bazaar":{"status":"processing"}}` means QUEUED, not listed. The index writes a resource once
  and later settles do not refresh it (measured 2026-09-05: `lastUpdated` never moved across 8
  minutes and one further settle).

## Readback (prove the listing, per route)

```bash
# our own conformance index (signed when available):
curl -sS "$BASE/api/x402/index" | jq '{state, index: .index | type}'
# one-resource conformance check of the exact resource URL:
curl -sS "$BASE/api/ras/x402-check?url=$BASE/$ROUTE" | jq '{state}'
# then search the two public Bazaars (CDP, PayAI) for payTo 0x212686404A7D1E1fD88F35e… before
# claiming discoverability anywhere. Appearing in an index is not delivery.
```

## Loop: one $0.001 call per priced route

```bash
jq -r '.rows[].route' PRICES.json | while read -r ROUTE; do
  echo "── $ROUTE"
  # steps 1–3 + readback above, with ROUTE as-is
done
```

Honesty rules carried into every report of this run: a self-settle is recorded as SELF and never as
revenue or a buyer; "the settlement IS the listing" is the x402 indexers' rule, not a claim that any
sale occurred; measurement artifacts, never grades.
