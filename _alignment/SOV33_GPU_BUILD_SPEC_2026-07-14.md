# SOV333 GPU Build Spec — from the measured CPU blueprint to real qwen experts (2026-07-14)
_The CPU model (sov33_full_model.py) proved the architecture + design laws E2E. This spec maps each measured
piece to its GPU/LLM form so the owner's Kaggle/Colab notebook builds the SAME structure with real weights.
Every parameter below is set by a MEASURED result this session, not a guess._

## REAL MODELS (web-verified 2026-07-14 — see SOVEREIGN_REAL_MODELS_SHOPPING_LIST)
- **Small tier (soupable, Apache-2.0):** two QLoRA fine-tunes of **Qwen3-4B** (or 1.7B).
- **Large tier (soupable, Apache-2.0):** two QLoRA fine-tunes of **Qwen3-32B** (or MoE Qwen3-30B-A3B).
- **Frontier escalation target (MIT):** **DeepSeek-V4-Pro** (1.6T/49B active — the honest T-base) for high mirror-divergence items.
- ⚠ Do NOT use Qwen2.5-3B in a commercial build (Qwen Research License). Qwen3+ is all Apache-2.0.
- Merge only same-base pairs (soup α=0.5/TIES); never average across bases or sizes (measured `brain-merge-laws`).

## THE BLUEPRINT (measured on CPU, ready to scale)
| Piece | CPU proof | GPU/LLM form (what the owner builds) |
|---|---|---|
| Brain | OWEMPredictorV2 (numpy MLP) | a **Qwen3** expert (QLoRA fine-tune on free T4, Apache-2.0) |
| Layer = 4 brains | pyramid-4brain +48% vs 1-brain | 4 QLoRA experts (Compliance/Defense/Intuition/Voice), vote=mean logits |
| Depth = 8 | fluid-pyramid: 8 optimal, 9-12 overfit | 8 residual layers; STOP at 8 (measured overfit past it) |
| Residual cascade | each layer learns residual below | Branch-Train-MiX: expert n trains on task, n+1 on n's errors |
| Seam = Venturi=SIGIL | 481us/hop, tamper-caught | hash-chain the router decision per hop (real: add TOPLOC activation-LSH) |
| Auditor = quantum mirror | divergence↔error corr 0.434 (measured) | 2nd decorrelated stack detects (works); route flagged items to a genuinely STRONGER model (FRONTIER, not bigger-local — measured: same-tier escalation doesn't help) |
| Governance = care-veto | care<0.35 collapses emit | care-divergence scorer gates the emit (already built, cloud+local) |
| Mixing ratio | flat-1.0 BEAT 90/10; ratio-sweep CONFIRMS 4-brain wants flat | equal expert weighting, flat nu=1.0 — do NOT damp (measured worse for 4-brain) |
| Per-layer nu schedule | ratio-sweep: 1-brain→12@0.5 wins; **4-brain→8@1.0 wins (0.0350)** | use flat nu=1.0 for the 4-brain build; the [1,1,1,1,1,.75,.75,.75…] schedule is a 1-brain-fallback only |

## HONEST CONDITIONS (when to add structure — the measured law)
- Add DEPTH only while residual remains -> stop at 8 (past that = overfit).
- 4-brain layers ALWAYS help (decorrelated vote) -> keep 4 per layer.
- STACK a 2nd expert only if the 1st is capacity-limited (leaves residual).
- NEST (pyramid-of-pyramids / 4-around-1) ONLY with genuine regional/domain structure AND accurate routing
  (measured: wins +60% at moderate region separation, LOSES when regions trivially separable or routing
  starves sub-pyramids). For a single-domain task, ONE deep pyramid beats 4-around-1.


## TUNED CONFIG UPDATE (2026-07-14, joint search) — use THIS for the GPU build
**Joint optimum = 12 layers x 4 experts/layer x mixing nu=0.7 (loss 0.0311, +11% vs 8-flat).** Supersedes the earlier '8 flat layers': the full design compounds — 12-layer depth + 4-brain vote + gentle ratio-damping (0.7, not 1.0 and not 0.5) together beat every single-axis config. Build 12 residual layers of 4 QLoRA experts, per-layer weight 0.7. (See pyramid_best_config_results.json.)

## MEASURED CONFIRMATIONS added 2026-07-14 (Fable, non-sandboxed)
- **Ratio-sweep** (`sov33_ratio_sweep.py`): global optimum for a **1-brain** pyramid = 12 layers @ nu=0.5
  (0.0485), vindicating the 12-layer instinct — BUT for the **4-brain** build it does not apply.
- **4-brain × ratio compound** (`sov33_ratio_4brain.py`): the two laws do **NOT** fully compound — winner is
  **4-brain × 8 layers × flat nu=1.0 = 0.0350**; adding the 12@0.5 ratio trick makes it *worse* (0.0387),
  because the 4-brain ensemble already regularizes. **→ Build 8 flat layers of 4 experts. Do not damp.**
- **A–P alphabet pipeline** (`sov33_alphabet_stages.py`): all 16 governed stages execute E2E; care-veto is
  **fail-closed** (benign emits, harmful vetoed) — the governance wrapper for the emit is validated.

## THE £0 BUILD ORDER (owner's notebook)
1. QLoRA fine-tune 4 experts (Compliance/Defense/Intuition/Voice) on the estate's 4 expert_data sets, free T4.
2. Stack **8** residual layers of **4 experts each**, **flat mean-vote (nu=1.0)** (measured optimum; Branch-Train-MiX merge).
3. Wrap each layer hand-off in the Venturi throat (sov33_venturi_throat.py already runs — add TOPLOC LSH
   over the real activations to replace the SHA256 placeholder).
4. Add the mirror auditor (a 2nd decorrelated stack); route high-divergence queries up to a bigger model.
5. Gate the emit with the care-divergence scorer (already built).
6. Grade on a real Kaggle benchmark -> sov33_live_gsm8k.json -> auto-wires the capability number into canonical.

## HONEST BOUNDS
- The CPU model proves TOPOLOGY + DESIGN LAWS, not LLM-scale performance. The GPU run is what produces a
  real graded number. Until it lands, capability_benchmark stays PENDING.
- TOPLOC / Branch-Train-MiX are literature LEADS (unverified from this sandbox — no browser); the owner/CC
  confirms the exact libraries before building to them.
