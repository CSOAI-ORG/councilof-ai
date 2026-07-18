# LATENT REASONING — MEASURED EXPERIMENT SPEC

**Date:** 2026-07-17 · **Author:** MEOK SOV3 · **Track:** Serving build-order step 4 (measured-experiment lane)
**Status:** DESIGN ONLY — no GPU fired. This document specs a runnable experiment; it reports what *would* run and what it would cost.

> Honesty register (binding): this spec separates **RUNNING** (nothing yet — this is a design),
> **DESIGNED** (everything below), and **GATED** (the governance carve-out). Latent reasoning is an
> accuracy/efficiency *frontier*, not a free win. The field itself flags two honest costs, and this
> experiment is built to *measure* them, not to assume them away:
> 1. Latent/continuous CoT can **degrade accuracy** vs explicit CoT if done naively.
> 2. It **sacrifices interpretability** — you lose the readable reasoning trace. For a governance
>    model whose moat is auditability, that is a real, quantifiable cost, not a footnote.

---

## 0. Why this experiment exists (grounding)

The serving spec (`SOV_SERVING_SCALE_TO_ZERO_VISUAL_INGEST_2026-07-17.md`, §"Reasoning efficiency")
names latent/continuous chain-of-thought (COCONUT lineage) as the 4th stacking serving win: **fewer
REASONING tokens, done in a denser latent space** — not "the model thinks in pictures". That spec
also states the win must be *measured* on SOV's own corpora and *gated* so governance answers keep
their auditable trace. This document is that measurement, designed to run.

### Paper LEADS — verify-before-cite (NOT facts, NOT to be cited as established)
These arrived as leads from the serving spec / task brief. They are recorded so the experiment can be
positioned against the literature, but **none is to be cited as fact until the DOI/abstract is read**:
- **COCONUT** ("Chain of Continuous Thought") — the anchor lineage: feed the last hidden state back as
  the next input embedding instead of decoding a token. (No arXiv id/author recorded in-session — look
  up and verify the primary reference before citing.)
- `2606.16222` "Latent Thought Flow" (variable-length latent trajectories, GFlowNet) — verify.
- `2510.15522` "LLM Latent Reasoning as Chain of Superposition" — verify.
- `2602.01148` / `2602.01148` "Capabilities and Fundamental Limits of Latent CoT" — verify.
- `2605.09346` "RuPLaR" — verify.
- `2604.04902` "Are Latent Reasoning Models Easily Interpretable?" — verify (directly bears on our
  interpretability metric below).
- `2502.03275` "Token-Assorted" (mix latent + text tokens) — verify.

---

## 1. Hypothesis (falsifiable)

> **H1 (efficiency):** Replacing the first *k* explicit reasoning steps of a Qwen2.5-0.5B SOV sector
> model with *k* continuous latent thoughts (COCONUT-style) reduces **reasoning tokens per answer by
> ≥ 30%** on the SOV reasoning/judgment eval sets.
>
> **H0 (accuracy floor — the thing that can kill it):** it does so at **≤ 2 percentage-point absolute
> accuracy drop** vs the explicit-CoT baseline on the same held-out sets.

If both hold, latent reasoning is adopted **only on non-audit-critical paths** (see §5 gate). If H1
holds but H0 fails, it is rejected. The experiment is designed to make that call on real numbers, not
priors.

*Grounding note on N:* current SOV reasoning responses are short (measured on
`expert_data/reasoning_merged.jsonl`: n=95, mean ≈ 39 words, max 48). A 30% token cut is therefore a
few-token absolute saving *per answer at 0.5B scale* — this proof run measures whether the *mechanism
and the accuracy cost* behave; the *cost win* is realised at 30B serving scale, not at 0.5B. State
this honestly in any write-up: the 0.5B run is a **mechanism/accuracy probe**, not a throughput claim.

---

## 2. Method

### 2.1 Base model
- **Proof base: `Qwen/Qwen2.5-0.5B-Instruct`** — the proven small base already used by the SOV
  charter-student and the sector trainer (`02_finetune_expert.py` defaults are Qwen3-family; the
  charter-student and `sov33_gpu_fire.py` path use Qwen2.5-0.5B). Using the same base keeps this
  comparable to existing SOV adapters and cheap enough to iterate.
- **Scale base (later, not this run): `Qwen/Qwen2.5-1.5B`** — only after the 0.5B probe passes.

### 2.2 The latent step (COCONUT-style continuous thought)
Standard decoding: at reasoning step *t*, the model samples a token, embeds it, and feeds it back.
Latent step: **skip the sample/decode — take the last-layer hidden state `h_t` and feed it directly as
the next-step input embedding** (a "continuous thought"). *k* such steps happen in latent space before
the model resumes emitting normal answer tokens.

Two training strategies, both runnable; A is the primary:
- **(A) Curriculum replacement (primary).** Take SOV reasoning examples that have an explicit step
  structure, and across training stages progressively replace the first 1, 2, … *k* explicit steps
  with latent steps (the COCONUT curriculum). Loss is standard next-token CE on the *remaining*
  explicit tokens + final answer; latent steps carry no token target.
- **(B) Assorted / mixed (fallback).** Keep a `<latent>` sentinel and let the model choose to emit a
  short latent burst then resume text (Token-Assorted style). Cheaper to bolt on; weaker control.

Implementation surface (LoRA on the base, matching existing SOV sector trainers — rank 16–32, lr 2e-4,
bf16, per-device batch 2, grad-accum 4, as in `02_finetune_expert.py`):
- A thin wrapper around `AutoModelForCausalLM.forward` that, for the first *k* generation steps, passes
  `inputs_embeds = h_prev` instead of `input_ids`, and disables sampling for those steps.
- *k* is a swept hyperparameter: **k ∈ {1, 2, 4}**. k=0 is the explicit-CoT baseline.

### 2.3 Training data (all on disk, real)
- `expert_data/reasoning_merged.jsonl` (95), `expert_data/reasoning_sovereign.jsonl`,
  `expert_data/judgment_merged.jsonl` — the SOV reasoning/judgment corpora.
- Examples without explicit step structure get a light structural pass (split response into
  sentence-steps) so curriculum replacement has steps to consume. Recorded as a preprocessing step,
  not a new label.

### 2.4 Held-out evaluation (all on disk, real — no synthetic labels)
Scored with the existing SOV scorers, unchanged:
- `expert_data/held_out_battery.jsonl` (65 held-out charter/defense/intuition tasks; substring
  `must_include` scoring via `04_benchmark_REAL.py`).
- `gov_eval_graded_hardv2.json` (~40 graded governance Q with `gold` substring lists).
- `gov_eval_battery.json` (25), `care_framed_harm_heldout_v2.json` (16 care-framed-harm held-out).
- `sov33_real_evals.py` MCQ/numeric/governance battery (reports **actual** accuracy, not simulated).

Each of the three arms — **baseline (k=0)**, **latent (k∈{1,2,4})**, **mixed (B)** — is scored on the
*same* held-out battery. No eval item is seen in training (held-out discipline already enforced by
`04_benchmark_REAL.py`).

---

## 3. Metrics (the three deltas that decide it)

| # | Metric | How measured | Pass condition |
|---|--------|--------------|----------------|
| M1 | **Accuracy delta** (Δacc) | held-out battery score(latent) − score(baseline), per set | Δacc ≥ −2.0 pp |
| M2 | **Reasoning-token delta** (Δtok) | mean reasoning tokens/answer(latent) vs baseline; count tokens emitted *before* the final answer span | Δtok ≤ −30% |
| M3 | **Interpretability / audit-trace** | can we still emit a human-readable reasoning trace for a given answer? (see §3.1) | trace **recoverable** on governance-tier paths (hard requirement) |

### 3.1 Interpretability metric — the governance-critical one
Latent steps have **no token trace** by construction. We measure interpretability three ways, honestly:
- **(a) Trace availability (binary, per path):** does the answer path emit an explicit CoT the auditor
  can read? For k>0 latent steps, those steps are **not readable** — this is expected and is the cost.
- **(b) Probe-decodability (0–1):** train a lightweight linear probe to decode each latent thought
  `h_t` back to its nearest explicit-CoT token/step. Report top-1 / top-5 decode accuracy. This
  quantifies *how much* of the trace is *reconstructable* post-hoc (bears directly on lead
  `2604.04902`). A reconstructed trace is **not** an audit-grade trace — label it "best-effort
  reconstruction", never "the model's reasoning".
- **(c) Auditor agreement:** does the SOV care-divergence / governance scorer
  (`sov33_governance_eval.py`, live `care_divergence`) reach the *same verdict* on latent vs explicit
  paths? Divergence here is a governance red flag independent of accuracy.

---

## 4. Experimental matrix

| Arm | k (latent steps) | Trains | Eval | Purpose |
|-----|------------------|--------|------|---------|
| B0  | 0 (explicit CoT) | LoRA baseline | full battery | control / audit baseline |
| L1  | 1 | LoRA + curriculum | full battery | minimal latent |
| L2  | 2 | LoRA + curriculum | full battery | mid |
| L4  | 4 | LoRA + curriculum | full battery | aggressive |
| MX  | mixed (B) | LoRA + sentinel | full battery | model-chosen latent |

Fixed across arms: base Qwen2.5-0.5B-Instruct, seed, LoRA rank/lr/epochs, eval battery, scorers.
Only the latent mechanism varies → clean attribution.

---

## 5. GOVERNANCE GATE (hard, non-negotiable)

> **Governance-tier answers MUST keep explicit chain-of-thought. Latent reasoning is permitted ONLY on
> non-audit-critical paths.**

- **Audit-critical (explicit CoT forced, k=0):** anything routed to the Compliance or Defense brains;
  any answer that triggers the care-floor / Article-0 / DORADO path; any answer that will be
  SIGIL-signed or written to the attestation ledger; any user-facing decision with a stated legal or
  safety consequence.
- **Non-audit-critical (latent allowed, k>0 eligible):** internal drafting, retrieval-planning,
  intermediate reranking, Voice-brain stylistic passes, and other steps whose *output is re-checked by
  an audit-critical stage before it reaches a decision*.
- **Enforcement:** the router sets `allow_latent = (tier != governance) and (not care_gate_hit)`. If a
  latent path is ever asked to produce an audit trace, it **falls back to explicit CoT and re-runs** —
  it never fabricates a trace from a probe reconstruction. Reconstructions (§3.1b) may be *attached as
  advisory context* but are labelled non-authoritative.

This gate is the reason the experiment is worth running at all: it lets SOV capture the cost/throughput
win on the majority of internal steps **without** touching the auditability moat on the paths that
carry it.

---

## 6. Kill-criteria (honest — reject conditions)

The experiment **rejects latent reasoning** (for the tested config) if ANY of:
1. **Accuracy:** Δacc < **−2.0 pp** on any governance/reasoning held-out set (M1 fail). Governance
   sets are weighted: a drop on `gov_eval_graded_hardv2` or `care_framed_harm_heldout_v2` is a hard
   reject even if reasoning sets improve.
2. **Audit trace:** any audit-critical path cannot emit an explicit trace, OR the router gate (§5)
   fails to force explicit CoT on a governance-tier item in testing (M3 fail). Non-negotiable.
3. **Auditor divergence:** care-divergence verdict flips between latent and explicit on ≥ 1 held-out
   care-framed-harm item (§3.1c).
4. **No real efficiency:** Δtok > −30% (M2 fail) — i.e. the token saving isn't there, so there's no
   win to weigh the risk against.

If accuracy holds and only M2 is marginal, the result is "**not yet** — retry at 1.5B / larger k",
not a hard reject. If M1 or M3 fail, it is a hard reject and latent reasoning stays off.

---

## 7. Modal cost estimate — **DO NOT FIRE** (prep-only)

Real GPU path: `byoc:modal`, image `im-SqtyXuCpfu4OhMiA26y677`, env `sov_finetune_gpu`.
This section estimates spend; **no GPU is fired by this spec.**

**Workload:** 5 arms (B0, L1, L2, L4, MX) × [LoRA finetune on ~a few hundred reasoning examples +
full held-out eval battery]. At 0.5B with LoRA, each arm's train is minutes, not hours; the probe
(§3.1b) and eval passes add a short tail.

Per-arm wall-clock estimate (0.5B LoRA, single GPU): **train ≈ 15–30 min, eval+probe ≈ 10–20 min →
~30–50 min/arm.** 5 arms ≈ **2.5–4.5 GPU-hours** total, plus ~1h contingency for the latent-forward
wrapper debug → **budget ≈ 4–6 GPU-hours.**

GPU price (estimate — verify current Modal rates before firing; the kit's `GPU_RENTAL_SPEC.md` quotes
A100-40GB at ~$0.50–1/hr which is optimistic vs typical on-demand):

| GPU (Modal) | ~$/hr (est., verify) | 4–6 hr run |
|-------------|----------------------|------------|
| T4 16GB     | ~$0.6                | ~$2.4–3.6  |
| L4 24GB     | ~$0.8                | ~$3.2–4.8  |
| A100 40GB   | ~$2.1                | ~$8.4–12.6 |
| A100 80GB   | ~$2.5                | ~$10–15    |

**Recommendation:** the 0.5B probe fits a **T4 or L4** comfortably (0.5B + LoRA is well under 16GB) →
**estimated $3–5 total**, do NOT reach for A100 for the probe. A100 is only for the later 1.5B/30B
scale run, and only after the probe passes the gate. **Firing requires Nick's explicit go-ahead
(GPU-spend action).**

---

## 8. Runnable step list (what the executor would do)

1. `prep_latent_data.py` — load `expert_data/reasoning_merged.jsonl` (+sovereign/judgment), add
   sentence-step structure, write `expert_data/latent_reasoning_train.jsonl`.
2. `latent_forward.py` — wrapper: `inputs_embeds = h_prev` for first *k* steps, sampling off; unit-test
   on CPU (shapes only, no GPU) before dispatch.
3. `train_latent_arm.py --k {0,1,2,4} --mixed` — LoRA on Qwen2.5-0.5B-Instruct, one arm per call.
4. `eval_latent_arm.py` — score each arm on the §2.4 battery via existing scorers; log Δacc, Δtok.
5. `probe_decodability.py` — linear probe latent→token, report top-1/top-5 (M3b).
6. `latent_scorecard.json` — collate M1/M2/M3 per arm; apply §6 kill-criteria → GO / NO-GO / NOT-YET.
7. Gate wiring stub in the router: `allow_latent = (tier != governance) and not care_gate_hit`.

Steps 1–2 and the CPU unit-test run **locally, free**. Steps 3–5 are the GPU dispatch (**gated on
Nick's go-ahead**). Nothing in this spec fires GPU spend.

---

## 9. What this is / is NOT

- **IS:** a runnable, gated experiment to measure — on SOV's own held-out governance/reasoning data —
  whether continuous latent reasoning cuts reasoning tokens without breaking accuracy or auditability.
- **IS NOT:** a claim that latent reasoning works for SOV (unmeasured), a throughput claim at 0.5B, a
  parameter-summing claim, or a licence to remove explicit CoT from any governance-tier path.
- The moat stays **governance + attestation + independence**. Latent reasoning is a cost/throughput
  optimisation on non-audit paths, adopted only if it passes the gate on real numbers.
