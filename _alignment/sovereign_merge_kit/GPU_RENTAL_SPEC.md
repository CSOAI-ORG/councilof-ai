# GPU_RENTAL_SPEC — exactly what to rent, where, cost (2026)

## THE HONEST SIZING

| Stage | Model size | GPU to rent | VRAM | Rough cost |
|---|---|---|---|---|
| **Pipeline proof** (DO THIS FIRST) | Qwen3.6-4B | 1x RTX 4090 / A5000 | 24GB | ~£0.30-0.50/hr · £5-15 total |
| Real experts (mid) | Qwen3.6-8B | 1x A6000 / L40S | 48GB | ~£0.80-1.20/hr · £20-40 |
| Full experts | Qwen3.6-35B-A3B | 1-2x A100 80GB | 80-160GB | ~£1.50-2.50/hr each · £100-300 |
| MoE upcycle (30B) | 4x30B experts | 2x A100 80GB or H100 | 160GB+ | £150-400 for the run |

## WHERE TO RENT (you said you can rent — these are the real options)
- **RunPod** — you already have `runpod_train_handler.py` on disk. Best fit. Pods + serverless.
- **Vast.ai** — you already have `vast-ai-deployment/` configs. Cheapest spot GPUs.
- **Lambda / Modal / Together** — clean but pricier. Modal has a free-tier credit to start.
- Start on RunPod (your handler exists) with ONE 4090 for the pipeline proof.

## THE COST-DISCIPLINED SEQUENCE (do not skip step 1)
1. Rent ONE 4090 (~£0.40/hr). Run the WHOLE pipeline on Qwen3.6-4B: prep -> finetune 4 experts ->
   merge -> benchmark. Total ~£10-20. This proves the pipeline end-to-end.
2. Read the benchmark. If the merge beats base+experts -> scale up. If not -> you saved £280 by
   not running it on 30B first. HONEST GATE.
3. Only then rent A100s for the 30B run.

## SETUP (once, on the rented box)
```
pip install "transformers>=4.44" peft trl bitsandbytes accelerate datasets
pip install mergekit          # or: pip install git+https://github.com/arcee-ai/mergekit.git
huggingface-cli login         # to pull the base model  [Nick-gated: uses your HF token]
```

## HONESTY GATES (before spending money)
- Confirm the base model pulls (`huggingface-cli download Qwen/Qwen3.6-4B`).
- Your per-expert data is thin (275 shared examples) — ADD domain data (town/charters/sigil) or
  the experts won't diverge enough to make merging meaningful. Weak experts -> weak merge.
- The benchmark battery here is a stub — replace with REAL held-out governance tasks or the
  numbers mean nothing.
- Nick-gated: renting GPUs + HF token = money/secret actions. Your call to spend.
