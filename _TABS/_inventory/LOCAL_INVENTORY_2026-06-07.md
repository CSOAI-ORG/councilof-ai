# 💻 LOCAL PC SCAN — product/code dirs (2026-06-07, ~/)
*By the MEOK ONE tab. Pairs with GITHUB_INVENTORY_2026-06-07.md.*

## Big local trees (at ~/, NOT under clawd/)
- `~/fleet-clones/` — **13** compliance MCP clones (eu-ai-act, dora, nis2, cra, gdpr, hipaa, soc2, iso-42001, csrd, bias-detection, governance-engine, injection-scan, csoai-crosswalk)
- `~/hive-staging/` — **29** hive products (per-domain King/Queen builds: meok, csoai, councilof, optimobile, planthire, fishkeeper, koikeeper, muckaway, grabhire, agisafe, safetyof, biasdetectionof, pokerhud, loopfactory, diyhelp, asisecurity, transparencyof, accountabilityof, ethicalgovernanceof, openMCP, commercialvehicle…)
- `~/mcp-servers/` — **218** vertical AI MCP servers (healthcare, financial, legal-tech, maritime, insurance, real-estate, retail, supply-chain, telecom, space, gaming, autonomous-vehicles, education/oneos, proofof, ca3o/casa cert…). ⚠️ includes severed `terranova-defence` — leave it.
- `~/clawd/mcp-marketplace/` — the ~350-pkg published fleet (gitignored, local only — the PyPI source of truth)

## clawd/meok/ — the BIG consumer app (3.9 GB)
The original/full MEOK app. Holds the source the hub under-credits:
- **Characters** (27, `db/characters.json`), **Guardian** (`core/family_guardian.py`, `mcp/tools/{family_guardian,voice_guardian}.py`), **Family OS**, council, agents, api.
- Distinct from `meok-one/` (the newer deployed OS). The hub assigns `meok/` to NO tab — open question.
- ⚠️ **Local-only / unpushed** — no matching GitHub org repo for this 3.9 GB tree. Backup risk.

## Robotics — honesty check
- **Asimov is NOT on disk as code** — only `~/Downloads/…asimov-v1….jpeg` + design notes. Matches the known "Asimov-not-on-disk" gap. Don't claim a codebase.
- On disk: `clawd/wolf-actuator/` (gear/actuator work), `clawd/harvi-funding/` + `HARVI_FUNDING_TRACKER.md`.

## meok-* surface dirs under ~/clawd (MEOK ONE + distribution)
meok-one · meok-oneos · meok-mobile · meok-desktop · meok-3d-characters · meok-amica · meok-platform ·
meok-cli · meok-sdk-{python,go,typescript} · meok-vscode-extension · meok-slack-app · meok-teams-app · meok-skills · meok-integrations ·
meok-agent-zero (OLM engine) · meok-labs-engine · meok-godeye · meok-quiz ·
meok-auth · meok-bridge · meok-sigil · meok-sovereign-api · meok-api-gateway · meok-brand · meok-marketing · meok-ai-landing · meok-ai-act-pages · meok-kits-host · meok-verify · meok-setup · meok-attestation-api · meok-compliance-gateway

## Top-level git repos in ~/ (org-repo working copies)
awesome-mcp-servers · cobol-bridge · councilof-ai · fishkeeper-ai · industrial-hire-ai · koikeeper-ai ·
meok-ai (OLM) · meok-ai-frontend · meok-compliance-gateway · meok-cross-post · meok-eat-mcp ·
muckaway-ai-mcp · openmoe-bft · planthire-ai-mcp · safetyofai · scf-game-v1 (poker/game) · wong2-awesome-mcp-servers
