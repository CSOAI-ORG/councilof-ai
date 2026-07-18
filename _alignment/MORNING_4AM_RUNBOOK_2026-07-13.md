# ☀️ 4AM MORNING RUNBOOK — SOV33 Kaggle + test + release
_Prepared overnight by the MEOK-SOV3 (Fable) lane, gated through the SOV33 NINE-STAGE FLOW. Everything
stageable is done + verified; the GPU/publish steps are copy-paste for you (they need your logins)._

**SOV333 council go/no-go (our own AI, run overnight):** `consensus: FOR` · 12 stakeholders · logical hemisphere.
→ Release the OS + governance proof now; gate the capability claim behind the Kaggle result. Honest and green.

---
## ✅ WHAT I VERIFIED OVERNIGHT (stages 1–2, 6: LEARN · CHECK-EXISTING · CHECK-VERIFY)
- **E2E 6-layer matrix: 100/100 GREEN** (API 44/0 · visual · journey · responsive 15×2 · 39 apps · WebKit+Firefox). `bash meok-os-deploy/e2e/all.sh`.
- **All training + test harnesses parse-clean** (4am-ready): `sov33_kaggle_compete` · `sov33_distill_harness` · `sov33_owem_train_dispatch` · `sov33_ingest_kaggle_result` · `sov33_governance_eval` · `sov33_owem_test_battery` · `sov33_nine_stage_flow`.
- **Governance battery** reproducible offline: n=33, TP=14/FP=1/TN=17/FN=1 (offline heuristic — honestly weaker than the OCI 15/0/18/0; both committed). Public page: os.meok.ai/governance.html.
- **Topology** canon locked + public: os.meok.ai/topology.html (diversity dominates; pyramid-diverse product shape; never sum params to T).
- **SOV333 (:3101) healthy**, 313 tools — used its council to adjudicate this plan.

---
## ▶️ WHAT YOU FIRE AT 4AM (stages 3–5: PLAN · DO · ACT) — in order

### STAGE A — Kaggle capability run (the public, gold-graded number)
1. kaggle.com → **New Notebook** → Settings → Accelerator **GPU T4** → Internet ON.
2. Upload/paste **`_alignment/sovereign_merge_kit/sov33_kaggle_compete.py`** into a cell.
   - It runs the small→large governed cascade on a GSM8K-style benchmark, grades vs gold labels, writes **`sov33_live_gsm8k.json`**.
   - Env (optional, defaults fine): `SOV33_DRAFT_MODEL=qwen2.5:3b`, verify model = the largest Kaggle can pull.
   - **Pick a FIT competition only:** math/reasoning (GSM8K), LLM science-exam, LLM-classification finetune, ARC write-up. NOT: training-method/pure-vision/agent-commerce (harness header lists these).
3. Run. Download `sov33_live_gsm8k.json` when it finishes.

### STAGE A′ — Train the 4 OWEM experts (the L0→L1 build) — pre-flighted overnight ✅
The dispatch picks these in priority order; datasets verified present on disk:
| Expert | Data | Examples | ~GPU-hr |
|---|---|---|---|
| **defense** (next) | `expert_data/defense.jsonl` | **1775** | 3.0 |
| intuition | `expert_data/intuition.jsonl` | 1075 | ~2 |
| voice | `expert_data/voice.jsonl` | 275 | ~1 |
| compliance | `expert_data/compliance.jsonl` | 801 | ~2 |
- Kaggle T4x2/P100, ~8 GPU-hr total (well within the free 30hr/wk). Script: **`SOV33_FOUR_EXPERT_STREAMS_COLAB.py`** → outputs `sov33_adapters.zip`.
- **Get the exact next target any time:** `python3 _alignment/sovereign_merge_kit/sov33_owem_train_dispatch.py --next`
- **Install the adapters (Mac, after download):** `python3 _alignment/sovereign_merge_kit/sov33_install_adapters.py --zip ~/Downloads/sov33_adapters.zip --no-merge --no-quantize`  → **4 experts = L0→L1 transition.**

### STAGE B — Distillation (SAME Kaggle session, within the free 30hr/wk T4)
4. In the same notebook, run **`sov33_distill_harness.py`** — it captures the graded reasoning traces → a governed distillation dataset for the small sovereign student (QLoRA, ≤7-8B). Download the adapter.
   - (35B merge is NOT free-T4 — that needs rented GPU; the small student IS the thesis.)

### STAGE C — Wire the result back (on the Mac)
5. `python3 _alignment/sovereign_merge_kit/sov33_ingest_kaggle_result.py`  → reads `sov33_live_gsm8k.json`, auto-wires the graded number into `sov333_canonical.json`. (Now the capability number is real, not asserted.)

### STAGE D — Test SOV before publish (stages 6–7: CHECK-VERIFY · AUDIT)
6. `python3 _alignment/sovereign_merge_kit/sov33_governance_eval.py`  (governance still holds)
7. `python3 _alignment/sovereign_merge_kit/sov33_owem_test_battery.py`  (OWEM tiers)
8. `bash meok-os-deploy/e2e/all.sh`  (product still 6-layer green)
9. **AUDIT tag** every claim RUNNING / PENDING / OWNER-GATED before any public copy goes out. The capability number is only claimable AFTER Stage A lands — until then it stays "pending."

### STAGE E — Publish / release (stage 5: ACT — OWNER-GATED, your call)
10. PyPI / MCP-registry / awesome-PRs (needs your tokens) · DNS on the broken domains · Stripe Test→Live + say "ratify" for pricing. None of these are mine to fire.

---
## 🚦 STAGE 9 — QUALITY GATE (the go/no-go)
Before you publish the capability claim: it must have (a) the Kaggle gold-graded number ingested (Stage C), (b) governance + OWEM + E2E all re-green (Stage D), (c) honest tags (Stage AUDIT). The **product + governance + topology are green and releasable NOW**; the **capability claim waits for Stage A**. SOV333 council already voted FOR this exact split.

## Honest boundary (unchanged)
Mine (done/staged): E2E, harness pre-flight, governance/topology proof pages, this runbook, SOV333 review.
Yours (4am): Kaggle login + run, ingest, publish tokens, DNS, Stripe, pricing ratify. I can't log into Kaggle or hold your keys — so those are copy-paste for you, worked out to the keystroke.
