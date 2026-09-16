# Design Partner Approach 5: Insurance/Reinsurance — "AI risk evidence for underwriting"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** Insurance/reinsurance companies (Lloyd's, Swiss Re, Munich Re, AIG)
**Angle:** Machine-readable AI risk evidence for underwriting decisions
**Verified:** All numbers carry proof commands.

---

**Subject line:** Machine-readable AI risk evidence — 335 signed cards, 22 axes, publicly verifiable

Hi [team],

AI risk is becoming an underwriting question. Council of AI publishes independent, signed measurement cards for AI systems across 22 axes — governance, safety, provenance, continuity, and 18 more.

```
curl -s https://councilof.ai/api/press.json | jq '{cards: .signed_cards.indexed, corrections: .corrections_this_window.total}'
# → 335 cards, 53 corrections
```

**What we offer as a design partner:**

1. **Evidence bundles** — assembled from signed measurement cards with inclusion proofs. Machine-readable, programmatically verifiable. Your underwriting team can integrate the evidence into risk models.

2. **Corrections ledger** — 53 published corrections. Your risk team can track measurement reliability over time.

```
curl -s https://councilof.ai/feeds/corrections.xml | head -5
```

3. **OpenTimestamps anchoring** — every measurement is anchored in Bitcoin. The evidence chain is tamper-evident and publicly verifiable.

4. **x402 payment rail** — pay-per-request USDC on Base. No subscription. Pay only for the evidence you use.

**What this is NOT:**

- Not an insurance product
- Not a risk rating
- Not a compliance certification
- Not a substitute for your own risk assessment

Revenue: 0.02 USDC from one external payer. Pre-revenue.

Happy to provide a demo of the evidence bundle format and discuss integration with your underwriting workflow.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
