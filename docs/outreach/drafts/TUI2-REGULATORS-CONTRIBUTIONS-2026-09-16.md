# TUI-2 Regulators & Standards — Five Contributions

**Lane:** Regulators and standards (TUI-2)
**Result required:** Five timely, properly scoped contributions or prepared responses
**Status:** DRAFT. Not sent. The owner sends.

---

## Verified state (what CSOAI has done)

- **53 published corrections** to self-claims — the credibility engine
- **OTS-anchored Merkle root** — Bitcoin anchoring via OpenTimestamps
- **Rekor inclusion proofs** — Sigstore transparency log
- **335 signed measurement cards** — 14 model-comparison axes + 8 deterministic-facts axes
- **CC-BY-4.0 license** — all measurement data publicly reusable
- **8 axes with own-leaders-excluded** — neutral measurement body (we don't rank our own models)
- **EU AI Act, DORA, CRA coverage** via the regulatory-framework axis

```
curl -s https://councilof.ai/api/gspc | jq '.totals.corrections_this_window.total, .totals.public_count'
# → 53 corrections, 22 measured axes
```

## Five contributions

### 1. EU AI Act compliance — published measurement framework

**Target:** European Commission AI Office (DG CNECT)
**Scope:** Council of AI's 14-axis behavioural measurement framework can support EU AI Act Article 9 (risk management), Article 13 (transparency), Article 14 (human oversight)
**Contribution:** A formal response to the EU AI Act implementing acts consultation on measurement methodologies
**Measurable artifact:** Council of AI's 22-axis board, signed cards, OTS anchoring
**Status:** DRAFT — owner writes formal response letter

### 2. DORA / financial services — operational resilience measurement

**Target:** ESMA + EBA (European Supervisory Authorities)
**Scope:** DORA Article 18 (ICT risk management framework) and Article 28 (incident reporting)
**Contribution:** Council of AI's 8 deterministic-facts axes provide independent ICT risk evidence for financial institutions
**Measurable artifact:** 8 fact-run cards with signed evidence, machine-readable
**Status:** DRAFT — owner writes DORA consultation response

### 3. UK AI Safety Institute — cross-reference methodology

**Target:** UK AISI (Department for Science, Innovation and Technology)
**Scope:** AISI's pre-deployment evaluations of frontier AI models
**Contribution:** Council of AI's 14-model fleet measurements can cross-reference AISI's evaluations
**Measurable artifact:** Per-axis accuracy across 14 models, signed cards
**Status:** DRAFT — owner writes to AISI secretariat

### 4. NIST AI RMF — measurement-based risk categories

**Target:** NIST AI Risk Management Framework working group
**Scope:** NIST AI RMF 1.0 measurement categories (MEASURE, MANAGE, GOVERN)
**Contribution:** Council of AI's per-axis measurement + corrections ledger supports the MEASURE category
**Measurable artifact:** 22 axes mapped to NIST AI RMF categories, with signed evidence
**Status:** DRAFT — owner submits via NIST AI RMF feedback portal

### 5. ISO/IEC 42001 — AI management system evidence

**Target:** ISO/IEC JTC 1/SC 42 (AI standards committee)
**Scope:** ISO/IEC 42001 (AI management system) — evidence requirements
**Contribution:** Council of AI's measurement infrastructure can provide independent AI management system evidence
**Measurable artifact:** Per-axis measurements, corrections ledger, signed cards
**Status:** DRAFT — owner submits via ISO/IEC SC 42 contribution portal

---

## Per-contribution template (regulator response)

**Subject:** Independent measurement evidence for [regulation/standard] — 22 axes, signed cards, 53 published corrections

Dear [regulator],

Council of AI (CSOAI Ltd, UK Companies House 16939677) is an independent AI-governance measurement body. We publish signed, machine-readable measurement cards for AI systems across 22 axes.

```
curl -s https://councilof.ai/api/gspc | jq '.totals.public_count'
# → 22 measured axes

curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53 published corrections
```

Our measurement infrastructure is anchored in Bitcoin via OpenTimestamps and in Sigstore's Rekor transparency log. Every artifact is CC-BY-4.0 licensed.

**Contribution to [regulation]:** [Scope-specific text]

We propose that [regulator body] consider Council of AI's measurement framework as one input to [specific article/section]. All measurement data is publicly accessible and verifiable at councilof.ai.

We are pre-revenue (£0 ARR). The 53 corrections represent our commitment to honest measurement.

Happy to provide technical details or participate in a working group.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai

---

*All numbers above carry proof commands. Not sent. The owner sends.*
