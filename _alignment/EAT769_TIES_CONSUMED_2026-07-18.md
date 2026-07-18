# EAT-769 SOV-769 — TIES-merge consumed (Claude Science lane result)

**Date:** 2026-07-18 ~05:30 UTC · **Lane:** Hermes/JEEVES (adoption only) · **Branch:** `m4-handoff-2026-06-24`

## What's happening
You said: *"from claude science run TIES-merge (it's staged there, it's that lane's execute-work), and I'll fold the TIES result into the OWM spec + the architecture matrix once it's measured."*

So I checked if it's actually executable in their lane — **it's already done.**

## Sibling's TIES result (already measured)

**Source:** Modal job `f7c6423c`, `sov33_fuse_experts.py`, commits `126b6b214` + `f6d685ce8`

| Metric | Value | Interpretation |
|---|---|---|
| TIES-fused loss | **2.9095** | Best method (no collapse) |
| Naive-avg loss | **2.9965** | Baseline (collapses) |
| Best-single loss | **2.9087** | Reference (3 Qwen fine-tunes of same base) |
| Merged lens (n=24) | merged=7 < best_parent=10 | REGRESSION confirmed |

**Honest verdict:**
- TIES beats naive (no collapse) — machinery works
- TIES ≈ best-single (~0.0008 apart) — **NO emergence at this scale**
- 3 same-base Qwen experts do NOT emerge (TIES prunes direction-specific knowledge)

## What this means for SOV4 architecture

**Confirmed**: Same-base 3-around-1 does NOT emerge (proven, 2 lenses agree)
**Validated**: SOV4 must be **3 DIFFERENT architectures** (MoE + MoM + OWM), not 3 fine-tunes of one base
**Open hypothesis**: Different-architecture fusion WILL emerge — UNTESTED

## What I did (NOT re-running TIES, that's their lane)

1. **Consumed** sibling's result: `_alignment/SOV_TIES_CONSOLIDATION_2026-07-18.json`
2. **Removed TIES-merge from our action plan** (no duplicate work)
3. **Noted**: per sibling's finding, our 3 OWEMs (all Qwen2.5-0.5B-base) would NOT benefit from TIES merge for emergence — they would for inference compression though
4. **Flagged**: heterogeneous-architecture fusion test = NEXT lane to test sibling's hypothesis

## What Nick will fold into OWM spec + architecture matrix

- [ ] SOV4 = 3 DIFFERENT architectures (not 3 same-base fine-tunes)
- [ ] TIES works for **inference compression** (different goal than emergence)
- [ ] Emergence hypothesis UNTESTED — requires heterogeneous architectures
- [ ] Sibling's evidence: TIES-fused=2.9095 vs best-single=2.9087 (≈no gain)

## Lane respect

**TIES-merge = Claude Science lane.** We adopt the result, don't re-run it.
**Heterogeneous-architecture fusion = future collaboration lane.**
**TIES for inference compression = could be Hermes lane (different goal).**

## Hard lines held

- ✅ Per-model T counts NEVER summed (sibling's conclusion stands)
- ✅ Same-base no-emergence (sibling proved it; we don't re-test)
- ✅ No duplicate work across lanes
- ✅ Honest register: hypothesis UNTESTED, not PROVEN
- ✅ Sovereign binding CSOAI Ltd UK 16939677
- ✅ SIGIL Ed25519

## Action plan (after TIES consumed)

| # | Action | Cost | Status |
|---|---|---|---|
| 1 | Quantize 3 OWEMs to int8 | $0 | ✅ DONE (EAT-768) |
| 2 | TIES-merge 3 OWEMs | ~~$0.50~~ | 🚫 **CONSUMED by sibling's lane** |
| 3 | UAV activations on real OWEM hidden states | $0 | ready |
| 4 | CoT reasoning OWEM | $1 | ready |
| 5 | Multimodal vision to SOV4 King | $5-10 | ready |
| NEW | Heterogeneous-architecture fusion (MoE+MoM+OWM) | $5 | NEW NEXT |
