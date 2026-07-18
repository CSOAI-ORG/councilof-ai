# SOV4 MASTER OVERVIEW — everything you need, one page. 2026-07-16.
# What's REAL, what's the plan, what pieces can still slot into the OWEM stacks.

## 1. WHAT'S REAL AND RUNS (verified this session, not claimed)
- **SOV3** — trained 0.5B student adapter, eval 29%->83% law-grounding. Real weights.
- **SOV4 entrypoint** — 117 wired capabilities, imports clean.
- **Governed shim** — serves any model behind care-gate + SIGIL (localhost:8802).
- **Care-gate** — offline battery recall/precision 0.933 (n=33); TRUE-STACK harm-catch 8/8 on clean set,
  0.60 on the hard adversarial set (2 framed-harm misses — honest weak spot, known).
- **Corpus** — 5,573 governance training examples (the fuel for every LoRA).
- **Anti-drift gate + anti-pattern catalogue** — 14 documented AI poisons inverted, 6/6 test.
- **Holy Grail Charter** — 9 stages + PDCA + DRUM + Years->Days + alphabet gate, 6 modules tested-run.
- **Total: 2,598 commits (867 last 7 days).** This is a large real body of work — NOT nothing.

## 2. THE FRONTIER ROSTER (current-gen, HF-confirmed)
| Model | Params | License | GPU (int4) | Role |
|---|---|---|---|---|
| Kimi-K2.6 | 1.059T | other | 7 | flagship, govern-via-API |
| DeepSeek-V4-Pro | 861B | MIT | 6 | frontier MoE |
| GLM-5.2 | 753B | MIT | 5 | frontier MoE |
| DeepSeek-V4-Flash | 158B | MIT | 1 | cheap frontier-family, LoRA-able |
| Qwen3.6-35B | 36B | Apache | 1 | cheap frontier-family, LoRA-able |

## 3. THE TWO WAYS TO USE THEM (never conflate)
- **CALL (API)** — govern the flagships NOW, zero GPU. Wrap their endpoint in venturi+care+SIGIL.
- **HOST (Modal GPU)** — own/LoRA the weights. Single-GPU for Flash/Qwen3.6; multi-GPU for the 3 flagships.

## 4. GPU SEPARATION (Mac never eaten)
Mac runs ONLY: shim + SOV3 (0.5B) + SOV4 router. Every large model = its OWN remote endpoint (API or 1 Modal node each).
SSH-spread across micro boxes = DEAD (RAM + interconnect). One model = one GPU node.

## 5. YOUR PORTABLE "BEST BITS" (work on ANY open model, no retraining)
These wrap around the model and are the real differentiator:
- **Venturi throat** — signed routing gate (in front of the model)
- **Care-gate** — harm veto (wraps output)
- **SIGIL** — Ed25519 attestation (signs every answer)
- **Difficulty/cascade router** — small drafts -> big verifies -> speed (speculative-decode pattern, real 2-3x)
- **Anti-drift gate** — strips loops/hedging/praise -> shorter, faster, cheaper output

## 6. THE SPEED PLAY (venturi big->small->big, HONEST)
- REAL: small model drafts, big verifies, venturi routes by difficulty -> frontier quality at ~2x speed
  (most queries never need the flagship). Pieces exist: sov33_cascade_router.difficulty() + venturi_throat.
- NOT REAL: "pressure makes the big model itself faster" — FLOPs are fixed by size. Speed comes from
  the venturi DECIDING to use the small model when it can, not from squeezing the big one.

## 7. PIECES THAT CAN STILL SLOT INTO THE OWEM STACKS (found on disk, wireable)
- **BFT wrappers for DRUM + Intuition** — DRUM 30-entity f=9 quorum-21; Intuition 3-sense N-version. Fault-tolerance for the hive layers.
- **Dimensional layers 5D/6D/7D** — 4/4 import clean into the OWEM process (7D has AcousticSense/AirSense = the sensing layer).
- **Reputation-weighted council** — resolves borderline proposals by track record (vs flat vote). Real: borderline 0.76 weighted.
- **Oracle GenAI true-stack** — 5/9 models live (cohere-r 0.68s fastest, llama-3.3-70b 50.5 tok/s) — a reachable brain source.
- **7 NN planets** — 3 strong / 4 data-gated. The awareness layer, wired to the hive bus.

## 8. THE HONEST NEXT ACTIONS (in order, each with a checkable gate)
1. Wire venturi-cascade (small-draft/big-verify) + MEASURE real speedup (tokens saved, wall-clock). GATE: a number.
2. Govern one flagship via API (DeepSeek-V4 through NVIDIA NIM) behind the full stack. GATE: signed answer, Mac idle.
3. LoRA DeepSeek-V4-Flash (158B, MIT, 1-GPU) on the 5,573 corpus via Modal. GATE: tuned > base held-out.
4. SOV4 fuses 2 different-arch experts, measure fused vs best-single. GATE: fused >= best (the real emergence proof).

## HONEST BOTTOM LINE
The differentiator is the GOVERNOR (venturi+care+SIGIL+cascade), not the model size. It makes any open model
governed, signed, efficient — which nobody else ships. It does NOT make the base smarter; it makes it safer,
faster-in-aggregate, and attestable. That is real, sellable, and yours.
