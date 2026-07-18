# 🧬 Sovereign Consolidation Map — the ONE sovereign (2026-06-25)
Nick: "we have many sov builds — consolidate. It needs to remember + be aware/present across all layers, protocols, tools & UX, and be able to take control of the PC." This is the honest map: **what's canonical, what's duplicate, and the ONE blocker** — fragmented memory.

> ⚠️ This is a MAP + plan. Deleting/merging real builds (some 4 GB) is **owner-gated** — Nick/M2 execute the retires; I don't delete.

## The duplication (measured)
**~45 sovereign build dirs.** Clusters + the canonical pick:

| Cluster | CANONICAL (keep) | Duplicates / deploys (retire or archive) |
|---|---|---|
| **Brain (SOV3)** | `clawd/sovereign-temple` (4.0 GB, the real brain) + `clawd/sovereign-temple-live` (16 MB, **live agents, committed 3h ago**) | `~/sovereign-temple` (1.5M), `sovereign-temple-public` (99M, = export only), `sov3-deploy/*`, `meok-ai/sovereign-temple`, `sovereign-consciousness-system`, `Downloads/meok-ai-main/*`, `meok-sovereign-memory/12-co-work-repos/*` |
| **Town** | `clawd/sovereign-town` (the headless flywheel) + `meok-town-view` (the 3D viewer) | `sov-town`, `sov-town-llm`, `sov-town-poc`, `sovereign-town-deploy`, embeds in `csoai.org/`, `proofof-site/`, `hive-deploy-bulk/` |
| **OS** | `MEOK_OS/index.html` (the shipping OS) + `clawd/meok-one` (the bridge engine) | `meok-oneos`, scattered `meok/ui` |
| **Bridge/tools** | `sovereign-stack/sov3-bridge` (the MCP tool layer — `olm_route_query`, `record_memory`, 200+ tools) | `sov3-backbone`, `sov3-hermes`, `production/sov3` |
| **Companion** | the new RH **sovereign dock** in MEOK_OS + `meok-amica` (local VRM+voice tech) | `WebKit/meok-companion` |

## 🔴 THE blocker: memory is fragmented across ~11 stores
For the sovereign to "remember + be present across all layers," it needs **ONE memory** it reads/writes everywhere. Today it's split:
- `.hermes/state.db` (Hermes, 57,934 msgs) · `.meok/meta_memory.db` · `.mcp-memory/memories.db` · `.stepclaw/memory/main.sqlite` · `.meok_one/memory.db` · `meok-sovereign-api/meok_sovereign.db` · `sovereign-temple/data/{reflection_store,skill_library}.db` · `sovereign-temple/rag_core/enhanced_memory.py` (the SOV3 engine) · `meok-sovereign-memory/` (759 MB archive) · `jarvis-memory` ×2 · **+ the `sov_facts` localStorage I added last turn (11th silo — my mistake to fold in).**
→ **Result: the sovereign forgets when you cross surfaces.** No single source of truth.

### The fix (the consolidation that matters)
1. **Pick ONE canonical memory:** `sovereign-temple/rag_core/enhanced_memory.py` (SOV3, already has `record_memory`/`query_memories`, embeddings, hash-dedupe) = the brain's memory. Make it THE store.
2. **Every surface reads/writes it via the bridge** — the OS dock, town, web, CLI, AR all call `record_memory`/`query_memories` over `sov3-bridge` (one API), not their own DB. (The dock localStorage becomes a *cache* that syncs up, not an island.)
3. **One-time migrate** the other 10 stores → the canonical (Hermes 57k msgs + meok-sovereign-memory archive are the big ones worth importing; the rest are mostly stale).
4. **Retire** the duplicate temple/town/sov3 copies (owner-gated delete) once verified pointing at canonical.

## "Present across all layers + take control of PC"
- **Present everywhere = one memory + one bridge** (above). The sovereign dock, town, and any surface all talk to the *same* SOV3 brain + memory. That's "aware/present across layers, protocols, tools."
- **PC control already exists — wire, don't build:** `.hermes/skills/computer-use` + `.hermes/skills/apple/macos-computer-use` + `hermes-agent/skills/computer-use`. The sovereign dock → bridge → Hermes computer-use skill = "sovereign, take control of my PC." (Owner-gated to actually run — PC control is high-trust; keep a human confirm.)

## Target architecture (one line)
**ONE sovereign = one brain (`sovereign-temple`/SOV3) + one memory (`enhanced_memory`, unified) + one bridge (`sov3-bridge`) → present on every surface (OS dock · town · web · CLI · AR) → can drive the PC via Hermes computer-use, with a human-confirm gate.**

## Honest status
- The canonical pieces all EXIST and run. The work is **unification + retiring duplicates**, not new building.
- I should NOT have added a standalone localStorage memory last turn — it's the 11th silo. Correct move: the dock writes to the canonical SOV3 memory via the bridge (next build).
- Deletions/merges of 4 GB of real builds are **Nick/M2's call** — this map is the plan, not executed.
- Existing master docs to fold this into (don't duplicate): `MEOK_LAYER0_TRUE_ONE_2026-06-24.md`, `CONSOLIDATION.md`, `CSOAI_LAYER0_UP_MASTER_STACK_2026-06-19.md`.

## Next build (the real one)
**Wire the sovereign dock → SOV3 `record_memory`/`query_memories` via the bridge** — so the OS companion remembers through the *canonical* brain (present across every surface), replacing the localStorage island. Then wire the same dock → Hermes `computer-use` (human-confirmed) for "take control."
