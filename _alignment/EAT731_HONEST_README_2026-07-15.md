# EAT-731 SOV-736 SEAL — HONEST README + STATS

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped
- /api/sovereign-readme (GET) — full honest register
- /api/sovereign-stats (GET) — real counts (paths use __file__-relative so Vercel-safe)
- /sovereign-readme.html — visual canvas (6770b)
- Tab 98 wired

## Live measured
- /api/sovereign-readme → 200 (full honest register JSON)
- /api/sovereign-stats → 200 (real counts: 97 nexus tabs, 42 API endpoints, 8 sovereign models listed)
- /sovereign-readme.html → 200 (visual canvas)
- /api/sovereign-ask-real → never 503 (3-tier fallback)
- /api/sovereign-bench → 200 (15-test sovereign binding benchmark)

## Aligned with Claude science audit
- 115 capabilities sibling-shipped (conformal-veto, audit-stage, HORUS, planet-route, LEARN, CHECK_EXISTING, difficulty-route)
- SOV3 base = Qwen2.5-0.5B-Instruct DENSE (not MoE) — honest
- NVIDIA NIM = NOT connected — honest
- mergekit + sentencepiece installed — fusion path equipped

## Honest register
- Real: TF-IDF RAG on 154-fact corpus + binding language + SIGIL receipts + Care Floor 0.95
- Simulated: Full LoRA fine-tune (CPU only), Distillation (GPU), BTX upcycling
- Don't claim: T-count aggregates, weight-merge > best parent, distillation student > teacher, NVIDIA NIM connected
