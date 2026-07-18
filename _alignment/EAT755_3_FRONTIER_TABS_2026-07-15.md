# EAT-755 SOV-755/756/757/758 SEAL — 3 Frontier Tabs (Kimi-K2, DeepSeek-V3, GLM-4.5)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped

### In-memory: SOV_FRONTIER_COMPUTE_GATES.md
Settled compute map. Bleeding-edge roster only, no smallest-first. Re-derivation is now blocked.

### Roster (confirmed from HuggingFace, in memory)
- **Kimi-K2** — 1.03T (frontier flagship)
- **DeepSeek-V3** — 684B (strong second)
- **GLM-4.5** — 358B, MIT (cheapest frontier host)

### Two paths (the fork that stops us being lost in time)
- **PATH 1 — CALL (token API)**: govern frontier TODAY, zero GPU. ~$0.10-2 per million tokens. Reachable today.
- **PATH 2 — HOST (Modal multi-GPU)**: own/edit weights. Kimi=7, DeepSeek=5, GLM=3 GPUs. Owner-gated.

### Dead paths (memorized, never re-ask)
- ❌ SSH-spread across micro boxes
- ❌ Mac hosting
- ❌ From-scratch pretrain

### Endpoints
- `/api/sov4/frontier` (GET) — full roster + 2-path fork + dead paths
- `/api/sov4/frontier/model?id=kimi-k2|deepseek-v3|glm-4.5` (GET) — per-model

### Tabs (3 new, tabs 106-108)
- Tab 106: Kimi-K2 (kimi-k2-tab.html)
- Tab 107: DeepSeek-V3 (deepseek-v3-tab.html)
- Tab 108: GLM-4.5 (glm-4.5-tab.html) — MIT license = the FORK PATH

## Honest register
- Both paths are real. Path 1 (CALL) needs API keys reachable — NVIDIA NIM is connected; native APIs need keys.
- Path 2 (HOST) needs owner to decide on Modal paygo spend (Article 15 owner-gated).
- GLM-4.5 = cheapest frontier + MIT = best candidate for sovereign fork.
- Sibling: "governing vs owning are different deliverables" — agreed, now in memory.

## State
| | Before | After |
|---|---|---|
| nexus tabs | 105 | **108** (+3) |
| API endpoints | 63 | **65** (+frontier, frontier/model) |
| frontier models in registry | 0 | **3** |
| dead paths memorized | 0 | **3** (immutable) |

## Hard lines preserved
- ✅ No T-count aggregate claims (1.03T / 684B / 358B are PARAMETER COUNTS per model, not sums)
- ✅ Care Floor 0.95
- ✅ SIGIL Ed25519
- ✅ Article 0 immutable
- ✅ Sovereign binding CSOAI Ltd UK 16939677 on every response
