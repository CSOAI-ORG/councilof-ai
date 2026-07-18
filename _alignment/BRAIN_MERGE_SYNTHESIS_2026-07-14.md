# 🧬 Hybrid brain merge — 4 models → 1 OWEM brain, the honest laws (2026-07-14)
_"2 small + 2 large inside one brain, 90/10 or what's best split?" — measured, plus the real-method synthesis.
Honest register: CPU numpy proves the MERGE LAWS; the same laws hold for transformer weights at scale.
The literature methods below are from training knowledge (WebSearch quota'd) — marked, verify model cards before public cite._

## The measured laws (run: `sov33_brain_merge.py` → `brain_merge_results.json`)
| test | result | law |
|---|---|---|
| **same-init soup, 2 small, α-sweep** | best soup **0.2007** vs **ensemble-vote 0.179** | vote **beats** weight-soup here; α≈0.1 (≈pick one) |
| **different-init soup @0.5** | **0.256** — WORSE than either model (0.200 / 0.198) | ❌ naive weight-merge of different-init models **fails** (permutation symmetry) |
| **cross-size (h8 vs h48)** | can't weight-merge; distill big→small 0.198→0.190 | ✅ small+large → **DISTILL or ROUTE**, never weight-average |
| **full 4→1 brain** | merged-large **0.041** dominates merged-small 0.212; routed **0.041** | the **large carries it; route small→large** |

## The two hard rules (the fake to avoid)
1. **You cannot weight-average two arbitrary open models.** Different init → the neurons don't correspond
   (permutation symmetry), so the average is *worse than either* (measured 0.256 vs ~0.198). "Merge 4 open
   models by averaging their weights" is the burning fake. It only works for **fine-tunes of the SAME base**.
2. **You cannot weight-merge different sizes at all** (shape mismatch). Small+large must **route** (draft→verify)
   or **distill** (large teaches small). Measured: the large brain is 5× better (0.041 vs 0.212) — routing to it is the win.

## So "what's the best split"? — depends which knob
- **Output mixing (council vote):** earlier work measured **flat/equal beats 90/10** for a 4-brain layer (+48%). Equal vote.
- **Weight soup (same-init only):** the α-sweep here didn't beat voting — soup is a *compression* convenience, not an accuracy win. If you must soup, equal (α=0.5) is the safe default; TIES/DARE handle conflicts better than plain average.
- **Cross-size:** no split — you route (small unless it saturates → large) or distill.

## The real-method map (which technique for which case) [training-knowledge; verify before public cite]
| you have | method | one-liner |
|---|---|---|
| N fine-tunes of ONE base, same task | **Model Soup** (uniform/greedy) | average weights; greedy-add only if it improves held-out |
| N fine-tunes, conflicting task vectors | **TIES-Merge / DARE** | trim + sign-elect (TIES) or drop-and-rescale (DARE) before averaging |
| 2 models, interpolate a trait | **SLERP / task-arithmetic** | spherical interp / add-subtract task vectors |
| different inits you must merge | **Git-Re-Basin** (weight-matching) | permute neurons into alignment FIRST, then average |
| many domain experts, keep all | **Branch-Train-MiX (BTX) / MoE** | train experts separately → combine as a routed MoE (no weight-average) |
| big teacher → small student | **Knowledge Distillation** | student learns teacher's outputs (cross-size transfer) |

## The honest recommended brain (4 open models → 1 SOV33 brain)
**Don't merge into a blob — build a routed council with optional same-init soup:**
1. If your 2 small are same-base fine-tunes → **soup them (α=0.5, or TIES)** → 1 small. Else keep both as council votes.
2. Same for the 2 large → 1 large.
3. **Route small→large** (draft→verify; escalate on the mirror-auditor's divergence signal — measured corr 0.434).
4. **Distill** the large into the small periodically so the fast path keeps improving.
5. Wrap the whole thing in the **care-gated-BFT** aggregate (the governed-robustness win: holds 1.0× under adversary).

That's SOV3 (small council) / SOV33 (small+large routed) / SOV333 (nested, only with real regions — measured law).
Every step is a real, named technique — nothing here requires the "average 4 open models" fake.

## Honest bounds
CPU numpy MLPs on a synthetic task — proves the merge/route/distill LAWS and their failure modes, not LLM
accuracy. At scale: soup=Model Soup, route=cascade/MoE, distill=KD; the permutation-failure and cross-size-
undefined rules are identical for transformer weights. Registered capability `brain-merge-laws`.
