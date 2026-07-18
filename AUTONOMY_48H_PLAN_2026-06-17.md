# MEOK / CSOAI — 48-Hour Autonomy Charter (2026-06-17 → 2026-06-19)

Nick is in meetings; runs unsupervised on GCP VM `meok-backend` (Ollama, no PC dependency)
+ scheduled cloud routines (Claude). This file is the charter every autonomous run reads first.

## GUARDRAILS (non-negotiable — autonomy ≠ recklessness)
1. **Self-verify before any push**: `npx tsc --noEmit` must add 0 new errors in touched files AND `npx vite build` must succeed. If either fails, DO NOT push — log and move on.
2. **Secret-scan before every push** (sk_live_/rk_live_/ghp_/github_pat_). Never commit secrets. clawd monorepo push stays blocked by 648f095 — don't fight it.
3. **NEVER touch**: server/stripe/*, .env*, drizzle/*, live DB, live Stripe, DNS, Vercel domain moves, or anything requiring Nick's credentials. No live-money or destructive ops.
4. **One deploy per run, conservative scope.** Prefer additive frontend/content. If uncertain, skip + log for Nick.
5. **Each run logs** to ~/clawd/_autonomy/RUN_<timestamp>.md (what it did, build status, commit, what it skipped) so Nick has a clean trail.
6. **Keep it all alive**: if a core service (SOV3 :3101, Ollama :11434, hive :3210-3212) is down, restart it (keepalives exist) before other work.

## BACKLOG (prioritised — each run picks the top unblocked item, ships it, logs it)
### A. Product depth (frontend, buildable, high impact)
1. Tier-2 **AI Governance Copilot UI** ("Ask the Council") — frontend chat page wired to existing council/SOV3 endpoint; if no endpoint, build the UI + a "coming soon" graceful state. Extends AgentCouncil.tsx.
2. **Continuous-monitoring dashboard** polish — surface ComplianceMonitoring + AlertManagement with real/empty states + the deadline countdown.
3. **Public scorecard route** — add a public read-only `/s/:id` view so the Scorecard Share link is truly public (follow-up the review flagged).
4. **Onboarding wizard** — first AI system → first score in <5 min (extends EnterpriseOnboarding.tsx).
5. **Policy-pack UI** — turn the 22 crosswalk PDFs into per-control interactive checklists (frontend; data from frameworks.ts).

### B. AEO/SEO/content (compounding discovery)
6. Write 2-3 genuine blog posts/guides (EU AI Act Aug-2026 deadline, "is my AI high-risk", framework crosswalks) with Article/HowTo JSON-LD.
7. Extend the hive conversion-page generator content + re-verify Layer-0 on the live hive sites.
8. Internal-link-graph deepening (hub ⇄ verticals ⇄ classifier/map).

### C. Hygiene / verification (every cycle)
9. Daily E2E health audit: all live surfaces 200, JSON valid, billing path intact, 271 count consistent. Log results.
10. Competitor monitoring: weekly-cadence check on Credo/Holistic/IBM for new features; append to a watchlist.

## VM (Ollama, local) lane — runs continuously, no PC, no API key
- olm_autonomous_brain (5-min cron) keeps thinking/sigil/memory — leave running.
- hive_king + queens available for content/research generation via Ollama.
- Health: keepalives guard gateway/meok-one/mcp; guardian restarts SOV3.

## REPORTING
- Per-run log → ~/clawd/_autonomy/RUN_*.md
- End-of-48h summary → memory + ~/clawd/_autonomy/SUMMARY_48H.md
- Anything needing Nick (creds/decisions/domain) → ~/clawd/_autonomy/FOR_NICK.md (he reads this first when back)

## KEYSTONES STILL ON NICK (do NOT attempt autonomously)
csoai.org domain re-point · Stripe secret key + webhook · DB MySQL migration · OAuth creds · the 15 cross-scope hive apex re-points · clawd 648f095 unblock.
