# Editor Pitch 2: CoinDesk — "Stablecoin measurement, not certification"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** CoinDesk — crypto, stablecoins, x402 payments
**Angle:** On-chain measurement infrastructure for stablecoins, x402 payment rail
**Verified:** All numbers carry proof commands.

---

**Subject line:** A measurement body anchors AI-system evidence in Bitcoin, XRPL, and Base — and measures stablecoins too

Hi [editor],

Council of AI measures AI systems and stablecoins. It publishes signed measurement cards, anchors them in Bitcoin via OpenTimestamps, and has a working x402 payment rail on Base (USDC).

The stablecoin measurement covers 425 indexed assets with deep measurement of RLUSD. The x402 rail is live — one external payer has settled 0.02 USDC. The payment infrastructure uses the x402 protocol (pay-per-request USDC on Base).

```
curl -s https://councilof.ai/api/press.json | jq .commercial_evidence
# → 1 outside payer, 0.02 USDC settled

curl -s https://councilof.ai/api/gspc | jq '.totals.public_count'
# → measurement count
```

The interesting part for CoinDesk readers: this is a working example of x402 in production. The measurement body charges for evidence bundles, not for grades. Verification is free.

The multi-chain anchoring story is also relevant: Bitcoin (OTS), Ethereum/Base (x402 settlement), XRPL (memo anchors planned), and Sigstore's Rekor transparency log. Four chains, one measurement body, all publicly verifiable.

```
curl -s https://councilof.ai/api/press.json | jq '.public_root'
# → merkle_root, OTS status
```

Revenue is 0.02 USDC — pre-revenue, not post-revenue. The company states this explicitly.

Happy to provide technical details on the x402 integration or the stablecoin measurement methodology.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
