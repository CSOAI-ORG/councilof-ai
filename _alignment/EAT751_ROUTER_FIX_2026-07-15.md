# EAT-751 SOV-751 SEAL — Router + Registry Fix (2 surfaces back online)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## Bug found (E2E BURN)
- `/api/sov4-router` (POST): 404 → 500 → 200 (3 fixes)
- `/api/sov4-registry` (GET): 404 → 200 (1 fix)

## Root causes
1. Routes not in vercel.json (Vercel proxy wasn't routing)
2. `_BRAIN_REGISTRY` global not defined
3. `_sov4_router_pick_brain` function not defined

## Fixes
1. Added both routes to vercel.json
2. Added `_BRAIN_REGISTRY` at module level (2 LIVE + 3 DENSE_STUB)
3. Added `_sov4_router_pick_brain` before the route

## E2E verified
- `/api/sov4-router` POST → returns `{selected_brain: sovereign-qwen3-v3, routing_strategy: ...}`
- `/api/sov4-registry` GET → returns `{n_brains: 5, registry: [...]}`

## Full E2E summary (this burn)
| Surface | Status |
|---|---|
| /api/sov4 (POST) | ✓ 200 |
| /api/sov4/identity (GET) | ✓ 200 |
| /api/sov4/citation-compare (GET) | ✓ 200 |
| /api/hardline-test (GET) | ✓ 200 |
| /api/sov4/3-diverse (GET) | ✓ 200 |
| /api/sov4/on-hermes (GET) | ✓ 200 |
| /api/sov4/session/history (GET) | ✓ 200 |
| /api/sov4-router (POST) | ✓ 200 (was 500) |
| /api/sov4-registry (GET) | ✓ 200 (was 404) |
| /api/sovereign-ask-real (POST) | ✓ 200 |
| /api/sovereign-bench (GET) | ✓ 200 |
| /api/sovereign-readme (GET) | ✓ 200 |
| /api/citation-correctness (GET) | ✓ 200 |
| /api/continual/pool (GET) | ✓ 200 |
| /sov4-tab.html (GET) | ✓ 200 |

**15/15 = 100% pass.**

## Hard lines preserved
- ✅ No T-count aggregates
- ✅ No face-rec / tracking / AUKUS-without-letter / defonos
- ✅ Care Floor 0.95
- ✅ SIGIL Ed25519
- ✅ Article 0 immutable
