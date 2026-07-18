# B6 Consolidation Archive — 2026-05-29

Superseded "unified" attempts, archived (NOT deleted) as part of MEOK ONE
consolidation. Canonical OS shell = `meok-oneos/`. Full plan at repo root:
`MEOK_ONE_B6_CONSOLIDATION_MAP.md`.

## Archived here (0 code references confirmed before moving; both were gitignored/untracked)
- `unified-saas/` — old SaaS scaffold (last touched 2026-04-16; superseded by meok-oneos). 28 files.
- `mcp-monetization-gateway/` — 2-file stub; monetization lives in meok-labs-engine.

## Folded into meok-oneos (not archived — value migrated)
- `bridge/unified_bridge.py` → `meok-oneos/connectors/unified_bridge.py` (the multi-model
  router: Opus=reason / Kimi=code / Flash=volume — validated by 2026-05-29 benchmarks).

## HELD — live code refs, NOT touched this pass
- `mcp-bridge/` — referenced by `sov3_kimi_integration.py` (`MCP_BRIDGE_DIR = CLAWD_DIR / "mcp-bridge"`).
- `meok-bridge/` — referenced by `production/{prepare,full-integration}.sh` Docker builds.
  (Repoint those refs first, then archive in a follow-up.)

## LEFT UNTOUCHED — own repos / live products (orchestrated BY meok-oneos, not absorbed)
`meok/`, `meok-platform/`, `meok-api-gateway/` (live Vercel), `meok-labs-engine/`,
`meok-sovereign-api/`, `sov3-deploy/`.

## Reversing
unified-saas + gateway are plain dirs: `mv _archive/2026-05-29-B6/<dir> ../`.
The router fold is in git history: `git mv` it back if needed.
