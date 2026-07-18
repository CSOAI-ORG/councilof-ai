# 🐉 OOWM (Open Organic World Model) FINE-TUNE SPEC — v1.0

**Model:** OOWM (Open Organic World Model)
**Date:** 2026-06-25
**Decision needed:** Real vs synthetic data

## 1. THE 3 PATHS

### PATH A: SYNTHETIC DATA ONLY (safer, weaker)
- **Source:** synthetic-data-factory.py on VM (532K+ rows generated)
- **Risk:** LOW (no PII, no proprietary leak)
- **Quality:** OK (synthetic has the patterns but not the nuance)
- **Time:** 1 week
- **Cost:** £0 (existing data)
- **Use case:** Demo, prototype, internal training

### PATH B: REAL DATA (riskier, stronger)
- **Source:** 49 GB organic data moat (Companies House PSC, Land Registry, NHS, etc.)
- **Risk:** MEDIUM (PII concerns, requires consent, GDPR review)
- **Quality:** STRONG (real patterns, real noise, real world)
- **Time:** 2-4 weeks (data review + consent)
- **Cost:** Legal review £5-10K
- **Use case:** Production, customer-facing, Series A pitch

### PATH C: HYBRID (RECOMMENDED)
- **Week 1:** Synthetic finetune (532K rows)
- **Week 2:** Eval on real held-out
- **Week 3-4:** Real data finetune (with consent)
- **Week 5:** Final eval, deploy
- **Week 6:** Series A pitch includes "OOWM-EU-AI-Act-v1" as a real product
- **Time:** 6 weeks
- **Cost:** £5-10K legal
- **Use case:** Everything

## 2. OOWM BASE MODEL
- **Architecture:** Mamba-2 + 64-expert MoE + Standard Attention
- **Params:** ~7B (matches openmoe.ai deployment)
- **Tokens/sec:** ~3,000
- **Context:** 8K tokens
- **Already trained on:** 7 SME domains (Sovereign, MEOK, Compliance, etc.)

## 3. FINE-TUNE TARGET
- **Domain:** EU AI Act compliance
- **Tasks:**
  - Classify AI system by risk tier
  - Extract Article references from documents
  - Map Article to implementation steps
  - Generate Watchdog Cert metadata
  - Cross-walk to 13 frameworks
- **Eval:** 100 held-out real attestations, measure precision/recall

## 4. DATA SOURCES (synthetic)
- 532K rows from nyc-311.json (already generated)
- 100K rows from CISA-KEV (in domain_data/)
- 50K rows from EU AI Act text (synthetic)
- 20K rows from CSOAI Watchdog Certs (synthetic)

## 5. DATA SOURCES (real, consent-required)
- 49 GB organic moat
- 1,623 CISA-KEV entries
- 4 GB Companies House PSC
- 22K Land Registry transactions
- 2.3M OS Open Names

## 6. INFRASTRUCTURE
- **Compute:** M4 Mac (16GB) for small fine-tune, GCP VM (15GB) for medium, vast.ai for large
- **Framework:** PyTorch + transformers
- **Duration:** 1-6 weeks depending on data size
- **Eval:** held-out set, dose-response curve accuracy

## 7. RISK MITIGATION
- Synthetic first (no PII, no leak)
- Real data with consent framework (GDPR Art 6 lawful basis)
- Right to erasure (delete finetune data on request)
- Audit log (every fine-tune cycle Ed25519-signed)

## 8. SUCCESS METRICS
- Dose-response curve accuracy: ≥90% vs Claude's verified 511-cycle
- Risk classification precision: ≥95%
- Article extraction recall: ≥85%
- 13-framework crosswalk coverage: 100%

## 9. TIMELINE
- **Week 1:** Synthetic finetune (532K rows)
- **Week 2:** Eval on real held-out
- **Week 3-4:** Real data finetune (with consent)
- **Week 5:** Final eval, deploy
- **Week 6:** Series A pitch includes "OOWM-EU-AI-Act-v1" as a real product

## 10. DECISION NEEDED
**Nick, pick a path:**
- **Path A only** (synthetic, 1 week, £0)
- **Path A + B** (hybrid, 5 weeks, £5-10K legal)
- **Path B only** (real, 2-4 weeks, £5-10K legal)
