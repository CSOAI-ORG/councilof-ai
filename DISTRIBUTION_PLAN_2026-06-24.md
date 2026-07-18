# MEOK / CSOAI — Distribution Plan (2026-06-24)
**The problem (measured):** 233 `*-mcp` servers, fleet live on PyPI, **15 total GitHub stars.** Supply ≫ distribution. This plan attacks discovery, not more building.

## A. Publish the keystone (one owner step)
Gateway is publish-ready (`meok_compliance_gateway-0.2.0-py3-none-any.whl` builds clean). Release checklist:
```bash
cd ~/meok-compliance-gateway
python -m build                       # ✅ already verified — wheel + sdist
twine check dist/*                    # validate metadata/long-description
twine upload dist/*                   # NEEDS Nick's PyPI token (owner-gated)
#   token: https://pypi.org/manage/account/token/  → ~/.pypirc or TWINE_PASSWORD
```
Then verify: `pip install meok-compliance-gateway` from a clean venv.

## B. Get the live fleet DISCOVERED (the real lever)
> 🐝 **The distribution hive already EXISTS — don't build, FIRE it.** `clawd/registry-publish` (bulk MCP-registry publisher, `bulk_publish.sh` + server.json manifests), `CSOAI-CORP/mcp-packages/mcp-distributor` (TS distributor), `.hermes/skills/mcp-publisher`, and `DISTRIBUTION_LAUNCH_PACKAGE.md` are built and target **Smithery (323 refs) · Glama (39) · PulseMCP (15) · mcp.so (8) · PyPI · npm**. Status: **PyPI partially fired** (satellites live; 10 more token-gated), **Glama "ready," Smithery "next," npm empty.** The 15-stars gap = the hive is staged but **not fully fired** (token + marketplace-account gates). Upgrade = activate the connectors, king-hive-style (on a loop), not write a new publisher.

The packages exist; almost nothing points to them. Per-channel:
1. **Official MCP registry** — ensure every published `*-mcp` has `server.json` + `.mcp.json` + `llms.txt` (memory: ~70 repos need only `.mcp.json`). Submit/refresh registry entries.
2. **PyPI hygiene** — each package needs a real README long-description, keywords (`mcp`, `ai-governance`, `compliance`, `eu-ai-act`), classifiers, and a project URL back to GitHub + meok.ai. Right now discovery dies on empty metadata.
3. **GitHub** — pin the flagship 12 on the org; add topics (`mcp`, `ai-safety`, `compliance`); one strong README per flagship with a 30-sec demo gif. Stars follow usable READMEs, not repo count.
4. **Marketplaces / directories** — submit to the MCP directories and AI-tool catalogs (Smithery, mcp.so, PulseMCP, Glama, etc.). Free, mostly unused.
5. **AEO/GEO** — `llms.txt` per flagship (done for MEOK Earth); answer-engine optimization so Claude/GPT/Perplexity surface the fleet.
6. **One "hero" MCP** — pick the single most useful (e.g. `eu-ai-act` / `agent-prompt-injection-firewall`) and make it genuinely best-in-class + documented; let it be the front door.

## C. npm — decision: SKIP for now
npm is empty + not logged in. The fleet is Python/PyPI; npm is **not needed**. Don't spend the round on it. (Kills the stale "51 npm" claim.)

## D. Sequencing (highest ROI first)
1. `twine upload` gateway (owner, 10 min).
2. PyPI metadata pass on the flagship 12 (README/keywords/URLs) — discovery floor.
3. MCP registry + 3 marketplace submissions.
4. One hero MCP polished + demo gif.
5. Measure: PyPI download trend + stars trajectory (the Series A milestone).

## E. What's owner-gated
PyPI token (A), any npm login (C, skip), domain/DNS for public hosting. Everything else is doable without Nick.
