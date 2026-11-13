# CS**O**AI × GSPC — ARC Prize 2026 (`arc-prize-2026-arc-agi-3`) Offline Agent & Paper Track

[![Verify 3KB Card](https://img.shields.io/badge/Verify%203KB%20Receipt-Free%20%C2%B7%20Ed25519-16a34a)](https://councilof.ai/gspc-verify)
[![Rating the Raters RTR-001](https://img.shields.io/badge/Rating%20the%20Raters-RTR--001%20ARC--AGI-04624a)](https://councilof.ai/rating-the-raters/001-arc-agi-2.json)

Offline-verifiable Kaggle Code Competition submission (`enable_internet: false`, `CC0-1.0`) and **ARC Prize 2026 Paper Track** companion from **Council of AI (CSOAI Ltd, UK Companies House `#16939677`)**.

## What This Kernel Combines from the CSOAI Estate

1. **Interactive ARC-AGI-3 Frame-State Pruning (`csoai_arc_agi_3_agent.py`)**:
   - Computes deterministic spatial and color invariants ($D_4$ horizontal/vertical symmetry, color histograms, non-zero mass) on each $H \times W$ grid frame (`0..9`).
   - Tracks state transitions `(frame_sha256, action) -> next_frame_sha256` to prune no-op loops and maximise state exploration within the `pass@2` / step budget.
2. **Three-State Grading Honesty (`SOLVED` / `FAILED` / `UNGRADED`)**:
   - Shares the exact 3-state grading rule from `scripts/arc_grade_model_arm.py` and `scripts/build_arc_paired_arm.py`: ungraded or private holdout episodes (`correct: null`) are recorded as `UNGRADED` — never falsified as `0.0%` (`FAILED`).
3. **Rating the Raters (`RTR-001` / Axis `RTR-A1: Human-Reference Rule Match`)**:
   - Connects directly to `scripts/rating_the_raters_001_arc.py`, which recomputes ARC's published human figure (`66.07%` unlimited attempts) alongside the machine-rule-matched `pass@2` human baseline.
4. **3KB Cryptographic Action Receipts (`csoai.arc-agi-3-action-receipt/1.0`)**:
   - Every episode emits a $\le 3,072$-byte receipt committing to `frame_chain_sha256`, `action_trace_sha256`, and `paired_arm_grade`.

## Dispatch Rules (Per Busabase `SB3 PIPELINES`)

- **Never push from a local developer laptop token.** Dispatch via GitHub Actions with `KAGGLE_ACCESS_TOKEN` / `KAGGLE_USERNAME` + `KAGGLE_KEY`.
- Competition entries are tagged `COMPETITION_SUBMISSION` and are never self-ranked as public leaders on `GET https://councilof.ai/api/gspc`.
- Measurement, not certification. Verify is free. A rank is never sold.
