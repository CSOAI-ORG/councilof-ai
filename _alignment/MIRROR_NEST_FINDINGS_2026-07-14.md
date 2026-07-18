# 🪞🔺 Mirror-auditor + nest-with-regions — measured mechanisms (2026-07-14)
_Fable (non-sandboxed) turning two design pieces into measured mechanisms. Honest register: CPU numpy brains
prove the MECHANISM + its condition, not LLM scale._

## (1) Mirror auditor — detection works, escalation needs a genuinely stronger target
A 2nd decorrelated 4-brain stack (bootstrap-resampled) runs beside the main one; per-item divergence is the
uncertainty signal.
- **Divergence ↔ true error correlation = 0.434** → the mirror **genuinely detects** which items are wrong. ✅ real signal.
- **Escalating the top-25% divergent items to a "bigger" model did NOT help** (−3.1%, no better than random).
  - Honest reason: the escalation target (one wider OWEM) is **not actually stronger** than the 8-layer 4-brain
    ensemble, so re-routing to it *hurt*. Detection ≠ improvement unless the target is truly more capable.
- **Design correction:** the auditor's job is **detect-and-route** (works, 0.434 corr); the route must go to a
  **genuinely more capable** model — at LLM scale that's a **frontier model (Claude/GPT), not a marginally
  bigger local one.** Escalating to a same-tier model is wasted compute. This is exactly the small→large→frontier
  cascade the deployed gate already implements.
- Reproduce: `sov33_mirror_auditor.py` → `mirror_auditor_results.json`.

## (2) Nest-only-with-regions — LAW CONFIRMED
4 regions, each a distinct linear world-map blended with a shared one by `sep` (0=identical, 1=distinct).
One deep pyramid (8 layers, all data) vs nest (4 sub-pyramids of 4 layers, routed by true region label).

| separation | one deep pyramid | nest 4-around-1 | winner |
|---|---|---|---|
| 0.0 (no regions) | **0.0345** | 0.0643 | one-pyramid (nest −86%) |
| 0.25 | 0.0438 | 0.0432 | nest +1.4% |
| 0.5 | 0.1189 | 0.0362 | **nest +69.6%** |
| 0.75 | 0.2270 | 0.0432 | **nest +81.0%** |
| 1.0 | 0.3160 | 0.0630 | **nest +80.1%** |

**Confirmed:** nesting **loses** on a single-domain task (sep=0) and **wins** once real regional structure
exists (sep≥~0.25). Crossover ≈ 0.25. This is the build-spec law, now measured with a clean crossover.
- Caveat: uses **perfect routing** (true region label) — an upper bound. A real router would shift the crossover
  right (nesting needs BOTH real regions AND accurate routing).
- Reproduce: `sov33_nest_regions.py` → `nest_regions_results.json`.

## Build consequences (wired into SOV33_GPU_BUILD_SPEC)
- **Auditor:** keep the mirror for *detection*; route flagged items to a **frontier** model, not a bigger local one.
- **Nesting:** do NOT nest for a single domain (one deep 4-brain pyramid wins). Nest 4-around-1 only when the
  estate has genuine domains (finance/defence/health/…) AND the router is accurate — then it's a +70–80% win.
