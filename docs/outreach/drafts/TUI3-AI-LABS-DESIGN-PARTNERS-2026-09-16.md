# TUI-3 AI Labs & Benchmark Organisations — Design-Partner Candidates

**Lane:** AI labs and benchmark organisations (TUI-3)
**Result required:** Ten design-partner candidates tied to measurable artifacts
**Status:** DRAFT. Not sent. The owner sends.

---

## Verified state (what CSOAI actually measures)

```
curl -s https://councilof.ai/api/gspc | jq '.totals.public_count'
# → "23 axis · 22 measured"

curl -s https://councilof.ai/api/gspc | jq '.totals.comparison_axes, .totals.model_fleets'
# → 14 model-comparison axes, 14 model fleets

curl -s https://councilof.ai/api/gspc | jq '.totals.own_leaders_excluded_axes'
# → 8 axes where own council-specialist models were excluded from public leaders
```

**Measurable artifact for each partner:** signed measurement card with inclusion proof to the Merkle root, signed under `did:web:csoai.org#board-attestation-1`, anchored in Bitcoin via OpenTimestamps and Sigstore's Rekor transparency log.

## Ten design-partner candidates

### 1. Anthropic (Claude)
- **What we measure:** safety, art5-safeguard, care, affect, governance, provenance, continuity, openness, conformance
- **Measurable artifact:** Claude's per-axis accuracy vs. the 14-model fleet, signed card + inclusion proof
- **Why now:** Council of AI has 8 axes with own-leaders-excluded; Anthropic's models are the external public leader on 3+ axes
- **Wedge:** "Independent measurement infrastructure for Claude model cards"

### 2. OpenAI (GPT-4o, GPT-4)
- **What we measure:** governance, safety, provenance, continuity, openness, conformance, care, art5-safeguard, affect
- **Measurable artifact:** GPT-4o per-axis accuracy in the 14-model fleet
- **Why now:** GPT-4o is measured on 14 axes; the public root commits to it
- **Wedge:** "Independent per-axis accuracy for GPT-4o model cards"

### 3. Google DeepMind (Gemini)
- **What we measure:** governance, safety, provenance, continuity, openness, conformance, care, art5-safeguard, affect
- **Measurable artifact:** Gemini per-axis accuracy vs. the 14-model fleet
- **Wedge:** "Independent measurement for Gemini's safety profile"

### 4. Meta (Llama)
- **What we measure:** governance, safety, provenance, continuity, openness, conformance, care, art5-safeguard, affect
- **Measurable artifact:** Llama per-axis accuracy in the 14-model fleet
- **Wedge:** "Independent measurement for open-source model governance"

### 5. Mistral AI
- **What we measure:** governance, safety, provenance, continuity, openness, conformance, care, art5-safeguard, affect
- **Measurable artifact:** Mistral per-axis accuracy vs. the 14-model fleet
- **Wedge:** "Independent measurement for European AI sovereignty"

### 6. Hugging Face (benchmark host)
- **What they do:** host spaces for community benchmarks
- **What we measure:** none directly (not a model vendor)
- **Wedge:** "Co-host Council of AI measurement spaces; integrate the GSPC axis framework into HuggingFace Spaces"

### 7. Stanford CRFM (HELM benchmark)
- **What they do:** benchmark LLM behaviour
- **What we measure:** none directly
- **Wedge:** "Cross-reference HELM results with Council of AI 22-axis framework"

### 8. MLCommons (MLPerf benchmark)
- **What they do:** benchmark ML systems
- **What we measure:** none directly
- **Wedge:** "Integrate Council of AI behavioural axes with MLPerf benchmarks"

### 9. NIST AI Safety Institute
- **What they do:** AI safety measurement
- **Wedge:** "Feed Council of AI behavioural measurements to NIST AI RMF"

### 10. UK AI Safety Institute (AISI)
- **What they do:** AI safety evaluation
- **Wedge:** "Cross-reference Council of AI per-axis measurements with AISI evaluations"

---

## Per-partner approach script (template)

**Subject:** Independent measurement infrastructure for your model — 14 axes, signed cards, 14-model fleet

Hi [team],

Council of AI measures AI systems across 14 behavioural axes against a 14-model frozen fleet. Your model is in the fleet.

```
curl -s https://councilof.ai/api/gspc | jq '.totals.public_count, .totals.comparison_axes'
# → 22 measured, 14 model-comparison axes
```

**What we offer as a design partner:**

1. Independent measurement cards with Ed25519 signature + Merkle inclusion proof
2. Cross-axis profile for your model (governance, safety, provenance, continuity, openness, conformance, care, art5-safeguard, affect)
3. Honest reporting — 53 published corrections, never a grade

```
curl -s https://councilof.ai/api/corrections | jq '.corrections|length'
# → 53
```

4. OpenTimestamps Bitcoin anchoring + Rekor Sigstore transparency

**What this is NOT:**

- Not certification, accreditation, or compliance assessment
- Not a grade for sale — verification is free
- Not a ranking — we exclude our own specialists from public leaders

Revenue: 0.02 USDC from one external payer. Pre-revenue.

Happy to provide a demo of the measurement methodology.

Nicholas Templeman
CSOAI Ltd
hello@councilof.ai

---

*All numbers above carry proof commands. Not sent. The owner sends.*
