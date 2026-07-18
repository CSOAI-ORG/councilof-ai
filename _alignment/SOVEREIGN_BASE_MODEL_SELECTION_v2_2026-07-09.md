# BASE-MODEL SELECTION v2 — Qwen3.6-35B-A3B · GLM-5.x · DeepSeek V4 · MiMo-V2.5-Pro
## Updated 2026-07-09 · adds Xiaomi MiMo as a 3rd primary candidate · sibling-Anthropic notes preserved
### CSOAI Ltd · Companion to the Own-Weights Ladder + Merge Kit

> Update to v1 (2026-07-09): adds Xiaomi **MiMo-V2.5-Pro** as a strong 3rd primary
> candidate, alongside Qwen3.6-35B-A3B (primary v1) and GLM-5.x (stretch v1).
> Same discipline: power you can OWN + AFFORD TO ITERATE beats power on a leaderboard.
> Honesty register: same caveats as v1, plus the new MiMo capability claims
> (SWE-Bench Pro, GDPVal-AA) are vendor-published; re-verify on held-out governance
> tasks before commit.

---

## 1. THE 2026 OPEN FRONTIER (web-verified July 2026) — v2

| Model | License | Active / Total | Context | Notable | Footprint |
|---|---|---|---|---|---|
| **MiMo-V2.5-Pro** (Xiaomi) | **MIT** | 42B / 1.02T | **1M** | Beats Claude Opus 4.6 / GPT-5.4 on agentic-coding benchmarks (vendor-claimed, SWE-Bench Pro + GDPVal-AA). 8x cheaper. | Mid-large (multi-GPU) |
| **Qwen3.6-35B-A3B** | **Apache-2.0** | 3B / 35B | 262K | 73.4% SWE-bench Verified, fine-tunes on single 80GB GPU | 1×A100/4090 |
| **GLM-5.2 / GLM-5.1** (Z.ai) | **MIT** | mid-size MoE | long | 58.4% SWE-Bench Pro, coding rivals Claude Opus | 2×A100 |
| **DeepSeek V4 Pro** | **MIT** | mid / 1.6T | long | ~87 BenchLM overall, strongest raw reasoning/math | 4-8×A100/H100 |
| **Kimi K2.6** (Moonshot) | Modified-MIT | ~1T | long | strong agentic / tool-use | multi-GPU |
| Qwen3.5-397B-A17B, Qwen3-235B-A22B | Apache-2.0 | mid-large | long | larger Qwen options | multi-GPU |

**v1 pick unchanged:** Qwen3.6-35B-A3B as the **efficiency-primary** base.
**v1 stretch unchanged:** GLM-5.x as **quality-stretch** (or DeepSeek V4 for ceiling).
**NEW in v2:** **MiMo-V2.5-Pro (MIT)** as a **3rd primary candidate** —

- 1M context = ingest the entire 3,926-example real-data corpus + charters + SIGIL chain in one pass
- MIT license = clean for the paid Tier-2 product (same as GLM)
- 42B active per token = high quality per token, but large footprint
- Vendor-claimed frontier-class agentic coding

The key question: **does MiMo's 1M context + MIT + vendor-claimed frontier capability justify the higher per-run cost** for a Sovereign merge? See §4.

---

## 2. THE KEY INSIGHT (carried over from v1) — power is not the only axis

For a MERGE/fine-tune pipeline on RENTED GPU, three things matter more than raw leaderboard rank:

1. **Fine-tuneable + self-hostable** — rules out the closed frontier. You can only merge/own what ships weights.
2. **License clean for a PAID product** — Apache-2.0 (Qwen open) and MIT (GLM, DeepSeek, MiMo) are the safe ones. Llama's custom license has 700M-MAU clause.
3. **Fits your rented-GPU budget** — MiMo's 42B active is a 1.6T-ish model footprint. 4× the active parameters of Qwen3.6-35B-A3B = 4× the per-run cost. For a merge pipeline you run MANY times, this compounds.

**v1 trap carries over:** picking DeepSeek V4 1.6T or MiMo 1.02T because they're "the most powerful" means £1000s per merge run on multi-GPU. Power you can't afford to iterate on is not power.

---

## 3. THE RECOMMENDATION (v2) — 3-tier, all with proof gates

### TIER A — PRIMARY (cheap-to-iterate, license-clean, single GPU)
**Qwen3.6-35B-A3B (Apache-2.0)** — UNCHANGED from v1.

The right base to BUILD the Sovereign merge on:
- Fine-tuneable + self-hostable (open weights).
- Apache-2.0 — clean for paid Tier-2 product (patent grant included).
- 35B total / 3B active — fine-tunes on ONE 80GB card, runs on a single prosumer GPU. Iterate the merge pipeline MANY times cheaply — the thing that actually matters.
- 73.4% SWE-bench Verified, 262K context — frontier-class capability per active-parameter.
- Direct upgrade of current `qwen3:30b-a3b` — same family, same tooling, newer/stronger.

### TIER B — STRETCH / QUALITY (clean license, frontier-class)
**Two options, pick by what the proof shows:**

- **GLM-5.2 (MIT)** — Opus-class coding, cleanest license, mid-size (fits 2×A100). Best power/cost/license balance at the top end. Stronger than v1's GLM-5.1 since v2 was published.
- **MiMo-V2.5-Pro (MIT)** — NEW. Vendor-claimed frontier-class agentic coding (SWE-Bench Pro, GDPVal-AA), 1M context, MIT. 42B active = 4× Qwen3.6. **The 1M context is genuinely useful** for ingesting the entire real-data corpus + 55 charters + 30 MCPs + SIGIL chain in a single fine-tune context window.

### TIER C — CEILING (raw reasoning, multi-GPU, MIT, expensive)
**DeepSeek V4 Pro (MIT)** — UNCHANGED from v1. 1.6T total, MIT, the raw-reasoning ceiling, but 4-8 GPU, £1000s/run. Only when proven worth it at Tier A or B.

### TIER D — DEFENCE/EDGE (SOV33 Tier 3)
**DeepSeek-R1 distills (MIT)** — keep for the reasoning brain. Unchanged from v1.

---

## 4. MImo-V2.5-PRO — full evaluation as a Tier B candidate

**The case FOR MiMo:**

| Strength | Why it matters for Sovereign |
|---|---|
| **1M context window** | The 3,926-example real-data corpus, 55 charters, 30 MCPs, the SIGIL chain, and a full held-out governance benchmark battery can all fit in one fine-tune pass. Qwen3.6's 262K requires chunking. |
| **MIT license** | Same as GLM — clean for paid product. Better than Llama's 700M-MAU clause. |
| **Vendor-claimed agentic-coding SOTA** | SWE-Bench Pro + GDPVal-AA — relevant to the Sovereign code-reasoning expert if it generalises to governance tasks. Re-verify on held-out governance tasks. |
| **1.02T total, 42B active** | Higher quality per token than Qwen3.6 (3B active), but still tractable on multi-GPU rented clusters. |

**The case AGAINST MiMo (or: when NOT to start with MiMo):**

| Concern | Why it bites the Sovereign build |
|---|---|
| **Per-run cost ~4× Qwen3.6** | 42B active = roughly 4× the LoRA fine-tune compute. £10-20 fine-tune on Qwen3.6 → £40-80 on MiMo. Manageable but compounds over 4 experts (4× per merge). |
| **Vendor-claimed benchmarks** | SWE-Bench Pro and GDPVal-AA are coding/productivity benchmarks. The Sovereign build is for **governance reasoning** — verify before committing. A model that wins on coding may not win on compliance. |
| **Newer / less community documentation** | Qwen3.6 + GLM have months of LoRA + mergekit recipes on HuggingFace. MiMo recipes are sparser. First-iteration cost is higher. |
| **Closed verification path** | Vendor claims on OpenRouter leaderboard ≠ reproducible. The Sovereign runbook gate is: **merge beats base + best expert on real governance tasks**. MiMo's vendor claims don't shortcut that. |

**The verdict on MiMo:**

- **Don't replace Qwen3.6-35B-A3B as Tier A primary.** The cheap-iteration property matters more than the 1M context for the *first* merge proof. The 3,926-example corpus fits comfortably in 262K.
- **DO test MiMo as Tier B stretch** once the Qwen3.6 pipeline is proven (per runbook §5 STEP 2). If the 1M context yields a meaningfully better fine-tune, and the merge still beats base, MiMo is the right ceiling.
- **Verify vendor claims on real held-out governance tasks before spending £40-80 on a fine-tune run.**

---

## 5. THE HONEST BUILD ORDER (v2)

1. **Pipeline proof on Qwen3.6-35B-A3B (Apache-2.0)** — prep → LoRA 4 experts → merge → benchmark on real held-out governance tasks. Cheap, proves the pipeline. **~£20-40.** [STEP 1+2 in runbook]
2. **Real experts on Qwen3.6-35B-A3B** — same 4 experts, real fine-tune. [STEP 2]
3. **Benchmark the merge** vs base + best expert on **real held-out governance tasks** (not the 3-task stub). The non-negotiable proof. [STEP 2 GATE 1]
4. **IF the merge wins AND you want more ceiling:** test on **GLM-5.2 (MIT)** and **MiMo-V2.5-Pro (MIT)** in parallel. Compare honestly. [STEP 3+4]
5. **Never start on DeepSeek V4 1.6T or MiMo 1.02T.** Prove the pipeline cheap first.

The 3-task stub `04_benchmark.py` (per the runbook §6) is the **top-priority gap**. Until it holds 30+ real held-out governance tasks, every verdict is meaningless.

---

## 6. HONESTY REGISTER (v2)
- v1's pick (Qwen3.6-35B-A3B primary) is unchanged. The efficiency discipline applies.
- MiMo's vendor capability claims (SWE-Bench Pro, GDPVal-AA) are **vendor-published, not independently re-verified**. Treat as upper bound until held-out governance benchmark confirms.
- License is load-bearing for Tier 2: stay on Apache-2.0 (Qwen) or MIT (GLM, DeepSeek, MiMo) for anything commercial. Reject Llama.
- The **benchmark battery stub** (`04_benchmark.py` has 3 placeholder tasks) is the single highest-priority gap. Runbook §6 first-move: fix it.
- "Most powerful" (DeepSeek V4 1.6T or MiMo 1.02T) is NOT the right STARTING base — its cost per iteration would exhaust the GPU budget before the pipeline is proven. Efficiency-frontier first, ceiling later.
- MiMo's 1M context is genuinely useful but doesn't replace the need to **prove the merge beats its parts on real tasks** at Tier A.

---

## RECOMMENDATION (v2)

| Tier | Base | When | Cost per merge |
|---|---|---|---|
| **A** | Qwen3.6-35B-A3B (Apache-2.0) | Primary — start here | ~£20-40 |
| **B-1** | GLM-5.2 (MIT) | Stretch (quality + license) | ~£50-100 |
| **B-2** | MiMo-V2.5-Pro (MIT) | Stretch (1M context, frontier-class vendor-claimed) — verify on held-out first | ~£40-80 |
| **C** | DeepSeek V4 Pro (MIT) | Ceiling — only if Tier A+B proven | £1000s |
| **D** | DeepSeek-R1 distills (MIT) | Defence/edge SOV33 Tier 3 | small |

**The strongest base you can OWN and AFFORD TO ITERATE beats the strongest base on a leaderboard.**

Qwen3.6-35B-A3B first. GLM-5.2 and MiMo-V2.5-Pro for the ceiling. Prove, then scale.

---

*Authored for Sir Nicholas Templeman. v2 of the base-model selection adds Xiaomi MiMo-V2.5-Pro as a Tier B candidate with the same discipline: open weights, MIT license, vendor-claimed capability that must be re-verified on the real held-out governance benchmark before committing GPU budget. The first move is still fixing the 3-task stub in `04_benchmark.py`.*
