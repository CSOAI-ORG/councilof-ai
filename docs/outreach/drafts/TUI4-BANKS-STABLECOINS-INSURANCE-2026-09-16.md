# TUI-4 Banks/Payments/Stablecoins/Insurance — Ten Targets

**Lane:** Banks, payments, stablecoins, insurance and legacy systems (TUI-4)
**Result required:** Ten sector-specific targets with one concrete measurement wedge each
**Status:** DRAFT. Not sent. The owner sends.

---

## Verified state (what CSOAI measures in the financial sector)

- **8 deterministic-facts axes** (financial family, ADR-001)
- **425 stablecoins indexed**, 1 deep-measured (RLUSD)
- **x402 payment rail live** on Base, USDC, 0.02 USDC settled
- **53 published corrections** (credibility engine)

```
curl -s https://councilof.ai/api/gspc | jq '.totals.fact_runs, .totals.by_family.financial'
# → 8 fact runs, 8 financial axes all measured

curl -s https://councilof.ai/api/press.json | jq '.commercial_evidence.settled_usdc_atomic'
# → 20000 atomic = 0.02 USDC
```

## Ten sector-specific targets

### 1. Circle (USDC issuer)
- **Sector:** Stablecoin issuer
- **Wedge:** Independent measurement of USDC supply and chain distribution
- **Measurable artifact:** Reserve-attestation axis card with signed evidence
- **Status:** DRAFT — owner writes to Circle compliance team

### 2. Tether (USDT issuer)
- **Sector:** Stablecoin issuer
- **Wedge:** Independent measurement of USDT supply across chains
- **Measurable artifact:** Per-chain supply measurement card
- **Status:** DRAFT

### 3. Paxos (USDP issuer)
- **Sector:** Stablecoin issuer (regulated)
- **Wedge:** Independent measurement of regulated stablecoin transparency
- **Measurable artifact:** Regulatory-framework axis card
- **Status:** DRAFT

### 4. Ripple (RLUSD issuer)
- **Sector:** Stablecoin issuer (XRPL native)
- **Wedge:** Daily deep measurement of RLUSD (already happening)
- **Measurable artifact:** Daily RLUSD supply + chain distribution cards
- **Status:** DRAFT

### 5. MakerDAO (DAI issuer)
- **Sector:** Decentralized stablecoin
- **Wedge:** Independent measurement of DAI supply across chains
- **Measurable artifact:** Custody-disclosure axis card
- **Status:** DRAFT

### 6. JPMorgan (Onyx)
- **Sector:** Bank + blockchain (JPM Coin)
- **Wedge:** Institutional-grade AI measurement for compliance teams
- **Measurable artifact:** Evidence-bundle SKU ($250) for compliance reporting
- **Status:** DRAFT

### 7. Stripe (payment processor)
- **Sector:** Payment processor
- **Wedge:** x402 payment integration for machine-payable measurement APIs
- **Measurable artifact:** x402 rail interoperability documentation
- **Status:** DRAFT

### 8. Lloyd's of London (insurance market)
- **Sector:** Insurance market
- **Wedge:** AI risk evidence for underwriting decisions (22 axes of measurement)
- **Measurable artifact:** Per-model risk profile cards
- **Status:** DRAFT

### 9. Munich Re (reinsurance)
- **Sector:** Reinsurance
- **Wedge:** AI risk measurement for systemic risk assessment
- **Measurable artifact:** Aggregate fleet measurement cards
- **Status:** DRAFT

### 10. Visa (payment network)
- **Sector:** Payment network
- **Wedge:** x402 standard integration for agent-payable APIs
- **Measurable artifact:** x402 protocol conformance documentation
- **Status:** DRAFT

---

## Per-target approach script (template)

**Subject:** Independent measurement for [sector] — 8 financial axes, signed evidence, 0.02 USDC settled

Hi [team],

Council of AI measures stablecoins and AI systems used in financial services. We publish signed, machine-readable measurement cards with inclusion proofs.

```
curl -s https://councilof.ai/api/gspc | jq '.totals.fact_runs'
# → 8 fact runs on financial axes

curl -s https://councilof.ai/api/press.json | jq '.commercial_evidence'
# → 1 external payer, 0.02 USDC settled
```

**What we offer as a design partner:**

1. Independent measurement of [specific asset/use case] across our 8 financial axes
2. x402 payment integration for machine-payable measurement APIs
3. Machine-readable evidence bundles for compliance teams

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53 published corrections
```

**What this is NOT:**

- Not certification, accreditation, or compliance assessment
- Not a reserve attestation
- Not a credit rating

Revenue: 0.02 USDC from one external payer. Pre-revenue.

Happy to provide a demo of the measurement methodology.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai

---

*All numbers above carry proof commands. Not sent. The owner sends.*
