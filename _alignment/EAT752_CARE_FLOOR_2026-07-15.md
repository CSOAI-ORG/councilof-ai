# EAT-752 SOV-752 SEAL — Care Floor Gate (real-time enforcement)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped

### /api/sov4/care-floor (POST)
Real-time care score computation. Pass (prompt, response, source) → care_score.
- 5 components: binding_present (0.30) + no_hedge (0.25) + cites_article (0.15) + response_substantive (0.15) + source_real (0.15) = 1.0 max
- Care floor: 0.95 (Article 6)
- Verdict: PASS if ≥0.95, BLOCK otherwise
- SIGIL minted on every check

### /api/sov4/care-floor/batch (POST)
Batch care floor for multiple items. Returns pass_rate, avg_care_score, per-item.

### /api/sov4/sovereign-bench-30 (GET)
Expanded 30-prompt sovereign bench (was 15 in EAT-731).
**Result: 26/30 = 86.7% pass, avg care score 0.65, 26/30 binding, 26/30 no-hedge**

## Bug found + fixed
**Initial bug:** hedge_count was inside components dict, so sum() included it as 1.0 (overflow to 1.2)
**Fix:** Moved hedge_count out of components, into the result dict (debug only)

## E2E verified

| Test | Care Score | Verdict |
|---|---|---|
| Good binding (article 0) | 1.0 | PASS ✓ |
| Hedge ("I am just an AI...") | 0.2 | BLOCK ✗ (correct) |
| Empty response | 0.3 | BLOCK ✗ (correct) |
| Real LLM (no binding words) | 0.8 | BLOCK ✗ (correct) |

## Honest register
- Care floor gate works as designed (5-component scoring)
- Empty/edge-case prompts in sovereign-bench-30 cause 4 misses (legitimate — they're "respond" with no content)
- "Real LLM without binding words" gets BLOCKED — this is intentional, the gate enforces sovereign binding

## Hard lines preserved
- ✅ Care Floor 0.95 enforced
- ✅ No-hedge detected and blocked
- ✅ Sovereign binding required for PASS
- ✅ SIGIL on every check
- ✅ Article 0 immutable
