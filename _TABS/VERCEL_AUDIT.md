# 🧹 Vercel Projects — Hygiene + Alignment Audit (2026-06-07)
*From the first 50 projects (API caps at 50 — you have more). The duplication pattern is undeniable.*
*Reading the list is free (MCP, done). DELETING/merging needs a team-scoped Vercel token (or your dashboard).*

## 🔴 Duplicate clusters — "work done twice"
| Cluster (one real product) | Vercel projects | Action |
|---|---|---|
| **Optimobile** (optimobile.ai) | optimobile-saas · optimobile-demo · optimobile-lead · optimobile-final · optimobile-proper | keep the one wired to **optimobile.ai**, delete the other 4 |
| **Templeman** (templeman-opticians.com) | templeman-100 · templeman-final · templeman-leadgen · templeman-expanded | keep the live one, delete 3 |
| **CSOAI** | csoai-readiness · csoai-dashboard · csoai-platform | keep csoai-platform (the org site), fold the rest |
| **Haulage** | haulage-deploy · haulage-app-umbrella | keep the umbrella (haulage.app), retire the other |
| **Optimobile leadgen extras** | optimobile-lead · templeman-leadgen | leadgen variants — merge into the main site |

## 🟠 Leftover build-dir deploys (accidental — almost certainly all deletable)
`frontend` · `client` · `dist` · `wcr-spa` · `checkout-deploy` · `countdown`
— these are deploys of build output folders, not real products. Verify no domain attached, then delete.

## 🟠 Should be ROUTES on meok.ai, not standalone projects (duplicate surface area)
- Industry hubs: `medtech` · `fintech` · `cybersec` · `kidsai` — already exist as meok.ai/* routes.
- Single tools: `fine-calculator` · `dpia-template` · `compliance-score` · `risk-classifier` — fold into meok.ai routes.

## 🟡 Typo / check
- `prooof-ai` (three o's) — likely a typo'd duplicate of proofof.ai. Confirm + delete.
- ~10 `*-mcp` projects (ai-gateway-mcp, agent-*-mcp…) deployed as Vercel projects — confirm whether these are intentional **remote MCP endpoints** (keep) or stray deploys (delete).

## Net
Of the first 50, roughly **20–25 are deletable or mergeable.** That's ~half. Extrapolated across the full set (100+), there's a large cleanup.

## How to execute (needs a TEAM-scoped token — `niks-projects`)
With it I will: pull the COMPLETE list with each project's **live domain + last-deploy date + git repo**, mark every one keep/merge/delete with evidence, and (on your go) delete the dead ones via the API. The deploy-cap is gone (Pro) so this is purely cleanup.
**Token:** Vercel → Account Settings → Tokens → Create → Scope: **`niks-projects` team**.
