# SOV3 / SOV33 / SOV33³ — MLX Local Runnability (2026-07-14)
_The "anyone can run it on a Mac, no rented GPU" thesis. PROVENANCE 2026-07-14: model sizes below are
corroborated at snippet level (DeepSeek V4-Pro 1.6T/49B: "1.6T" in 4 snippets + "49B" in 1; MIT title-supported) —
vendor-claimed, "directional not gospel" until independent reproductions land. (An earlier search this
session returned titles-only, so these were correctly held UNVERIFIED then; the later snippet-level search
is what supports carrying them now.) Hardware-fit VERDICTS are reasoning from memory math, NOT measured on
hardware here. Runtime = MLX (reported 1.5-2x faster than GGUF on Apple Silicon — snippet-level, treat as lead)._

## THE HONEST TIER -> HARDWARE MAP (this is the real product ladder)
| Tier | Open base (sizes corroborated 2026-07-14, vendor-claimed) | Runs on Mac? | Verdict |
|---|---|---|---|
| **SOV3-small** | a small open MoE (laptop-scale, ~30B-class, few-B active) [confirm exact name on card] | **YES, easily** | 16-32GB Mac, MLX 4-bit, NO GPU. THIS is the "anyone can do it" tier — small MoEs genuinely run on a MacBook. |
| **SOV33-medium** | GLM-5.2 (744B / ~40B active, MIT — corroborated) or V4-Flash (284B/13B [LEAD]) or 70B dense | **high-end Mac** | 744B streams on ~25GB via Colibri (slow); or 128GB unified for a mid MoE. |
| **SOV33³-large** | DeepSeek V4-Pro (1.6T / 49B active, MIT — corroborated; 33T-tokens [LEAD]) | **NO on laptop** | a genuine trillion-param model needs server/multi-node RAM. Hosted tier, NOT a MacBook. |

## WHAT THIS MEANS (the honest product story)
1. **SOV3-small is the real democratization win.** A small open MoE (few-B active) runs on a normal MacBook via
   MLX with NO rented GPU. Governance layer identical to the big tiers. THIS is "everyone gets a sovereign AI on
   their own machine" — and small-MoE-on-a-Mac is genuinely true today. (Exact base name/size [UNVERIFIED].)
2. **SOV33-medium is the enthusiast tier.** A high-end Mac (128GB) runs a mid-size MoE via MLX; smaller RAM via
   SSD expert-streaming (real technique, slow — tok/s figures [UNVERIFIED], owner to measure on the real Mac).
3. **SOV33³-large (a real ≥1T model) is NOT a laptop model, and we must say so.** It's a hosted/server tier.
   Claiming the trillion-param tier runs on a MacBook would be the overclaim the whole honesty register forbids.

## MLX SPEEDUP — reported (treat as lead, not measured)
- MLX is *reported* 1.5-2x faster than GGUF on Apple Silicon (2026 snippets — [UNVERIFIED] exact figure);
  unified memory is well-suited to MoE (shared CPU/GPU pool avoids the PCIe transfer a dual-GPU rig pays).
- NOT a magic multiplier (this is a reasoning claim, not a stat): decode on streamed/large models is
  BANDWIDTH-bound (SSD or memory), not compute — MLX speeds the compute path, it cannot beat memory physics.

## THE BUILD (what "run their code in our SOV" actually means, honestly)
SOV does NOT reimplement these models. It WRAPS an MLX-served open base with the sovereign layer:
  1. `mlx_lm.load(<open MoE checkpoint>)` — the base runs on Metal (MLX handles the model).
  2. SOV wraps it: care-floor gate + Venturi=SIGIL attest + memory bridge + BFT vote (our layer, ~no params).
  3. Same governance across all 3 tiers (the decoupling property we tested) — swap the base, keep the sovereign.
So "use their code + MLX" = correct: MLX runs the open weights; SOV adds governance. We build the WRAPPER +
the tier configs, not the base model.

## HONEST BOUNDS
- The tier→hardware VERDICTS (which tier fits which Mac) are REASONING from published memory math, NOT
  measured by me on hardware — I cannot run MLX here (Linux sandbox, no Metal GPU). The owner runs the MLX
  bridge on the real Mac to confirm actual tok/s; treat every tok/s figure as a lead until then.
- MODEL SIZES (per-figure provenance, checked against persisted search snippets — earlier "~7 sources"
  framing was padded, incl. one unrelated arXiv paper; corrected here):
  · DeepSeek V4-Pro 1.6T / 49B active: CORROBORATED ("1.6T" in 4 snippets + "49B" in 1); MIT title-supported.
  · GLM-5.2 744B / ~40B active / MIT: CORROBORATED (Colibri search: 744B, MIT, 256 experts/layer 8+1 active).
  · 33T train tokens, V4-Flash 284B/13B, Kimi-K2.x 1T/32B: [LEAD] — NOT in persisted snippets; confirm on card.
  All are vendor-claimed; "directional, not gospel" until independent reproductions land.
  (History note: an EARLIER search this session returned titles-only, so these were correctly held UNVERIFIED
  then; the later snippet-level search is what now supports carrying them.)
- V4 architecture runs day-0 on vLLM/SGLang per sources; MLX/Ollama consumer paths are newer — confirm the
  exact loader + quant on the model card before a load-bearing deployment claim.
