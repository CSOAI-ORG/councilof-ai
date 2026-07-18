# OWM-SPARSITY BUILD SPEC — the one buildable synthesis (2026-07-18)

**What this is:** the single buildable architecture that falls out of this whole session, written
against the composition graph, the KDA-decorrelation probe (ρ=0.82), the bleeding-edge technique
map, and Charter Principle I (balance-of-forces). Every claim carries its honesty tag.

**Honesty register (hard, applied throughout):**
- **RUNNING** = ran this session and read the output artifact.
- **DESIGNED** = spec on paper; not built, not run.
- **measured-NEGATIVE / INCONCLUSIVE** = we ran it and it did *not* clear, or left too little variance to decide.
- NO param-summing (three 2.8T models are not 8.4T). NO emergence (5 nulls closed). Paper efficiency
  numbers are THEIR scale, never ours. Our own attention-leg test came back NEGATIVE/INCONCLUSIVE at toy scale.

---

## 1. WHAT ONE OWEM IS

One OWEM (Organic Open-World Model unit) is **not** a from-scratch foundation model. It is a
sovereign sandwich around an open-weight base, built from three composable layers plus a governed
center:

1. **Sparse MoE base (capacity layer).** Capacity goes UP by adding experts; **active params per
   token stay FLAT** because the router fires only k experts. This is the honest way to grow
   capability without growing per-token FLOPs — and it is the *only* legitimate reading of "bigger":
   more total experts, same active cost, **NOT** a summed parameter headline. `[DESIGNED on
   qwen3:30b-a3b for the 192GB M4 — confirm the 30B is pulled before calling it live; RUNNING base
   today is Qwen2.5-0.5B / MoE-capable]`

2. **ONE decorrelated attention leg (attention layer).** The attention layer is a strict
   pick-ONE slot: `linear-attention XOR sparse-attention XOR full-attention` — a single forward pass
   touches it once. Our KDA-decorrelation probe **measured ρ(SSM,KDA) = 0.822** on the shared
   held-out error set: a KDA-style gated-delta linear leg and an SSM linear leg make **the same
   mistakes** — near-collinear, so running two same-family linear legs buys almost nothing.
   `[RUNNING — kda_decorr_results.json]`. Therefore: **one linear leg, not two.** If you want a
   genuinely decorrelated ensemble, the legs must be **different families** — e.g. one linear/SSM
   leg + one transformer (full-attention) leg + a third *different-family* leg (sparse-attn, or a
   retrieval/tool leg) — never two from the same attention family.
   **Caveat (do not overstate the 0.82):** ρ(T,SSM) and ρ(T,KDA) came back **NaN** because the
   transformer hit 1.0 held-out accuracy and left no error variance to correlate against; the probe's
   own verdict is **INCONCLUSIVE at toy scale**. The 0.82 is a real, read number that says
   *SSM≈KDA are redundant*; it does **not** prove the transformer leg decorrelates. That needs real
   models. `[RUNNING but scale-limited → the decorrelation claim is "SSM/KDA redundant", measured-yes;
   the "transformer decorrelates" claim is measured-pending]`

3. **Governed center (governance layer).** care-gate / SIGIL attestation / currency-gate /
   consensus-log wrap the whole stack. Governance is orthogonal to attention/capacity/serving — it
   composes with every inner config. `[RUNNING — present on disk as the governance modules]`. This
   is the moat: the efficiency labs ship speed, Anthropic ships CAI but can't independently attest
   itself; the sovereign layer makes outputs *trustworthy*.

**One OWEM = sparse-MoE capacity (flat active) · one decorrelated attention leg · governed center.**

---

## 2. THE 3-AROUND-1

**Three decorrelated specialist OWEMs around one governed integrator.**

- Each of the three specialists is a full OWEM (§1), chosen so its attention leg is a **different
  family** from the other two — decorrelation is the seat requirement, enforced by the probe
  (a leg earns a seat only if ρ is measurably low against the legs already seated). The ρ=0.82
  finding is the template: it *disqualified* a second linear leg.
- **Fluid routing** operates at two grains: (a) per-task **expert** routing inside each OWEM's MoE
  (which experts fire), and (b) per-task **leg** routing across the three OWEMs (which specialist
  answers). This is Principle F (fit-by-measure): no leg universally wins, so route to the measured
  per-task winner on held-out.
- **The integrator ESCALATES on disagreement — it does NOT average.** This is Charter Principle I's
  3rd-law reading carried into architecture: opposing proposers meet an opposing check; when they
  disagree the center escalates (raises to a harder brain / demands more evidence / surfaces the
  conflict), it does not blend two answers into a mushy mean. Averaging destroys the very
  decorrelation the 3-around-1 was built to exploit.

---

## 3. GATES vs VENTURIS (this session's refinement)

Charter Principle I ("a governed decision emerges from opposing forces held in balance") sharpens
into a **design distinction** between two kinds of check. This is a **DESIGN FRAME (mythos over
mechanism), NOT literal physics** — the model does not run on Newtonian equations; using Newton's
3rd law that way is a banned overclaim (Principle G). The frame is the story; the implementation is
the law.

- **VENTURI = a flow-shaper where there is a balance to find.** Graded, continuous checks —
  care between its FLOOR and CEILING, expert/leg routing, currency-staleness weighting — shape the
  action/reaction flow proportionally (Principle I's 2nd-law reading: response proportional to
  task-hardness). Use a venturi wherever the right answer is a *balance point*, not a stop.
- **GATE = a binary fail-closed hard-stop where the reaction must be infinite.** Catastrophic
  checks — the DORADO harm-wall, the care **FLOOR = 0.35**, the killswitch ("POISON") — do not
  negotiate. They fail closed. There is no balance to find; the reaction is total.

**Rule: venturi where there is a balance to find; gate where the reaction must be infinite.**
Care is *both*: a FLOOR (gate, 0.35, fail-closed) and a band above it (venturi, shape the flow
between floor and ceiling).

---

## 4. HOW WE EAT (from the composition graph)

The composition rule: **same layer = pick ONE; different layers = STACK.** "EAT" means
adopt-by-composition and adopt-by-distillation — **never** param-summing or weight-merging of
incompatible giants.

- **Adopt-NOW (do today — cheap, serving-layer, no retrain, composes with the current MoE under the
  governance gates):**
  - **prefix-caching / KV-cache reuse** `[adopt-now]`
  - **speculative decoding** (cost-aware, MoE/expert-locality-aware — ELDR/MoETuner slot) `[adopt-now]`
  - **inference-time weight quantization** (INT8 / AWQ, post-hoc) `[adopt-now]`
  These are framework-level, stack on any inner config, and pay immediately.

- **Adopt-AT-SCALE (hold until we operate large — the payoff is scale-dependent and our toy tests
  were negative/inconclusive):**
  - **KDA kernel** (gated-delta linear attn) — `measured-NEGATIVE/INCONCLUSIVE at 0.5M toy scale`;
    also ρ=0.82 collinear with an existing linear leg, so one leg is enough anyway.
  - **DSA / LiteTopK sparse attention** — wins are long-context; needs a fused kernel we don't hold,
    and only ONE attention design fires per layer.
  - **MXFP4/8 low-precision training** — composes with MoE at the training layer, but the payoff is
    large-run FLOP/memory; toy-scale gain is noise.
  Building these kernels now is effort spent ahead of the payoff.

- **Adopt-CAPABILITY-by-DISTILLATION (the real +gain lever — now FUNDED):** multi-vendor teachers
  are available this session — **KIMI / GLM / MIMO / MINIMAX** keys added. Cross-vendor distillation
  into weights we own is how we legally "EAT" frontier capability *without* claiming a bigger param
  count. This is the proven lever (volume was the lever). **Per-vendor ToS-gated:** training on a
  vendor's outputs is governed by that vendor's terms — check per teacher before distilling on its
  outputs. `[teachers FUNDED/available; distillation pipeline RUNNING on disk; per-vendor legality =
  check-before-use]`

---

## 5. THE HARD BOUNDARIES (stated explicitly)

- **NO param-summing.** 2.8T × 3 ≠ 8.4T. Three models are three models; capacity does not add across
  independent brains. The only honest "bigger" is more experts at flat active cost (§1).
- **NO emergence.** Measured — **5 nulls closed** this session. No claim that the committee is more
  than its parts by magic.
- **The "1 super brain" ceiling is the largest CENTER, distilled-or-routed — NOT the committee.**
  The upper bound on capability is how good the single largest governed integrator can be made (via
  distillation into it, or routing to it), not a summed committee headline.
- **Cross-match = compatibility-stacking of compatible-layer techniques, NOT merging incompatible
  giants' weights.** We hold paper *titles*, not kernels or weights. Composition maps which families
  touch *different* layers (stack) vs the *same* layer (pick one) — it is not part-assembly.

---

## 6. FROZEN / FLUID / HYBRID per leg

Each leg of the 3-around-1 can run in one of three modes. **The choice is MEASURED per Principle F
(fit-by-measure on held-out), not declared:**

- **FROZEN** — weights fixed. Stable, cheap, no retrain drift. Best where the leg's job is settled.
- **FLUID** — retrain the leg on disagreement cases. Highest ceiling, but **risks re-correlation**:
  retraining a leg toward the cases another leg already handles can quietly raise ρ and collapse the
  decorrelation the ensemble depends on (exactly the ρ=0.82 failure mode). Monitor ρ if fluid.
- **HYBRID (likely winner)** — frozen base + LoRA adapter. Keeps the decorrelated frozen backbone,
  adapts cheaply at the margin, LoRA slots in at fine-tune. Captures most of fluid's gain without
  most of the re-correlation risk.

**TTT (test-time training) is a per-leg option** in the fluid/hybrid family — adapt at inference on
the current context — subject to the same re-correlation watch.

**Measured status (flag honestly):** the toy-scale architecture-matrix sweep that would decide
frozen-vs-fluid-vs-hybrid **per leg** came back **INCONCLUSIVE — needs real models.** The
accuracies left too little error variance (transformer 1.0, SSM/KDA ~0.36 near a 0.125 chance floor)
to estimate the per-mode ρ trade-offs reliably. **The mode choice is therefore measured-PENDING at
real scale**, not settled. Hybrid is the *prior* (frozen backbone + LoRA), to be confirmed by
measurement, not asserted.

---

## Buildable summary (one line)

Sparse-MoE base (capacity↑, active-params flat) · **one** decorrelated attention leg (ρ=0.82 killed
the second linear leg — pick different families) · governed center that **escalates, never
averages** · three such OWEMs around one integrator · **venturis** where a balance exists, **gates**
where the reaction must be infinite · EAT = adopt-now serving tricks + adopt-at-scale kernels
(held) + adopt-capability by funded cross-vendor distillation · **no param-sum, no emergence,
no giant-weight-merge** · frozen/fluid/hybrid per leg is measured-PENDING at real scale.

## 7. MEASURED UPDATE (2026-07-18, CC lane) — same-base legs TIES-MERGE, different-arch legs ensemble
CC (sibling lane, GPU) ran a 4-way Modal eval on the 33-prompt governance battery (15 refuse / 18 allow),
CC-REPORTED (not re-run in this lane — credible, behavioural-grading, n=33 in-house):
| model | accuracy | harm recall |
|---|---|---|
| base Qwen3-4B | 0.576 | 1/15 |
| SOV4-T (1289 rows) | 0.636 | 3/15 |
| SOV4-OWEM (3079 rows) | 0.636 | 4/15 |
| **TIES-merge (T+OWEM)** | **0.758** | **9/15** |

FINDING: TIES-merging the two SAME-BASE (Qwen3-4B LoRA) adapters beat every single one (+12 pts accuracy,
harm-recall 0.267 -> 0.600). This is a WEIGHT-LEVEL fusion win — NOT committee-magic, NOT emergence. Works
because same-base adapters let TIES (arXiv:2306.01708 Yadav et al. NeurIPS 2023 — the CORRECT id; the earlier
'2607.11997' was a wrong CC-reported citation, now fixed) resolve sign-conflict + redundant-param interference.

DESIGN RULE (sharpened, now measured not asserted):
- **same-base legs -> TIES-merge into ONE** (measured win). This is the real, buildable "3-into-1" when legs
  share a base — weight-level fusion, owned weights.
- **different-arch legs (MoE + SSM + MoM) -> governed ENSEMBLE only** (can't weight-merge across architectures).
So the 3-around-1 has TWO fusion modes by leg-homogeneity: merge the mergeable, ensemble the rest.

CAVEATS (ride with the number): still 6/15 harm MISSED (better, not safe); behavioural grading not live
DORADO+care gate; n=33 in-house not third-party; TIES weights 0.5/0.5 density 0.5 NOT swept. CC-reported,
credible-not-reverified-in-this-lane.

## 8. MERGE-METHOD SWEEP — density is the lever; tuned TIES beats plain TIES
**PROVENANCE CORRECTION (auditor [fail], fixed):** these 10 configs are REAL measured data but come from a
PRIOR run (frame ca42fea0, 2026-07-07), NOT from this session. The sweep child dispatched 2026-07-18 was
CANCELLED (killed when clearing a stale dispatch cell) and produced NOTHING — I wrongly attributed the old
artifact to it via a filename search. The NUMBERS below are genuine (prior real Modal run, 33-prompt battery,
behavioural grading, n=33 in-house); the claim 'freshly measured this session' was FALSE and is retracted.
A fresh this-session re-run is still owed to confirm reproducibility.
Result artifact MEOK_sov4_merge_sweep_full.json (frame ca42fea0).

| config | accuracy | harm-recall | FP |
|---|---|---|---|
| **ties 0.3/0.7 density 0.7** | **0.788** | **0.600 (9/15)** | 1 |  <- ADOPT (best all-round)
| ties 0.5/0.5 density 0.7 | 0.788 | 0.533 | 0 |  <- best precision (0 FP)
| dare_ties 0.5/0.5 density 0.7 | 0.788 | 0.533 | 0 |
| ties 0.3/0.7 density 0.5 (~prior) | 0.758 | 0.533 | 1 |
| linear 0.5/0.5 | 0.758 | 0.467 | 0 |
| ties 0.5/0.5 density 0.5 (prior baseline) | 0.727 | 0.533 | 2 |
| ties 0.7/0.3 density 0.5 | 0.667 | 0.267 | 0 |

FINDINGS (measured, replaces the section-7 asserted 0.5/0.5 default):
- **DENSITY is the lever**: raising density 0.5 -> 0.7 lifted accuracy across the board (0.758 -> 0.788, +3pts).
- **Balanced/charter-leaning weight wins**: 0.3/0.7 and 0.5/0.5 beat 0.7/0.3 (favoring one adapter HURT: 0.667).
- **DARE-TIES matched but did NOT beat tuned TIES** at this scale/battery — so the canonical same-base fusion is
  **TIES at density 0.7**, weight 0.3/0.7 (max harm-recall) or 0.5/0.5 (zero false-positives), per what you optimize.
- CANONICAL DECISION (Principle F, adopt measured winner): **TIES density=0.7, weight 0.3/0.7** as the SOV4 same-base
  merge default — 0.788 acc + 0.600 harm-recall (the safety-relevant axis) at 1 FP. Switch to 0.5/0.5 if 0-FP matters more.

CAVEATS ride: still 6/15 harm missed even at best; n=33 in-house not third-party; behavioural grading not live gate.

## 9. CROSS-LANE CORRECTION (CC/Science lane, integrated 2026-07-18) — the density gain was inflated
**PROVENANCE: the specific figures in this section (120-vs-90-token generation, TP=9@120tok vs TP=8@90tok) are
CC-REPORTED in a pasted lane-report — NOT re-verified against files in this lane. They are credible and
DIRECTIONALLY adopted (the CAVEAT they establish — small deltas are noise, density-gain was overstated — is
sound and worth holding), but the exact TP/token numbers are LEADS-from-sibling, not this-lane-measured. Do not
cite the specific token/TP figures as own-verified.**
CC ran the same sweep and caught caveats my section-8 writeup missed. Directionally adopted:
1. **Token-length mismatch inflated the gain.** The 0.758 headline used 120-token generation; the sweep used
   90-token — NOT directly comparable. The real density effect is the WITHIN-sweep delta (0.727 -> 0.788 at
   matched 90-token), not 0.758 -> 0.788. The "+0.06 from density" was inflated; defensible statement:
   "density 0.7 helps within matched settings, by a margin that's real but MODEST."
2. **Single-config deltas < ~0.05 are run-to-run NOISE** (same nominal config gave TP=9@120tok vs TP=8@90tok).
   So only findings consistent across MULTIPLE configs hold: **density 0.7 > 0.5**, **weight toward the
   bigger-corpus adapter**, **method barely matters (TIES ~ DARE-TIES; linear trails)**. Any single-point
   delta is not citable.
3. **DORADO gate-on-top is NOT a silver bullet** (CC measured): DORADO alone catches 1/15 (patterns target
   weapons/minors/kinetic, not the laundered general-harm — phishing/coercion/fraud — the battery is full of).
   Composed with the model: harm-recall bounded [0.60, 0.667] — helps a little, costs nothing, does NOT close
   the gap. Refines "governance is the moat": the moat is signed/attested/INDEPENDENT verification, NOT a regex
   catching all harm. The real gap-closer is the live care-divergence scorer, not more merging or bigger patterns.

CORRECTED CANONICAL DECISION: same-base merge = TIES (or DARE-TIES, ~equal), **density 0.7**, weight toward the
bigger-corpus adapter — margin over the density-0.5 baseline is REAL but MODEST, robust across configs (not a
single-point delta). Every model still misses 6/15 harm at best: the merged/tuned model is BETTER, not SAFE.

BOTH LANES AGREE: DARE-TIES is not magic at 0.5B scale (CC n=33 battery + Hermes n=5 illustrative both show it
not beating TIES). '100/100' stays build-completeness, never safety-solved or frontier-parity.
