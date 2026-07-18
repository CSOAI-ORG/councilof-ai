# 🧹 Vercel — COMPLETE Project Audit (2026-06-10)
*Supersedes VERCEL_AUDIT.md (which was capped at 50). Pulled ALL **161 projects** via team-scoped API with custom domains + last-deploy dates. No deletions executed — table below is the evidence; Nick approves the DELETE column before anything is removed.*

## ✅ KEEP — domain-holding projects (24, the real estate)
| Project | Domain(s) | Last deploy |
|---|---|---|
| ui | **meok.ai, www.meok.ai, try.meok.ai** | 2026-06-10 |
| meok-attestation-api | **proofof.ai, www.proofof.ai** | 2026-06-10 |
| meok-api-gateway | api.meok.ai | 2026-06-03 |
| eu-ai-act-landing | compliance.meok.ai | 2026-05-30 |
| council-ai-storefront | **councilof.ai** | 2026-06-06 |
| csoai-dashboard | **csoai.org** | 2026-06-09 |
| haulage-app-umbrella | haulage.app | 2026-06-07 |
| templeman-opticians-site | templeman-opticians.com | 2026-05-29 |
| fishkeeper-site / koikeeper-site | fishkeeper.ai / koikeeper.ai | 2026-05-31 |
| wcr-grab-hire | wcrgrabhire.co.uk | 2026-05-31 |
| tree-king-complete | tree-king.co.uk | 2026-05-05 |
| asisecurity-ai / agisafe-ai | asisecurity.ai / agisafe.ai | 2026-04/2025-10 |
| dataprivacyof-ai · transparencyof-ai · ethicalgovernanceof-ai · safetyof-ai · accountabilityof-ai · biasdetectionof-ai | their .ai domains | 2026-04→05 |
| prooof-ai | prooof.ai (typo-domain defensive redirect?) | 2026-06-07 |
| csga-global-site | ⚠️ **cobolbridge.ai** — see red flag below | 2026-05-31 |

## 🔴 RED FLAG: cobolbridge.ai is served by a SEVERED-BRAND project
`csga-global-site` (repo `CSGA-GLOBAL-SITE`) holds **cobolbridge.ai**. Standing rule = no CSGA. Fix = deploy cobolbridge from a clean repo (`cobolbridge-site` exists in clawd) and move the domain, THEN delete the csga project. **Do not delete before the domain moves.**

## 🗑 DELETE — severed-brand projects, no domains (12) — standing decision authorises
`terranova` · `terranova-ocg` · `terranova-mu` · `terranova-aerospace` · `terranova-secdef` · `erranova` · `csga-ai` · `csga-global` · `csga-mooc-v2` · `csga-research-institute-preview` · `csga-global-v34` · `bmcc-cuny` · `bmcc-cyber`
(all Feb–May, zero domains; these are PUBLIC deployments of a brand Nick severed)

## 🗑 DELETE — duplicate clusters, keep-one (≈22)
| Cluster | Keep | Delete (no domains attached) |
|---|---|---|
| Optimobile | optimobile-site (newest) | optimobile-saas · -demo · -lead · -final · -proper |
| Templeman | templeman-opticians-site (has domain) | templeman-100 · -final · -leadgen · -expanded · templeman-opticians |
| Haulage | haulage-app-umbrella (has domain) | haulage-deploy · haulage-app (stale dup of same domain) |
| WCR | wcr-grab-hire (has domain) | wcr-spa · wcr-redirect · wcr-minimal · wcr-grab-hire-complete · wcr-grab-hire-site |
| CobolBridge | (pending domain move above) | cobolbridge-upgrade · cobolbridge-deploy · cobol-bridge-demo · cobol-bridge-static |
| CSOAI | csoai-dashboard (csoai.org) | csoai-readiness · csoai-platform · csoai-org-v2 · csoai-v2-open · csoai-org |
| Randalls | — | randalls-deploy · randalls-crane-hire-complete |
| Grabhire | grabhire-site (content) | grabhire · grabhire-ai · grabhire-ai-uk |
| Koikeeper | koikeeper-site (domain) | koikeeper-fresh · koikeeper-ai |
| Fishkeeper | fishkeeper-site (domain) | fishkeeper-ai |
| proofof | meok-attestation-api (domain) | proofof-site · proofof-ai |
| councilof | council-ai-storefront (domain) | councilof · councilof-ai · councilof-ai-sale |

## 🗑 DELETE — accidental build-dir / scratch deploys (10)
`frontend` · `client` · `dist` · `tmp` · `checkout-deploy` · `countdown` · `website` · `clawd` · `meok-api-gateway-tmp` · `landscaping-essex-complete`

## 🟠 FOLD INTO meok.ai routes then delete (8)
`medtech` · `fintech` · `cybersec` · `kidsai` · `fine-calculator` · `dpia-template` · `compliance-score` · `risk-classifier` (all already exist as meok.ai/* routes)

## 🟡 DECIDE — ambiguous (Nick call)
- `meok` / `meok-ai` / `meok-saas` / `meokclaw-v2` / `meok-ai-frontend` / `meok-marketing` / `meok-quiz` / `meok-verify` / `meok-kits-host` — meok-kits-host hosts the EU-AI-Act kit ZIP (KEEP); meok-verify is the trust page (KEEP or fold). Others look stale.
- ~12 `*-mcp` Vercel projects (a2a-governance-bridge-mcp …) — remote MCP endpoint experiments from 06-07. Keep if remote-MCP is a roadmap item, else delete.
- `agisafe-ai-sale` · `councilof-ai-sale` — domain-sale landers; keep if domains still for sale.
- 2025-10 vite leftovers: `muckaway-ai` · `commercialvehicle-ai` · `planthire-ai` · `landlaw-ai` · `socialmediamananger-ai` (note typo) — superseded by the *-site/*-uk versions.

## Net
~55–60 of 161 are deletable now with zero domain risk; another ~15 after folds/domain-moves. Cleanup halves the account.

**To execute:** Nick replies with "delete groups A/B/C" (severed-brand / duplicates / build-dirs) and I run them via the authenticated CLI — no token creation needed, the CLI session already has team scope (proved by this audit).
