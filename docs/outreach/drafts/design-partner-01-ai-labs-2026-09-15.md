# Design Partner Approach 1: AI Labs — "Measurement infrastructure for your models"

**Status: DRAFT. Not sent. The owner sends.**
**Target:** AI labs (Anthropic, OpenAI, Google DeepMind, Mistral, Meta)
**Angle:** Independent measurement infrastructure for model cards and governance
**Verified:** All numbers carry proof commands.

---

**Subject line:** Independent measurement infrastructure for your model cards — 335 signed cards, 22 axes

Hi [team],

Council of AI publishes independent measurement cards for AI systems. We measure across 22 axes (governance, safety, provenance, continuity, and 18 more) and publish signed, machine-readable evidence.

```
curl -s https://councilof.ai/api/gspc | jq '.totals.public_count'
# → measurement count

curl -s https://councilof.ai/api/press.json | jq '{cards: .signed_cards.indexed, corrections: .corrections_this_window.total}'
# → 335 cards, 53 corrections
```

**What we offer as a design partner:**

1. **Independent measurement** of your models across our 22-axis framework. You get signed measurement cards you can reference in your model cards.

2. **Machine-readable evidence** through MCP, A2A, and x402 interfaces. Your compliance team can programmatically verify every measurement.

3. **Corrections ledger** — we publish when we get something wrong. 53 entries so far. This is the credibility engine.

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53
```

4. **OpenTimestamps anchoring** — every measurement is anchored in Bitcoin. The evidence chain is publicly verifiable.

**What we need from you:**

- Access to your model API for measurement runs
- Review of our measurement methodology (public at /methodology)
- Feedback on which axes are most useful for your model cards

**What this is NOT:**

- Not certification, accreditation, or compliance assessment
- Not a grade for sale — verification is free
- Not a partnership announcement — this is a measurement relationship

Revenue: 0.02 USDC from one external payer. We are pre-revenue and state this explicitly.

```
curl -s https://councilof.ai/api/revenue | jq .commercial_evidence
```

Happy to schedule a walkthrough of the measurement infrastructure.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai
