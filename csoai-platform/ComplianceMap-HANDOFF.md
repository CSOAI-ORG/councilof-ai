# /compliance-map — Handoff to Nick

**Date**: 2026-06-12
**Branch**: feat/compliance-map
**Commit**: 4ef36c7 (2 files, +1,140 lines)
**Source file**: csoai-platform/client/src/pages/ComplianceMap.tsx (1,136 lines, new) + csoai-platform/client/src/App.tsx (4-line route addition)
**Repo**: /Users/nicholas/clawd/csoai-platform/ (remote: openmore.ai, 403 SSH)

## What the commit does

Wires the CSOAI sovereign equivalent of OpenGridWorks (which is the closed-data US version you sent). Same UX shape — layered map + URL-state contract + side panel — but for the regulation layer. Every registered CSOAI AI system plotted against the regimes, frameworks, and time horizons that govern it.

- 4 toggleable layers: 13 regimes (EU AI Act, GDPR, NIS2, CRA, DORA, UK AI Bill, US NIST RMF + Colorado ADMT, Canada AIDA, APAC cluster Singapore + China + Japan + Korea) + 10 frameworks (ISO 42001/27001/23894/42005, NIST RMF + GenAI, Singapore Model AI v2, OECD, UNESCO, CSA STAR) + 12 time horizons (the 8 EU AI Act cliff dates + major US/UK/APAC ones) + 42 AI systems (the 36 council nodes + 6 power-infrastructure nodes from OpenGridWorks Phase 1).
- URL-state contract mirrors OpenGridWorks: `?lat=&lng=&z=&layers=regimes,frameworks,time,systems&panel=open|closed`. Share-link UX works.
- Pure inline SVG, no Mapbox/Google/MapLibre key, no external CDN. Sovereign data.
- 4-side-panel inspector (per marker kind): regime, framework, horizon, system. Each shows the relevant bindings, the council substrate attestation, and a "Verify on Council" link.
- Source-of-truth footer: EU implementation tracker + NIST + ISO + ENISA + Cyber Resilience Act links.
- Cross-links to /article-50-kit + /opengridworks + /council/law + /council/dome + /council/globe?preset=physical-infra.

## Why push failed

Same openmore.ai 403 as OpenGridWorks + /article-50-kit + dossier. The Mavis session's GITHUB_TOKEN has no write scope on this remote. Branch is local-only; needs Nick to push from his auth.

## How to apply

```bash
cd <your openmore.ai clone>
git checkout main
git pull

# Apply the patch:
git apply --check /Users/nicholas/clawd/csoai-platform/ComplianceMap-Patch-2026-06-12.patch
git apply /Users/nicholas/clawd/csoai-platform/ComplianceMap-Patch-2026-06-12.patch

# Verify the diff is just the 2 files:
git diff --stat
# Expected:
#   csoai-platform/client/src/App.tsx                 |    4 +
#   csoai-platform/client/src/pages/ComplianceMap.tsx | 1136 ++++++++++++++++++++++
# 2 files changed, 1140 insertions(+)

# Commit + push + open PR in browser (gh CLI may 404):
git add csoai-platform/client/src/App.tsx csoai-platform/client/src/pages/ComplianceMap.tsx
git commit -m "feat(map): /compliance-map — sovereign regulation × framework × time × AI-system map"
git push origin main
# Open PR: https://github.com/CSOAI-ORG/openmore.ai/pull/new/main
```

## Build verify (local)

```bash
cd csoai-platform
npm run check   # tsc --noEmit; 0 new errors from this commit
npm run build   # full Vercel build
```

Pre-existing tsc errors in `client/src/components/Analytics 2.tsx`, `Analytics.tsx`, and `CouncilGlobe.tsx` are unrelated. The /compliance-map change has 0 new tsc errors.

## Cross-tab reference

- `_TABS/STATUS.md` — current state
- `_TABS/GITHUB_PR_FALLBACK_2026-06-12.md` — failure-mode matrix (Path A = SSH push, Path B = WebBridge upload, Path C option (c) = hand Nick the patch — the right path for openmore.ai 403 SSH)
- `/opengridworks` (patch #4) — the OpenGridWorks-equivalent physical-cyber twin page
- `/article-50-kit` (patch #5) — the Article 50 Kit wire (the £999 conversion surface)
- `meok-watermark-attest-mcp` PR-HOTFIX-1 at bef9140 (cliff date fix to the MCP source)
- `did:csoai` spec v1.0 — the regime-binding reference architecture for the `compliance` field in DID Documents
