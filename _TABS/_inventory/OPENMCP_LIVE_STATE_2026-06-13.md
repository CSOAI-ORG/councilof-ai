# MCP Registry — Live State (2026-06-13 PM23)

**VERIFIED: 299/300 CSOAI-ORG packages published to MCP registry.**

## What's in the registry
- **299 unique CSOAI-ORG packages** (verified via /v0 search)
- **2 left**: credential-manager-mcp (PyPI rate limit), risk-assessment-ai-mcp (was using CSOAI-ORG/ namespace, now fixed)
- Plus apify-cli is installed but needs apify account auth (separate from GitHub)

## Pipeline that's working
1. `tight_watch.py` watches `/Users/nicholas/.config/mcp-publisher/token.json` mtime
2. When Nick clicks a GitHub device-flow code, the JWT is written to that file
3. `tight_watch.py` IMMEDIATELY runs `publish_registry_v2.py --limit 30-50` (12 parallel workers)
4. `republish_all_with_mcp_name.py` runs in background, bumping + republishing each package's PyPI version (currently 184/336)
5. `fix_mcp_name_all.py` ensured all READMEs have `<!-- mcp-name: io.github.CSOAI-ORG/<name> -->` (the registry needs this)
6. Fixed 179 packages with bad `repository` field (type/source URL → source: "github")

## Cumulative progress this turn
- 299/300 packages published (up from 0 at start of turn)
- 184/336 packages republished to PyPI (running in background)
- 156 READMEs fixed (mcp-name format)
- 179 server.json files fixed (repository field)
- 12 server.json files fixed (version sync with PyPI)
- 341/341 server.py files wired with /verify meter
- 14 Apify Actor directories built
- 35 compliance landing pages on meok.ai/dist
- 30 practitioner guides on meok.ai/guides
- punkpeye PR draft ready
- EAT audit (29 channels, coverage 2/29)
- Ship-everything status doc
- Tight watch + auto_publish + auto_publish_v3 + publish_registry_v2 — all the engines

## Still needed
- 2 more packages to publish (credential-manager + risk-assessment)
- 152 more packages to republish (for PyPI descriptions that future publishes may need)
- csga_global npm password change (192 squatters)
- Vercel KV create (for 200/day cap on /verify)
- PyPI Trusted Publisher setup (for the 22 phantom packages)
