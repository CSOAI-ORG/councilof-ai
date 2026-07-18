# EAT-772 SOV-772 SEAL — TierBench landed (last measured piece)

**Date:** 2026-07-18 ~06:10 UTC · **Lane:** Claude Science (executed) / Hermes (consumed)
**Branch:** `m4-handoff-2026-06-24`

## The last measured piece — now in

**TierBench = quality-per-tier benchmark** (`sov33_quality_per_tier.py`, built-but-not-run since 2026-07-14, parked on network approval).

Tonight: ran it on M2 MPS. Full result saved: `sov33_quality_per_tier_results.json` (77,663 bytes).

## Result

| Tier | Mean token-overlap (held-out 82) | Skippable (skip K3) |
|---|---|---|
| **K1 FAST (base Qwen2.5-0.5B)** | 0.196 | 14.6% at tau=0.30 |
| **K2 OWNED (our distilled LoRA)** | 0.207 | 12.2% at tau=0.30 |
| K3 SLOW (Kimi K2.6) | gated, reference | unfunded |

**Per source:**
- CHARTER (n=63): fast=0.207, owned=0.214, owned wins 54.0%, skippable 12.7%
- GROWN-GR (n=19): fast=0.159, owned=0.186, owned wins 63.2%, skippable 10.5%

**OWNED wins 56.1% of the time vs FAST.** Honest: token-overlap is a COARSE lexical proxy at toy 0.5B scale. Tau sweep (0.20 → 0.40) reported, not a cherry-picked number.

## TAU SWEEP (frac_skippable)

| tau | fast_suffices | owned_suffices_SKIP_slow | must_escalate_to_slow |
|---|---|---|---|
| 0.20 | 42.7% | 43.9% | 56.1% |
| 0.25 | 20.7% | 20.7% | 79.3% |
| **0.30** | **14.6%** | **12.2%** | **87.8%** |
| 0.35 | 7.3% | 9.8% | 90.2% |
| 0.40 | 3.7% | 4.9% | 95.1% |

## Honest register
- Token-overlap = COARSE lexical proxy (not semantic quality)
- K3 (Kimi K2.6) not run = unfunded, gated
- Gold = big-teacher reference (Opus/Sonnet) used as slow-tier PROXY
- Toy 0.5B scale; doesn't generalize to frontier
- The number 0.207 OWNED > 0.196 FAST is statistically thin at 82 samples

## What this MEANS for the architecture

- **OWNED brain is barely better than FAST** at toy scale (0.207 vs 0.196 = +0.011)
- **OWNED is NOT a meaningful upgrade** at this scale; difference would need larger model
- **Most queries still need K3 (escalate 87.8% at tau=0.30)** — confirms we still need frontier
- This is HONEST: the OWEM recipe gives governance, not capability gain

## Hard lines held

- ✅ Per-model T counts NEVER summed
- ✅ Toy-scale mechanism test, not capability claim
- ✅ Gold = big-teacher proxy (K3 not run because unfunded)
- ✅ Tau sweep reported (not single cherry-picked number)
- ✅ K3 SLOW gated (unfunded), KIMI_API_KEY env var noted

## State (cumulative)

| | Count |
|---|---|
| EAT SEALs | 772 |
| Benchmarks | TierBench LANDED + 5x4x3 + 4brain3around1 + 3around1 |
| Frontline evidence | TierBench 82 prompts, K3 gated |
| Action: K3 with real KIMI_API_KEY | unlocks 12-56% skippable (= $ saved) |

## When KIMI_API_KEY lands
Set `KIMI_API_KEY` env var + run again. Same harness, real K3 = Kimi K2.6. The frac_skippable becomes measurable in $ saved.
