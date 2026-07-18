# EAT-750 SOV-750 SEAL — 3-Diverse Registry Fix (was 500)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## Bug found
`/api/sov4/3-diverse` returned **HTTP 500** — NameError on `_BRAIN_REGISTRY`.

## Root cause
`_BRAIN_REGISTRY` was only defined in the citation-compare route's local scope (EAT-746 added the 2-live + 3-stub brains there but the global `_BRAIN_REGISTRY = [...]` was never declared at module level).

## Fix
Added global `_BRAIN_REGISTRY` (2 LIVE + 3 DENSE_STUB) before the `/api/sov4/3-diverse` route.

## Verification
| Surface | Before | After |
|---|---|---|
| `/api/sov4/3-diverse` | **500 Error** | **200 OK** |
| `current_state.total_brains` | — | 5 |
| `current_state.live_brains` | — | 2 |
| `current_state.stub_brains` | — | 3 |
| `readiness.emergence_proof_ready` | — | false |

## Honest register
- 2 live (qwen3-1.7b-dense, qwen3-0.6b-dense) — same architecture (both qwen3)
- 3 stubs: sovereign-moe (Qwen3 30B-A3B), sovereign-ssm (Mamba), sovereign-tinyllama
- All 3 stubs have honest `blocker` strings
- 3-diverse architectures needed for SOV4 emergence proof (per Claude science SOV4-P2)
- Owner-gated: NVIDIA NIM credential needed for sovereign-moe and sovereign-ssm

## Hard lines preserved
- ✅ No overclaim: 2 live + 3 stubs is what we actually have
- ✅ No T-count aggregates
- ✅ Care Floor 0.95
- ✅ SIGIL Ed25519
- ✅ Article 0 immutable
