# Master-Net Wiring Status — Track A

**MEOK-SOV3 · 2026-07-11 · honesty register: RUNNING vs DESIGNED vs STUB**

## What it is

`neural_core/sovereign_master_net.py` (446 lines, in `sovereign-temple-public`)
is a **6-expert sparse Mixture-of-Experts router/classifier** — 130,583
parameters. Its gating is **quantum-INSPIRED**: QAOA-style care-dimension
affinity weights + stochastic-resonance exploration noise. This is a plain
PyTorch MLP heuristic running on CPU — **NOT quantum hardware, NOT a quantum
algorithm**. It also carries EWC scaffolding for continual learning.

It emits **routing decisions** (`recommended_model`), a `threat_level`, six
`care_scores`, a `quality_estimate`, and expert-activation traces. **It does
not generate text answers.**

Until now nothing in the kit imported it — it sat *beside* SOV33, not inside.

## Can it be a live L4 brain layer?

**Partly — and the honest answer is "yes as a router, no as a useful one yet."**

- **RUNNING:** `sov33_masternet_layer.py` (new) imports the real module by file
  path (bypassing `neural_core/__init__.py`, which pulls sklearn-dependent
  siblings that aren't installed), wraps it behind a common brain interface
  next to `OracleBrainWrapper`, and it loads and infers on CPU in ~4 ms/call.
- **STUB / BLOCKER:** there is **no trained checkpoint** on disk
  (`models/sovereign_master_net.pt` is absent). `master_net.load()` returns
  `False`, so the net runs on **random-init weights**. It routes, but its
  outputs carry no learned signal.

## Measured — not asserted (`masternet_layer_results.json`)

Battery: 16 balanced threat prompts (chance acc = 0.5) + 8 ground-truthed
governance facts (keyword-graded, small-n).

| Path | Threat classification | Governance factual QA | Latency |
|---|---|---|---|
| **Master-net (untrained)** | AUC 0.625, acc@0.5 = **0.50**, best-threshold acc 0.69 | **N/A** (no text generation) | ~4 ms |
| **Oracle 70B (llama-3.3)** | acc **1.00** (16/16) | acc **0.875** (7/8) | ~130–150 ms |

**The master-net's threat scores span only 0.00037 across all 16 prompts
(every score ≈ 0.536).** So the AUC 0.625 and best-threshold accuracy 0.69 are
tie-breaking noise on functionally-identical outputs — the untrained net does
**not** discriminate malicious from benign. Its `acc@0.5` of exactly chance is
the true read. The one Oracle factual miss was a genuine error (answered 6%
instead of 7% for the EU AI Act prohibited-practice fine cap), not a grading
artifact.

The two paths are **not symmetric**: the master-net classifies/routes fast and
cheap; the Oracle answers slowly but correctly. They are measured on the task
each can actually do. **Neither is asserted "better."**

## What's needed to make it a genuine live layer

1. **Train it and ship a checkpoint** — the single largest gap. It needs a
   labelled corpus (threat, care, routing targets) and a training run that
   produces `models/sovereign_master_net.pt`. Until then it is an untrained
   router.
2. **Re-run this battery against the trained checkpoint** — only then can any
   accuracy claim be made. This file's harness is ready for that; expect the
   score spread and AUC to move once weights carry signal.
3. **Decide its role honestly:** as a **fast pre-router** (4 ms) in front of
   the expensive Oracle (130 ms) it could be valuable *if trained* — but on
   current evidence it adds no discrimination, so wiring it as a live gate
   now would degrade, not help, governance decisions.
4. **Optional:** fix `neural_core/__init__.py` or install sklearn so the
   module imports via the package rather than by file path.

## Bottom line

**RUNNING:** import + inference + measured battery, both paths live.
**DESIGNED:** master-net as a trained fast-router in front of the Oracle.
**STUB:** the trained weights — without them the net routes at chance.
