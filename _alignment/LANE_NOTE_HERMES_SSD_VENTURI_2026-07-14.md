# LANE NOTE — Hermes SSD+Venturi 6-lever speedup (triage 2026-07-14)

Triage of the Hermes paste claiming 25.2× combined speedup. Same discipline as prior lane-notes:
separate what's a real ARITHMETIC ceiling from what's a wall-clock claim that needs HW measurement.

## VERIFIED (arithmetic ceiling — real)
- **SSD-stream footprint: 6/384 experts = 1.56% loaded.** This matches my own `sov33_venturi_stream.py`
  mechanism proof exactly. The compute-avoided **ceiling is 64×** (you skip 378 idle experts' matmuls).
- The paste's headline **44.6× for the SSD lever is BELOW the 64× ceiling** → arithmetically plausible
  (overhead eats the gap). So the number is not impossible; it's a defensible proxy for compute avoided.
- SIGIL-inline "free" is consistent with my measured Venturi throat (~481 µs/throat, near-zero on the path).

## HOLD AS LEAD (not wall-clock verified)
- **25.2× combined, 2–5 tok/s target** are CPU-PROXY + ESTIMATE, NOT measured LLM wall-clock. The paste
  says this itself (honest). Real wall-clock stays **Colibri's published 0.30–0.42 tok/s** until the owner
  runs the full 6-lever stack on real hardware with real GLM-5.2 weights.
- LRU 75% hit / prefetch 70% acc are ASSUMED hit-rates, not measured on a real token stream. Keep as design
  parameters to measure, not as facts.

## DISCREPANCY TO RECONCILE (do not silently adopt)
- Paste receipt says **"Care floor: 0.95"**. Our canonical governance floor is **0.35**. 0.95 would veto
  almost everything — it's almost certainly a per-hop CONFIDENCE threshold mislabelled as the care floor.
  **Do NOT change the 0.35 governance floor to match a receipt.** Reconcile the naming first.

## WHAT TO INTEGRATE (real, buildable)
- The 6-lever DECOMPOSITION is a sound engineering roadmap for the runtime seam: SSD-stream → peer-predict
  → Venturi-batch → SIGIL-inline → LRU → prefetch. It belongs as the OPTIMIZATION SPEC for the Colibri
  bridge (`sov33_colibri_bridge.py`), each lever a measurable knob — NOT as a claimed speedup number.
- The "speedup lives at the seams, not the brains" framing is correct and matches Venturi=SIGIL: the throat
  is already on the critical path, so batching/prefetch/signing there is genuinely low-cost.

## BOTTOM LINE
Ceiling math checks out (64× possible, 44.6× claimed plausible); the combined 25.2× and tok/s targets are
proxy/estimate and stay LEADS until owner HW measurement. Care-floor naming must be reconciled before the
receipt is trusted. The lever list is a real optimization roadmap for the bridge.
