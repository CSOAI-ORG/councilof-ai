# BASE-MODEL SELECTION — the strongest open models to build the Sovereign merge on
## Deep research, 2026-07-09 · web-verified · picks the base that sets the ceiling
### CSOAI Ltd · Companion to the Own-Weights Ladder + Merge Kit

> Nick's requirement: start with the MOST powerful, advanced, fine-tuneable open models
> available. The research below is web-verified (July 2026). KEY FINDING: the profile's
> qwen3:30b-a3b is a GENERATION BEHIND — the current open frontier has moved. Honesty register:
> benchmark figures are vendor/third-party as noted; re-verify on YOUR task before committing.

---

## 1. THE 2026 OPEN FRONTIER (web-verified July 2026)

The open-weight leaders now, by capability (multiple independent leaderboards):
- **DeepSeek V4 Pro** — tops several open-weight leaderboards (~87 overall on BenchLM); ~1.6T
  total MoE, MIT license. Strongest raw reasoning/math. Needs 4-8x A100/H100.
- **GLM-5.2 / GLM-5.1** (Z.ai) — coding rivals Claude Opus (58.4% SWE-Bench Pro); **MIT license**
  (cleanest for a paid product). Mid-size MoE.
- **Kimi K2.6** (Moonshot) — ~1T, Modified-MIT; strong agentic/coding/tool-use.
- **Qwen3.6-35B-A3B** — Apache-2.0, **35B total / only 3B active**, 73.4% SWE-bench Verified,
  262K context. Runs on a SINGLE consumer/prosumer GPU. The efficiency standout.
- Qwen3.5-397B-A17B, Qwen3-235B-A22B (Apache-2.0) — larger Qwen options.
- Note: **Qwen's very BEST (Qwen3.6/3.7 Plus/Max) is CLOSED** — API-only, NOT self-hostable or
  fine-tuneable. Only the smaller open-weight Qwen you can actually own.

## 2. THE KEY INSIGHT FOR *YOUR* BUILD — power is not the only axis

For a MERGE/fine-tune pipeline on RENTED GPU, three things matter more than raw leaderboard rank:
1. **Fine-tuneable + self-hostable** — rules OUT the closed frontier (Qwen Plus/Max, GPT-5.5).
   You can only merge/own what ships weights.
2. **License clean for a PAID product** — Apache-2.0 (Qwen open, Gemma) and MIT (GLM, DeepSeek)
   are the safe ones. Llama's custom license has a 700M-MAU clause. This matters for Tier 2.
3. **Fits your rented-GPU budget** — a 1.6T DeepSeek V4 or 1T Kimi needs 4-8 datacentre GPUs
   (£1000s/run). A 35B-A3B active-3B model fine-tunes on ONE 80GB card (£100s). For a merge
   pipeline you run MANY times, footprint compounds.

**The trap:** picking DeepSeek V4 Pro because it's "the most powerful" would mean £1000s per merge
run on 8xH100 — you'd burn the budget before the pipeline even works. Power you can't afford to
iterate on is not power.

## 3. THE RECOMMENDATION (honest, two-tier)

### PRIMARY BASE — **Qwen3.6-35B-A3B (Apache-2.0)**
The right base to BUILD the Sovereign merge on:
- **Fine-tuneable + self-hostable** (open weights) — you can actually own the result.
- **Apache-2.0** — clean for the paid Tier-2 product (patent grant included).
- **35B total / 3B active** — fine-tunes on ONE 80GB card, runs on a single prosumer GPU. You can
  iterate the merge pipeline MANY times cheaply — the thing that actually matters.
- **73.4% SWE-bench Verified, 262K context** — frontier-class capability per active-parameter.
- It's the DIRECT UPGRADE of your current qwen3:30b-a3b — same family, same tooling, newer/stronger.

### STRETCH / QUALITY BASE — **GLM-5.1 or GLM-5.2 (MIT)** OR **DeepSeek V4 (MIT)**
Once the pipeline works on Qwen3.6 and you want maximum capability:
- **GLM-5.x (MIT)** — Opus-class coding, cleanest license, mid-size (fits 2xA100). Best
  power/cost/license balance at the top end.
- **DeepSeek V4 (MIT)** — the raw-reasoning ceiling, but 1.6T = 4-8 GPU, £1000s/run. Only when
  proven worth it.

### DEFENCE/EDGE (SOV33 Tier 3) — keep **DeepSeek-R1 distills (MIT)** for the reasoning brain.

## 4. THE HONEST BUILD ORDER (updated with real models)

1. **Pipeline proof on a SMALL Qwen3.6 variant** (or Qwen3.6-35B-A3B if the rented GPU is 80GB) —
   prep -> LoRA 4 experts -> merge -> benchmark. Cheap, proves the pipeline. ~£20-40.
2. **Real experts on Qwen3.6-35B-A3B** (Apache-2.0, single 80GB card) — the primary Sovereign base.
3. **Benchmark the merge** vs base+experts (the non-negotiable proof).
4. **IF the merge wins AND you want more ceiling:** re-run on GLM-5.x (MIT). Compare honestly.
5. Never start on DeepSeek V4 1.6T — prove the pipeline cheap first.

## 5. HONESTY REGISTER
- The profile's qwen3:30b-a3b is a generation behind — **upgrade to Qwen3.6-35B-A3B** as the base.
- Benchmarks cited are vendor/third-party (SWE-bench Verified etc.) — re-verify on YOUR governance
  tasks; a coding benchmark is not a compliance-reasoning benchmark.
- "Most powerful" (DeepSeek V4 1.6T) is NOT the right STARTING base — its cost per iteration would
  exhaust the GPU budget before the pipeline is proven. Efficiency-frontier first, ceiling later.
- Closed models (Qwen Plus/Max) are OUT — not fine-tuneable, not ownable. Your instinct to "own
  our weights" requires open weights, which narrows the field correctly.
- License is load-bearing for Tier 2: stay on Apache-2.0 / MIT for anything commercial.

## RECOMMENDATION
Build the Sovereign merge on **Qwen3.6-35B-A3B (Apache-2.0)** as the primary base — the direct,
current-generation upgrade of what you already run, fine-tuneable, single-GPU, license-clean.
Keep **GLM-5.x (MIT)** as the stretch base for maximum ceiling once the pipeline is proven. Do the
pipeline proof cheap, benchmark honestly, scale only on evidence. That's the strongest open
foundation you can actually own and afford to iterate.

*Authored for Sir Nicholas Templeman. The strongest base you can OWN and AFFORD TO ITERATE beats
the strongest base on a leaderboard. Qwen3.6-35B-A3B first, GLM-5.x for ceiling. Prove, then scale.*
