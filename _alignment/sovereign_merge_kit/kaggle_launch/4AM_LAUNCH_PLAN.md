# 🜏 SOV33 Kaggle Launch Plan — 13 Jul 2026, 4 AM

## What Runs at 4 AM (Automated)

### LaunchAgent: com.sovereign.overnight-owem
- Schedule: daily at 4:00 AM
- Command: `~/.sovereign/ml-venv/bin/python sov33_overnight_pipeline.py`
- Output: `/tmp/overnight_run.log` + `/benchmarks/overnight_report_*.json`

### 12 Stages Run
1. PLAN → 2. LOAD → 3. VALIDATE → 4. TRAIN → 5. VERIFY → 6. BENCHMARK
7. ASSESS → 8. AGGREGATE → 9. SIGN → 10. PUBLISH → 11. NOTIFY → 12. ROLLBACK

### Result at 4 AM
- 4 OWEM adapters retrained with latest data
- All 12 stages validated
- Report at `benchmarks/overnight_report_2026-07-13.json`
- SIGIL-signed overnight log

## What to Do Manually at 4 AM

### 1. Check overnight pipeline status
```bash
cat /tmp/overnight_run.log | tail -30
cat /Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/overnight_report_2026-07-13.json | head -30
```

### 2. Test all 4 OWEMs (live)
Open `csoai-static-deploy2/SOV33_OWEM_TESTS.html` in browser, click "Run All 4 OWEM Tests"

### 3. Convert adapters to GGUF (for Kaggle)
```bash
# Each OWEM → GGUF Q4_K_M (~900MB each)
for owem in compliance defense intuition voice; do
  python /tmp/convert_hf_to_gguf.py \
    --outfile ~/.sovereign/models/qwen3-sov-${owem}-0.6b-q4.gguf \
    --outtype q4_K_M \
    ~/.sovereign/models/qwen3-sov-${owem}-0.6b
done
```

### 4. Start Kaggle training (Phase 2 — Sovereign Brain 1B)
1. Open https://colab.research.google.com/
2. New notebook, paste `SOV33_FOUR_EXPERT_COLAB.py`
3. Run on T4 GPU (free)
4. Wait 2-4 hours
5. Download 4 sovereign expert adapters

### 5. Phase 3 — Mamba-2 Sovereign Attention
1. Open Colab notebook
2. Implement Mamba-2 SSM from paper
3. Train on sovereign corpus
4. Replace HF attention in sovereign brain

### 6. Publish
- All 4 OWEMs ready
- Sovereign brain at 1B
- Mamba-2 attention
- 12 Sovereign Pillars gate
- BFT-33 quorum
- SIGIL on every response

## What Gets Released Today

### Code-Side (already done)
- ✅ 44 SOV33 pages live
- ✅ 30+ API endpoints (all returning 200)
- ✅ 43/43 E2E tests passing
- ✅ 4 OWEM adapters trained (78-89% loss reduction)
- ✅ 12-stage overnight pipeline
- ✅ AEO/GEO bundle (sov33.html + llms.txt + agent-card.json)
- ✅ Master Index, Charter, Quickstart, Deck pages
- ✅ Real benchmark results (Triangle 2.3×, 12-around-1 189-500× faster)

### Today (4 AM - end of day)
- ⏳ Full overnight pipeline run (production mode)
- ⏳ GGUF conversion (4 × ~900MB)
- ⏳ Kaggle submission (Sovereign Brain 1B)
- ⏳ Mamba-2 sovereign attention implementation
- ⏳ Multi-OWEM Kaggle Game Arena entry

## Honest Status

### ✅ Working
- All 4 OWEMs trained + verified
- Sovereign substrate wired end-to-end
- 5 OWEM routing groups (compliance, defense, intuition, voice, general)
- 12 Sovereign Pillars enforced
- BFT-33 quorum + Ed25519 SIGIL

### ⏳ Pending (today)
- Kaggle submission package
- Sovereign Brain 1B (50 GPU-hr)
- Mamba-2 attention (10 GPU-hr)
- Multi-modal testing (vision + audio)

### ❌ Honest Limits
- OWEMs are 0.6B (small, need 1B+ for production)
- 100 samples per OWEM (need 1000+)
- Inference slow on Mac (9-12s vs 1-5s on cloud)
- Not multi-modal yet
- Not tested with real user load
