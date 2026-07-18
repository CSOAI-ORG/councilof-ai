# Readiness gate + the recurring ~/.sovereign path fault (2026-07-12)

## What the gate does
`sov33_readiness_gate.py` scores every entrypoint capability: RUNNING / GATED / BROKEN.
- GATED = cleanly reports it needs an owner/GPU/endpoint (fail-soft) — production-ready, NOT a fault.
- BROKEN = a code fault (raises or errors on a hardcoded path). Ship rule: BROKEN must be 0.
- The gate does NOT call model/endpoint-touching caps (they'd block on a live socket) — GATED by name.
- The gate skips itself ('readiness') to avoid infinite recursion.

## Root cause of the recurring fault (fix at the source)
New capability modules keep writing to `~/.sovereign` / `~/.hermes/skills` at CALL time with raw
`Path.home() / '.sovereign'`. In the sandbox that raises `Operation not permitted`. EVERY new module
must instead:
  - route state dirs through an env-overridable, fail-soft `_sov_dir()` (SOV33_SIGIL_DIR) helper;
  - wrap any `.exists()`/`.iterdir()` on a possibly-denied path in `try/except OSError` -> treat as absent.
This is the SAME pattern as the 51-component import batch — apply it to call-time paths too.

## Current state (measured)
43 RUNNING, 15 GATED, 0 BROKEN across 58 capabilities. SHIP-READY. Registry 51/51.
