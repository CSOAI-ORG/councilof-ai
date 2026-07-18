# MAKE-IT-REAL: THE MERGE PLAN — how the generals become actual experts
## MEOK-SOV3, 2026-07-10 · the honest sequence, costs, and gates

## WHERE WE ARE (verified on disk this session)
- TWO-TIER BRIDGE runs: 12 governance generals gate, 9 domain experts execute, Care-Floor vetoes
  hold, SIGIL verifies True. BUT: all tiers are PERSONAS OVER ONE BASE (qwen2.5:3b). Not yet
  separate weights.
- MERGE KIT is staged and real: expert data built from YOUR data (no synthetic) —
  compliance=801 (55 charters), defense=1,775 (5,040 gate verdicts), intuition=1,075
  (1,044 sigil), voice=275 (persona). TIES merge YAML on Qwen3.6-35B-A3B. Benchmark + MoE upcycle.
- The ONLY missing thing is the GPU run. Everything upstream is code-complete.

## THE GAP, PLAINLY
"Personas over one model" != "merged expert model". To make the generals REAL you must:
  (1) fine-tune each expert as its OWN LoRA/weights on its data,
  (2) merge them (TIES) into one model that carries all four competences,
  (3) prove the merge beats its parts on a held-out governance benchmark.
This needs a GPU. It cannot be faked and I won't pretend the bridge already did it.

## THE SEQUENCE (each step gated — stop if a gate fails)
STEP 0 — Base pull (Nick-gated, ~30 min, free)
  huggingface-cli download Qwen/Qwen3.6-35B-A3B   (or the 4B for the £15 proof first)
  GATE 0: model card + tokenizer load clean.

STEP 1 — Prep expert data (DONE, free, local)
  python 01_prep_expert_data.py  -> expert_data/{compliance,defense,intuition,voice}.jsonl
  GATE 1: 4 files, row counts match the numbers above, 0 malformed.

STEP 2 — THE £15 PROOF RUN (the POC — 1x RTX 4090 ~£0.40/hr, ~a few hrs)
  Fine-tune ONE small expert (compliance) on the 4B base to prove the pipeline end-to-end.
  python 02_finetune_expert.py --base Qwen/Qwen3.6-4B --expert compliance
  GATE 2: LoRA trains, loss drops, adapter saves, inference loads. Proves the machine works.
  ^ THIS is the proof-of-concept. Not a shippable model — a proven pipeline.

STEP 3 — FULL FOUR-EXPERT RUN (1x A100 80GB ~£1.50-3/hr, ~£100-300 total)
  Fine-tune all 4 experts on the real 35B-A3B base.
  GATE 3: 4 adapters save; each beats base on ITS OWN domain slice.

STEP 4 — MERGE (TIES, CPU-ok or same box, ~1 hr)
  mergekit-yaml 03_merge_experts.yaml ./sovereign-merged
  GATE 4: merged model loads, generates coherently, keeps the Sovereign voice.

STEP 5 — PROVE IT (the benchmark that MUST be real — 04_benchmark_REAL.py)
  Held-out governance tasks from charters + passport MCP ground truth.
  GATE 5 (the only one that matters for claims): merged >= best single expert on the held-out set.
  If it doesn't beat its parts, the merge earned nothing — say so, don't ship.

STEP 6 — SERVE (Oracle ARM once VCN subnet set, or the GPU box)
  Wire the merged weights into OWEM L4 (replace qwen2.5:3b). NOW the generals are real experts
  under the governance you already proved.

## WHAT IT COSTS (honest)
- Proof (Step 2): ~£15, one afternoon, 1x 4090. Proves the pipeline.
- Real model (Steps 3-5): ~£100-300, 1x A100. Produces the shippable merged model.
- Serving (Step 6): free on the Oracle ARM (once you set a VCN subnet) or cheap on the GPU box.

## COMPUTE: ORACLE vs VAST — the honest split (revised 2026-07-10)
The free Oracle ARM A1 is CPU-ONLY (4 ARM cores, 24GB, $0/mo). It CANNOT fine-tune a 35B model —
that needs an 80GB CUDA GPU. So:
- SERVE the finished merged model on the FREE Oracle ARM box (once VCN subnet set) — $0, sovereign.
- TRAIN on a GPU. Two sub-paths:
  (a) ORACLE GPU (VM.GPU.A10/A100/H100) — cleaner (you're already authed) BUT needs a service-limit
      increase (quota approval, ~1-2 days, sometimes denied on new/free tenancies). Check first:
        bash ~/clawd/bin/oracle_gpu_check.sh          # paginates ALL pages, greps GPU quota
      If quota >= 1:  SUBNET=<ocid> bash ~/clawd/bin/oracle_train.sh   # provisions the GPU box
  (b) VAST/RunPod — instant, no quota wait, ~£0.40/hr for the £15 proof. Use for the one-off if
      Oracle GPU quota is zero; then move the merged weights to the free ARM box to serve.
NOTE: my earlier single-page quota query returned empty — that was PAGINATION (Oracle said
"not all resources returned, use --all"), NOT proof of zero GPU. oracle_gpu_check.sh fixes that.

## THE TWO THINGS ONLY YOU CAN DO
1. Pull the base weights (HF account / disk) — Nick-gated.
2. Provide the GPU: run oracle_gpu_check.sh — if Oracle has quota we train there (no Vast needed);
   if not, rent Vast/RunPod for the one-off. I have the exact scripts; I can't spend your money.

## HONEST BOTTOM LINE
The architecture is proven and runs. The merge kit is code-complete on YOUR real data. The path
to real experts is 6 gated steps, ~£15 to prove and ~£100-300 to ship. It is NOT AGI — it is a
governed, sovereign, multi-expert model that beats its parts on governance tasks, or we don't
ship it. That's the whole, honest play.
