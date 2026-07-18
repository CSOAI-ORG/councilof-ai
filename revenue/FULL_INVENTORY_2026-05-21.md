# Full Portfolio Inventory — All MCPs, Repos, Packages, Sites
**Date:** 2026-05-21
**Source:** Live API queries against GitHub, npm, PyPI, Vercel

## Headline numbers

| Surface | Count |
|---|---|
| **GitHub repos under CSOAI-ORG** | **373** (369 public · 4 private) |
| MCP servers (`-mcp` suffix) | **265** |
| Sites / marketing repos | 0 (live under CSOAI-ORG; they live in other places — see Vercel) |
| Infra repos (meok-setup, attestation-verify, sovereign-temple) | 3 |
| Other repos (libraries, templates, special) | 105 |
| **npm packages by csga_global** | **294** |
| **PyPI MCPs live (full count)** | **247 of 266 source dirs** (93% live) |
| **Local source dirs in `/Users/nicholas/clawd/`** | **296** top-level |
| **Local MCP source dirs in `mcp-marketplace/`** | **266** |
| **Total GitHub stars across all 373 repos** | **9** (yes, nine — distribution is the bottleneck, not product) |

## GitHub language breakdown
- Python: **260** repos (compliance MCPs)
- TypeScript: **40** repos (sites, infra)
- HTML: 8
- JavaScript: 3
- No primary language detected: 62

## Top 10 starred repos (the genuine traction signal)
1. ★★ music-production-ai-mcp (the only 2-star repo)
2. ★ qidi-printer-mcp
3. ★ pet-care-ai-mcp
4. ★ contract-review-ai-mcp
5. ★ sql-builder-ai-mcp
6. ★ threat-intelligence
7. ★ legal-tech-ai
8. ★ voice-audio-mcp

**Honest read:** 8 of 373 repos have any stars at all. The reach of the portfolio is structurally limited by zero distribution effort, not product quality.

## Vercel projects with live custom domains
- `csoai-v2-app` → www.csoai.org (4h ago) [the v2 you didn't like; old static site now serving]
- `council-ai-storefront` → councilof.ai
- `haulage-app` → haulage.app
- `dataprivacyof-ai` → dataprivacyof.ai
- `csga-mooc-v2` → (vercel.app only)
- `landlaw-ai`, `meok`, `grabhire-site`, `ui`, `meok-ai`, `meok-ai-landing`, `optimobile-site`, `csoai-org`, `lead-capture-deploy`, `safetyof-ai` — 15+ projects total (full list pending)

## Brands visible across portfolio
councilof · csga · csoai · haulage · meok · muckaway · planthire · proofof · safetyof · sovereign · cobolbridge · templeman · agisafe · biasdetectionof · transparencyof · climateof · dataprivacyof · optomobile · landlaw · iok-farm

**~20 brands.** This is the brand sprawl mentioned in the MEOK_LABS dossier — recommended consolidation is to MEOK (primary) + CSOAI (legal entity footer only) + 1-2 niche sub-brands (CobolBridge).

## Cross-reference: 39 "flagship" vs full 266 MCP source dirs

The 39-MCP "flagship" framing covers the named manifest-tier products. The full 266 MCP source dirs are:

- 39 flagships (covered in earlier dossiers)
- ~100 niche / lifestyle / utility MCPs from April-May batch (meal-planner, pomodoro, qr-code, password, etc.)
- ~50 industry-specific MCPs (fishkeeper, gardening, recipe-finder, etc.)
- ~70 mostly-experimental / "shipped to PyPI but no marketing surface" MCPs

**Per the trade-vertical and MEOK-Labs dossiers: 12-15 of these have no buyer profile and should be archived.**

## The honest distribution gap

We have:
- 373 GitHub repos
- ~234 PyPI packages live
- 294 npm packages
- 15+ Vercel projects with custom domains
- ~20 brands

We have shipped enough product surface for 3-5 startups. We have not shipped a single Show HN post. That is the entire story.

---

## Next-action prioritisation (from MASTER_PLAN_2026-05-20.md)

This inventory does NOT change the master plan recommendation:
1. **Stop building MCP #267.** The bottleneck is distribution.
2. **Ship Show HN Tue June 3 14:00 UTC.**
3. **Consolidate brands** to MEOK + CSOAI-as-legal-entity-only + 1-2 niche sub-brands.
4. **Polish top 10 flagships to 85/100** via `meok-mcp-template` + `bump_version.sh` automation (per MCP_CHECKLIST_TEMPLATE).
5. **Hard decision Aug 20** if MRR <£1k → MEOK becomes OSS side project, Templeman + farm become primary.
