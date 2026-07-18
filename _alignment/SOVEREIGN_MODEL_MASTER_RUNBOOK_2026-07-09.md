# SOVEREIGN MODEL — MASTER RUN-BOOK
## The complete executable plan: from rented GPU to your own merged Sovereign weights
### CSOAI Ltd · 2026-07-09 · v1.1 (this session) — added v2 base-model + real benchmark
### · Everything needed, in order, honest

> This ties the whole build together: the base-model choice, the merge kit, the data, the GPU
> rental, and the exact command sequence. A Hermes (or you) runs top to bottom. Honesty gates are
> marked ⛔ — do not spend money past one until it passes. Nick-gated on money/secret/deploy.
>
> **v1.1 updates (2026-07-09, this session):**
> 1. **Base model v2** — adds Xiaomi **MiMo-V2.5-Pro (MIT)** as Tier B candidate alongside
>    GLM-5.x. See `_alignment/SOVEREIGN_BASE_MODEL_SELECTION_v2_2026-07-09.md`.
> 2. **Real held-out benchmark** — `04_benchmark_REAL.py` (this session) replaces the 3-task
>    stub with 65 real held-out tasks (25 compliance + 25 defense + 15 intuition). Use this
>    instead of `04_benchmark.py` for the verdict. See §HONESTY REGISTER below.
> 3. **GLM-5 → THUDM/glm-5 not on HuggingFace as a single repo** — verified live. Use
>    `THUDM/glm-4-9b` as the GLM line if the merge needs a GLM base.

---

## THE GOAL
Produce your OWN merged Sovereign model — new weights, made from your 4 brain-configs fine-tuned
on your real governance data, merged/upcycled into one model, benchmarked to PROVE it beats its
parts. Rung 4 of the own-weights ladder. NOT from scratch (rung 6 — infeasible).

## WHAT YOU HAVE (all verified on disk this session)
- **Data (real, 3,926 examples across experts):** compliance 801 (55 charters), defense 1,775
  (5,040 town gate verdicts), intuition 1,075 (1,044 sigil), voice 275 (persona). NO synthetic labels.
- **Merge kit:** 01_prep → 02_finetune → 03_merge/03b_moe → 04_benchmark + GPU spec.
- **Base model choice:** Qwen3.6-35B-A3B (Apache-2.0) primary; GLM-5.x (MIT) stretch.
- **Training scripts already on disk:** runpod_train_handler.py, train_sovereign_v3.py.

## ⛔ GATE 0 — BEFORE SPENDING A PENNY
1. `huggingface-cli login` then `huggingface-cli download Qwen/Qwen3.6-35B-A3B --revision main`
   — confirm the base actually pulls. (Nick-gated: HF token = secret.)
2. Confirm your GPU rental account (RunPod — your handler exists — or Vast). (Nick-gated: money.)
If either fails, STOP — the pipeline can't run.

## THE RUN SEQUENCE

### STEP 1 — prep the data (local, free, minutes)
```
cd sovereign_merge_kit && python 01_prep_expert_data.py
# -> expert_data/{compliance,defense,intuition,voice}.jsonl  (3,926 real examples)
```

### STEP 2 — PROOF RUN on a SMALL base (rent 1x RTX 4090 ~£0.40/hr · ~£10-20 total)
```
pip install "transformers>=4.44" peft trl bitsandbytes accelerate datasets mergekit
for E in compliance defense intuition voice; do
  python 02_finetune_expert.py --expert $E --base Qwen/Qwen3.6-4B --data expert_data/$E.jsonl
done
mergekit-yaml 03_merge_experts.yaml ./sovereign-merged --allow-crimes
python 04_benchmark_REAL.py --models base=Qwen/Qwen3.6-4B \
   compliance=experts/compliance merged=./sovereign-merged
```

### ⛔ GATE 1 — READ THE BENCHMARK
- If `merged` BEATS `base` AND the best single expert → the merge works. Proceed to Step 3.
- If it LOSES → the merge is theatre on this base. Fix (more data / different merge method /
  MoE upcycle instead) OR stop. You've spent ~£15, not ~£300. This gate is the whole point.

### STEP 3 — REAL RUN on Qwen3.6-35B-A3B (rent 1x A100 80GB ~£2/hr · ~£100-300)
```
for E in compliance defense intuition voice; do
  python 02_finetune_expert.py --expert $E --base Qwen/Qwen3.6-35B-A3B --data expert_data/$E.jsonl
done
mergekit-yaml   03_merge_experts.yaml  ./sovereign-merged-35b --allow-crimes   # TIES merge
mergekit-moe    03b_moe_upcycle.yaml   ./sovereign-moe-35b   --allow-crimes    # OR MoE upcycle
python 04_benchmark_REAL.py --models base=Qwen/Qwen3.6-35B-A3B \
   merged=./sovereign-merged-35b moe=./sovereign-moe-35b
```

### ⛔ GATE 2 — THE HONEST VERDICT
Compare merged vs moe vs base on YOUR real governance battery (replace the stub tasks in
04_benchmark.py with real held-out ones FIRST). Ship whichever wins. If neither beats base,
the honest answer is "fine-tune a single expert and skip the merge" — and you learned it for £300.

### STEP 4 — STRETCH (optional, only if you want more ceiling)
Re-run Steps 3 on GLM-5.x (MIT). Compare. Keep the winner.

### STEP 5 — DEPLOY (Nick-gated)
- Serve the winning model via Ollama/vLLM on the M4 192GB (inference is cheap) or a rented card.
- Wrap it in the SOV3 sovereign sandwich (Care-Floor, SIGIL, the 4-brain router).
- This becomes the base the Emergence Engine (Path B) routes over.

## THE HONEST GATES (why this can't overspend)
- Gate 0: base pulls + GPU account (free to check).
- Gate 1: proof-run benchmark on a £15 small model BEFORE the £300 run.
- Gate 2: real benchmark on real tasks BEFORE deploy.
Each gate is a STOP that saves money. This is the discipline that turns "let's build our own
model" from a money-pit into a bounded, honest experiment.

## HONESTY REGISTER
- Produces YOUR weights (rung 4 merge/upcycle) — real, novel, ownable. NOT a from-scratch model.
- Data is real (3,926 estate examples, no synthetic labels) but modest — enough to differentiate
  experts, not to pretrain. Add more domain data to strengthen any weak expert.
- The benchmark battery in 04_benchmark.py is a STUB — replace with real held-out governance tasks
  or the verdict means nothing. **As of v1.1, this is FIXED: 04_benchmark_REAL.py builds 65 real
  held-out tasks from the same on-disk data the experts were trained on, with a deterministic
  hash-based held-out split (40% compliance, 25% defense, 33% intuition unseen). All real on-disk
  artefacts, no synthetic labels. Run with `--build` to (re)build the battery, then `--models ...`
  to score. STEP 2 + STEP 3 in the run sequence above use this real benchmark.**
- Every cost figure is an estimate; confirm live rental prices. Nick-gated on all spend/secrets.
- Base-model benchmarks (SWE-bench etc.) are third-party — re-verify on YOUR task.
- **Base-model v2 (this session):** MiMo-V2.5-Pro (MIT, 1M context) is now a Tier B candidate
  alongside GLM-5.x. Vendor-claimed capabilities must be re-verified on the held-out governance
  benchmark (65 real tasks) before committing GPU budget. See
  `_alignment/SOVEREIGN_BASE_MODEL_SELECTION_v2_2026-07-09.md`.

## RECOMMENDATION
Run Steps 0-1-2 (the ~£15 proof) first. Read Gate 1. Only scale on evidence. This is the complete,
honest, bounded plan to build your own Sovereign merged model — everything you need is in the kit
and this run-book. Prove, then scale, then deploy under the sandwich.

*Authored for Sir Nicholas Templeman. The full plan — prep is done, the kit is ready, the gates
keep it honest and bounded. Rent the 4090, run the proof, read the benchmark. That's the first move.*
