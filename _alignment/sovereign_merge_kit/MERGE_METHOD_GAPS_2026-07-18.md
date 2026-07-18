# Merge-Method Frontier — gaps + sparks beyond plain TIES (deep research, 2026-07-18)

We measured TIES-merge = 0.758 (the strongest SOV4 result). But TIES is ONE method in a whole family, and
several BEAT it. This is the gap-fill: what to adopt next. Sourced from live search (2025-2026 papers), tagged
LEAD (verify the exact number before citing) — the mechanisms are real, the head-to-head on OUR battery is what
the running sweep measures.

## The methods that beat / extend plain TIES (all in MergeKit, all adoptable)
| method | mechanism | why it may beat TIES |
|---|---|---|
| **DARE-TIES** | DARE randomly DROPS up to ~90% of redundant delta params + rescales to preserve magnitude, THEN TIES sign-election | removes noise/interference BEFORE the sign-merge; the popular strong variant (arXiv:2311.03099 "Super Mario") |
| **DELLA** | magnitude-ranked drop (keep large-|param|, drop small) | reported to OUTPERFORM both TIES and DARE by reducing interference while preserving task info |
| **Model Breadcrumbs (breadcrumbs_ties)** | dual mask — drops BOTH large outliers AND small perturbations, + optional TIES sign consensus | removes the two interference sources at once |
| **Model Stock** | approximates the CENTER of the weight distribution using base as anchor + few fine-tunes | cost-efficient, geometry-aware |

## The key insight for OUR architecture
- **Sparsify-before-merge is the lever.** TIES resolves sign conflicts; DARE/Breadcrumbs first DROP the
  redundant/noisy deltas so the sign-merge has less interference to fight. Our TIES=0.758 was WITHOUT this
  preprocessing — so DARE-TIES is the most likely next lift on our own battery (the running sweep tests it).
- **MergeKit is the toolkit** (Goddard et al. 2024) — has SLERP/TIES/DARE/Breadcrumbs/Model-Stock/Fisher, so
  adopting these is config-not-code. Merged models have topped the Open LLM Leaderboard — this is a proven,
  mainstream lever, not exotic.
- **Same-base rule STILL holds.** All of these need homologous (same-base) models. Our SOV4-T + SOV4-OWEM are
  both Qwen3-4B LoRA -> mergeable by any of these. Cross-arch (MoE+SSM+MoM) still ensemble-only. Unchanged.

## The honest open question (the real frontier, per the survey)
"When does interference become IRRECONCILABLE — a fundamental rather than technical limit?" is OPEN. So merging
lifts quality until the tasks genuinely conflict, then it can't. Our 6/15 still-missed harm may be partly this:
the merge can only combine what's IN the adapters; it can't invent harm-detection neither parent learned. That's
the honest ceiling — merging composes existing ability, it does not create new ability (same as no-emergence).

## What to DO (the buildable gap-fill)
1. Sweep {ties, dare_ties, breadcrumbs_ties} on our battery (RUNNING now) -> adopt the measured winner (Principle F).
2. If DARE-TIES beats 0.758 -> it becomes the canonical same-base fusion method in the OWM spec.
3. Longer term: representation-space (activation-informed) merging is a research frontier to watch — UNVERIFIED lead, no confirmed citation on disk; do not cite a specific paper until checked.

## Honesty register
- DARE-TIES (arXiv:2311.03099) matches a visible search hit and is cited; other method NAMES (DELLA, Breadcrumbs, Model Stock) are real mechanisms but their specific citations were NOT individually confirmed against visible hits — treat as LEADS to verify before external citation. Their exact numbers on OUR battery = the sweep measures.
- Merging composes existing ability, does NOT create new capability (consistent with no-emergence).
- Same-base-only constraint unchanged. '100/100' stays our build-completeness rubric, not general-cap supremacy.
