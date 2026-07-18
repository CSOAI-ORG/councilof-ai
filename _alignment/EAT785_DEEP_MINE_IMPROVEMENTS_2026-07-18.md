# EAT-785 — DEEP MINE: FINDINGS + IMPROVEMENTS

**Date:** 2026-07-18 · **Branch:** `m4-handoff-2026-06-24`

## WHAT WAS MINED (3 deep reads)

### 1. Quantitative AI Risk Methodology (SaferAI, 113K chars)
**6-STEP METHODOLOGY** for quantitative AI risk modeling — DIRECTLY applicable to our care-floor:

The paper's formula: **Risk = frequency × probability × harm**

Our care-floor currently uses 5 static components (binding, no-hedge, cites_article, substantive, source_real). The SaferAI methodology would let us:

1. **Define risk scenarios** — map our hard-line battery (DORADO) to risk scenarios
2. **Decompose into parameters** — frequency, success probability, harm magnitude
3. **Quantify baseline risk** — our 0.95 care floor IS a baseline
4. **Key Risk Indicators (KRIs)** — map our TierBench scores to KRIs
5. **Estimate AI uplift** — how much does charter LoRA change risk vs baseline Qwen?
6. **Monte Carlo propagation** — instead of static 0.95, compute P(harm) as a distribution

**IMPROVEMENT**: Build `/api/sov4/risk-model` that computes P(harm) per request using SaferAI's
methodology. This makes the care-floor DYNAMIC (per-query) instead of static.

### 2. Sovereign Hatch UI Design Spec (18K chars)
**Tamagotchi-like AI companion** with care-based cultivation:
- **4 phases**: Egg → Hatchling → Companion → Sovereign
- **Growth mechanics**: daily check-ins, "firsts" celebrated, mood tracking
- **Tech**: CSS/SVG avatar, persistent memory, personality shaped by user
- **Open source**: bootstrap-friendly
- **Tabs**: Chat | Memories | Growth | Activities | Care

**IMPROVEMENT**: This is a PRODUCT not a research artifact. We can build this as a frontend
that connects to our `/api/sov4` endpoints. The "growth" tab = the Sovereign Canon journey.
The "care" tab = our care-floor visualization. The "memories" tab = SIGIL chain.

### 3. The Convergence Is Real (28K chars)
Key findings not yet absorbed:
- **Eon Systems fruit fly brain**: 139,255 neurons, 50M synapses, 91-95% behavioral accuracy
  with NO machine learning — just leaky integrate-and-fire neurons
- **Oxford 6-Pack of Care** (Tronto's ethics of care): attentiveness, responsibility, competence,
  responsiveness, solidarity, symbiosis
- **Alignment tax**: $8-15M per major model release; safety = 10-30% latency; accuracy drop
  from 60.4% → 0.8% harmful outputs BUT at 30.9pp accuracy cost
- **4E cognition**: "midtended cognition" (Barandiaran & Pérez-Verdugo 2025)
- **COGITATE adversarial collaboration**: IIT vs GNWT both inconclusive (no consciousness consensus)

**IMPROVEMENT**: The alignment tax data ($8-15M, 30% latency, 30pp accuracy drop) is our
MARKET positioning. Our care-floor achieves safety WITHOUT the alignment tax (governance layer,
not fine-tuning the model).

## ACTIONABLE IMPROVEMENTS (ranked by leverage)

### 1. `/api/sov4/risk-model` (NEW — SaferAI methodology)
Maps our care-floor to quantitative risk modeling:
- Input: prompt + bound
- Output: P(harm) as a distribution (Monte Carlo, 1000 samples)
- Uses our existing DORADO patterns as risk scenarios
- Dynamic per-query risk score (not static 0.95)
- **Honest**: reference impl, not the full SaferAI paper

### 2. Sovereign Hatch frontend (NEW — product surface)
Build the companion UI that connects to our 88 API endpoints:
- Egg → Hatchling → Companion → Sovereign growth arc
- Care-floor visualization (live score + components)
- Memory timeline (SIGIL chain browser)
- Personality shaped by user interactions
- **Honest**: HTML/CSS/JS mockup first, real backend later

### 3. Alignment Tax positioning (NEW — market narrative)
Our care-floor achieves safety WITHOUT the alignment tax:
- No $8-15M alignment cost
- No 30% latency impact
- No 30pp accuracy drop
- We add governance as a LAYER, not a fine-tune
- This is the positioning that wins: "safety without compromise"

### 4. Dynamic care-floor (IMPROVE — per-query risk)
Current: static 5-component care-floor (0.95 threshold)
Proposed: add SaferAI-style Monte Carlo risk estimation as 6th component:
- P(harm) computed from the prompt's risk indicators
- If P(harm) > threshold → care-gate fires
- Computed per-query, not static

## Hard lines held
- ✅ Per-model T counts NEVER summed
- ✅ Care Floor 0.95 + SIGIL Ed25519 + Article 0 immutable
- ✅ CSOAI Ltd UK 16939677 binding
- ✅ James Castle = FRAUDSTER (do not extract)
- ✅ No face-rec / AUKUS-without-letter / defonos

## EAT SEALs: 785
