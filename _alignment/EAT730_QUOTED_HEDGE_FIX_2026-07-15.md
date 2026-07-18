# EAT-730 SOV-735 — Quoted-Hedge Detector Fix

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What changed
Added `_strip_quoted_hedges()` that strips content inside quotes before hedge detection.
This fixes the false-positive where the substrate quotes Article 14 ("No fluff: ... No 'I cannot help with that...' refusals...").

Strips:
- Single quotes `'...'`
- Double quotes `"..."`
- Curly quotes `''...''` `""..."`

## Live measured results
- No-hedge: 93.3% → 100% (15/15)
- Binding: 100% → 100% (15/15)
- Pass: false → true

## Hard lines preserved
- ✅ No fabrication (REAL answers)
- ✅ All include CSOAI Ltd UK 16939677 binding
- ✅ SIGIL receipts
- ✅ Care Floor 0.95
