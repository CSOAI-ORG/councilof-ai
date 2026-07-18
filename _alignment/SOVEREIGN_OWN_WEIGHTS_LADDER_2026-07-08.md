# THE OWN-WEIGHTS LADDER — where "our own model" is REALLY feasible
## Correcting the binary: from-scratch is one rung; there are cheaper rungs that give you weights
### CSOAI Ltd · Authored 2026-07-08 · Grounded in training assets found on disk

> Nick pushed back correctly: I collapsed a spectrum into "from-scratch (no) vs wrap-API (yes)".
> There is a LADDER between them, and several rungs ARE feasible on free/cheap GPU + your data,
> and DO produce your own weights. This brief is the honest, calibrated version. RUNNING/DESIGNED
> split holds; no overclaim; the honesty gate (confirm GPU + data before training) binds.

---

## 1. WHAT YOU ACTUALLY HAVE (verified on disk this session)

- **Training infrastructure (RUNNING scripts):** `train_sovereign_v3.py`,
  `neural_training_pipeline.py`, `retrain_from_real_data.py`, `runpod_train_handler.py`,
  `prep_finetune_dataset.py`, `train_pytorch_models.py`, `bleeding-edge-arsenal/robotics/
  cosmos_farm_trainer.py`, `meok-sigil/_experimental/universal_training.py`. **You have a training
  pipeline already** — this is not greenfield.
- **Compute paths:** M4 Mac 192GB (real, big unified memory — good for inference + light training/
  LoRA), RunPod handlers, Vast.ai deployment configs, Kaggle/Modal (free tiers). Free/cheap GPU is
  reachable. (⚠️ "40-GPU" / free-GPU claims — confirm live before citing as capacity.)
- **Data (RUNNING):** train.jsonl 275 clean persona examples, sigil ledger 1,044, town episodes
  5,040, + the 135,296-signal-file estate corpus. **This is fine-tune / continued-pretrain scale,
  NOT foundation-pretrain scale** — a crucial distinction (below).

## 2. THE LADDER (rungs from cheapest to hardest — where "your weights" lives)

| Rung | What it is | Feasible for you? | Cost | Gives you weights? |
|---|---|---|---|---|
| **0. Prompt/config** | wrap open model, no training | trivially (doing it) | £0 | no |
| **1. LoRA / QLoRA fine-tune** | adapt an open base on your data | **YES — now** | £tens, hours | YES (adapters) |
| **2. Full fine-tune** | update all weights of an open base | **YES** | £100s, days | YES |
| **3. Continued pre-training** | more pretraining of an open base on your corpus | **YES, bounded** | £100s-1000s | YES (real) |
| **4. Model merging / MoE upcycling** | fuse several open models into one new set of weights | **YES — cheap + novel** | £tens | YES (genuinely new weights) |
| **5. Distillation** | train a small model to mimic a big one | **YES** | £100s | YES |
| **6. Foundation model FROM SCRATCH** | new weights from raw data, no base | **NO** | £10M-100M+ | YES but you lose to free |

**The correction:** rungs 1-5 ALL produce your own weights, ALL are feasible on free/cheap GPU +
your data, and rung 4 (merging/upcycling) produces a *genuinely new model* that is arguably
"yours from your configs" — exactly your instinct. Only rung 6 is the infeasible one.

## 3. THE RUNG THAT MATCHES YOUR INSTINCT — #4 MERGING / MoE UPCYCLING

You said "a new model made of our brain-configs and old ideas." That is **literally model merging /
MoE upcycling** — a real, cheap, 2026-mainstream technique:
- **Merge** (SLERP/TIES/DARE): mathematically combine several open models' weights into one new
  set — no training, minutes-to-hours, produces genuinely new weights with blended capabilities.
- **MoE upcycling:** take your best fine-tuned configs and assemble them into ONE Mixture-of-
  Experts model where each expert = one of your brain-configs. **This is "12 mindsets → 1 model"
  as actual weights, not just routing.** Cheap, novel, and defensibly "your own model."
- **Then fine-tune the merged model** on your data (rung 1-2) to make it cohere.

This is the honest version of "build our own model from our configs": **merge your fine-tuned
brain-configs into one upcycled MoE, then adapt it on your governance data.** Feasible on your
existing RunPod/Vast pipeline. Produces real weights. Genuinely novel. NOT $50M.

## 4. THE HONEST LIMITS (so we don't overclaim)

- **Your data is fine-tune scale, not pretrain scale.** 135k signal files sounds big but most is
  code/config, not clean training text; the clean instruction data is ~275-6k rows. That's plenty
  for rungs 1-5, nowhere near rung 6. Don't confuse file-count with training-corpus size.
- **"Free GPU" has limits.** Kaggle/Colab free tiers = hours, small models. RunPod/Vast = cheap
  not free. The M4 192GB is excellent for inference + LoRA, limited for full pretraining. Real,
  but bounded — plan rungs 1-5, not rung 6.
- **A merged/upcycled model needs evaluation** or it's just a blend that might be worse. The
  config-space benchmark (from the feasibility brief) is how you PROVE the merge beats the parts.
- **License hygiene:** merging Apache/MIT bases is clean for a paid product; check each base's
  license before commercial use.

## 5. THE HONEST VERDICT (recalibrated)

- **"Our own weights": YES — via rungs 1-5**, on your existing pipeline + cheap GPU + your data.
  I was wrong to imply "your own model" was off the table; only from-scratch (rung 6) is.
- **The rung that IS your vision: #4 — merge/upcycle your brain-configs into one new MoE**, then
  fine-tune. Genuinely new weights, genuinely yours, genuinely feasible, genuinely novel.
- **Still avoid rung 6** (from-scratch): it's the one that costs everything to lose to free.
- **Both paths run together:** Path B (the Emergence Engine orchestration) + rung-4 (an actual
  merged-weights model underneath it). They're complementary — the engine routes; the merged
  model is a better base for it to route to.

## 6. THE REAL FIRST EXPERIMENT
1. `ollama list` + confirm GPU (RunPod/Vast/Kaggle live) — the honesty gate.
2. LoRA fine-tune ONE brain-config on your governance data (rung 1) — proves the pipeline end-to-
   end, cheap, hours. Uses `train_sovereign_v3.py` + `prep_finetune_dataset.py` (both on disk).
3. Merge 2-3 fine-tuned configs (rung 4, SLERP/TIES) into one model — your first "own weights from
   configs." Benchmark it against the parts (does the merge win?).
4. If the merge wins → that's the seed of the real Sovereign model, and the white paper writes
   itself. If it loses → you learned it cheaply, honestly.

## RECOMMENDATION
Pursue rung 4 (merge/upcycle your configs) as the real "own model" track — feasible, cheap, novel,
and exactly your instinct — ALONGSIDE Path B (the Emergence Engine). Do NOT attempt rung 6
(from-scratch). Start with a single LoRA to prove the pipeline, then the first merge. Quantify
every step. The magic is a merged-weights model of your configs, governed by the engine — and it's
reachable from where you stand.

*Authored for Sir Nicholas Templeman. I was too binary — you were right. Your own weights ARE
feasible: merge your configs, adapt on your data, benchmark honestly. Just not from scratch.*
