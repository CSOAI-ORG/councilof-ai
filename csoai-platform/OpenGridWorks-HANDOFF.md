# OpenGridWorks Phase 1 — Handoff to Nick

**Date**: 2026-06-12
**Status**: Ready for Nick to apply to CSOAI-ORG/openmore.ai
**Reason for handoff**: The Mavis session's GITHUB_TOKEN has the right perms on
CSOAI-ORG/meok-ai (SSH push works, gh CLI 404) but NOT on CSOAI-ORG/openmore.ai
(SSh 403, HTTPS 403, gh CLI 404). The Mavis session can SSH-push to meok-ai but
the same token can't push to openmore.ai. Verified at 12:58 BST.

## What's in the patch

- 2 files, 580 net additions
- `csoai-platform/client/src/pages/OpenGridWorks.tsx` — new file, 576 lines
- `csoai-platform/client/src/App.tsx` — 4-line addition (1 import, 3 routes)

## How to apply

```bash
# 1. From the openmore.ai repo on main branch
cd <your openmore.ai clone>
git checkout main
git pull

# 2. Apply the patch
git apply --check /path/to/OpenGridWorks-Patch-2026-06-12.patch
git apply /path/to/OpenGridWorks-Patch-2026-06-12.patch

# 3. Verify what changed
git status --short
# Expected:
#   M  csoai-platform/client/src/App.tsx
# ??  csoai-platform/client/src/pages/OpenGridWorks.tsx

# 4. Commit
git add csoai-platform/client/src/App.tsx csoai-platform/client/src/pages/OpenGridWorks.tsx
git commit -m "feat(map): OpenGridWorks Phase 1 — sovereign physical-cyber twin page

Wires _TABS/OPENGRIDWORKS_INTEGRATION.md Reading 1: every CSOAI-
registered AI system mapped against the power infrastructure that
fuels it. Pure sovereign — inline SVG, no Mapbox/Google tokens, no
US cloud dependency.

Page (/opengridworks, /map, /physical-cyber-twin):
- 36 council nodes (12 domains, 32 countries)
- 7 power infrastructure seed nodes
- Inline Equirectangular SVG (3600x1800 viewBox, no external deps)
- Click any marker → side panel with full risk profile
- Filter + search + live meok-attestation-api /v1/health badge
- Animated council markers, 5-stat strip + Roadmap card

Why this matters:
- EU AI Act Article 51 (environmental impact)
- ISO 14064 (carbon footprint)
- ISO 27001 A.11 (physical security)
- Sovereign compute routing

Phase 2: Leaflet + cluster + live substrate
Phase 3: OpenGridWorks vendor data behind same UI

Co-authored-by: Mavis <noreply@meok.ai>"

# 5. Push + open PR
git push origin main

# 6. Open the PR in the browser (gh CLI may 404 due to token scope;
#    the web URL is the reliable path per _TABS/GITHUB_PR_FALLBACK_2026-06-12.md):
#    https://github.com/CSOAI-ORG/openmore.ai/pull/new/main
```

## Build verification

`npm run check` (tsc --noEmit) on the local working tree shows 0 new errors from
this patch. The 4 pre-existing errors in `CouncilGlobe.tsx` and
`Analytics*.tsx` are unrelated.

## Patch file location

`/Users/nicholas/clawd/csoai-platform/OpenGridWorks-Patch-2026-06-12.patch` (604 lines)

## Cross-tab reference

This is handoff artifact (4) of the PR-A + OpenGridWorks batch. See:
- `_TABS/STATUS.md` — current state
- `_TABS/GITHUB_PR_FALLBACK_2026-06-12.md` — failure-mode matrix
- `_TABS/OPENGRIDWORKS_INTEGRATION.md` — original scope doc
