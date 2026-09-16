# Design Partner Approach 2: Compliance Teams — "Machine-readable evidence for AI governance"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** Enterprise compliance teams (financial services, healthcare, legal)
**Angle:** Machine-readable evidence for AI governance requirements
**Verified:** All numbers carry proof commands.

---

**Subject line:** Machine-readable AI governance evidence — 335 signed cards, 22 axes, publicly verifiable

Hi [team],

Your AI governance requirements need evidence. Council of AI publishes signed, machine-readable measurement cards for AI systems across 22 axes.

```
curl -s https://councilof.ai/api/press.json | jq '{cards: .signed_cards.indexed, root_leaves: .public_root.leaves}'
# → 335 cards, 305 root leaves
```

**What we offer as a design partner:**

1. **Evidence bundles** — assembled from signed measurement cards with inclusion proofs to the Merkle root. Machine-readable, programmatically verifiable.

```
curl -s https://councilof.ai/api/evidence-bundle | jq .status
# → bundle availability
```

2. **Corrections ledger** — every measurement error is published with the fix. 53 entries. Your compliance team can subscribe to the RSS feed.

```
curl -s https://councilof.ai/feeds/corrections.xml | head -5
```

3. **x402 payment rail** — pay-per-request USDC on Base. No subscription, no lock-in. Pay only for the evidence you need.

```
curl -s https://councilof.ai/api/press.json | jq .commercial_evidence
# → 1 outside payer, 0.02 USDC settled
```

4. **OpenTimestamps anchoring** — every measurement is anchored in Bitcoin. The evidence chain is publicly verifiable.

**What this is NOT:**

- Not a compliance certification
- Not a legal opinion
- Not a substitute for your own assessment

Revenue: 0.02 USDC from one external payer. Pre-revenue.

Happy to provide a demo of the evidence bundle format.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
