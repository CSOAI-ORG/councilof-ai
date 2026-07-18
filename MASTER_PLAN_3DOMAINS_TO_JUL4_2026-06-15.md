# MASTER PLAN — csoai.org · meok.ai · openmoe.ai → 100/100 by 4 July 2026
**Created 2026-06-15. Supersedes the scattered DAY*_PLAN docs for these 3 domains.**
**Execution model: hive on GCP VM `meok-backend` (35.242.143.249, RUNNING) does inference/councils/tournament; SOV3 King (Mac :3101) orchestrates; Claude (builder) ships code; Hermes (once brain fixed) drives research/ops. Nick = sovereign gates.**

---

## VERIFIED STATE (2026-06-15)
| Domain | Live? | Gap to 100/100 |
|---|---|---|
| **meok.ai** | green pages, 8 Stripe links 200 | **P0: lead capture `POST /api/waitlist` → 403** (regressed to offline M2 backend); Pro-tier activation needs `MEOK_MASTER_API_KEY` + real Stripe product/price wiring |
| **csoai.org** | green, GEO live (llms/agent/sitemap 200) | `/signup` → 404; conversion + council content depth |
| **openmoe.ai** | **DOWN — 404 DEPLOYMENT_NOT_FOUND** | domain in account but not aliased to its ready `openmoe-deploy` deployment; dev-funnel mirror; openmoe-bft publish + tournament wired to VM hive; openscore.ai down (000) |

## ENABLERS DOWN (must fix first — they block the hive doing the work)
1. **Hermes brain** — `hermes_ask` → OpenAI 401. Route to Ollama (:11434) or VM, or paste a valid key. Until fixed, Hermes can't drive ops.
2. **M2 backend** (198.53.64.194:40646) offline → meok `/api/*` fallthrough 403s. Either pin local routes in `beforeFiles` (preferred) or bring M2 up.
3. **GCP VM hive** — VM is RUNNING; confirm Queens/councils + Ollama are serving on it (needs authorized `gcloud compute ssh meok-backend`).

---

## DAY 0 — TODAY (quick unblocks, mostly already doable)
- [ ] **openmoe.ai LIVE**: BLOCKED on Vercel domain-access (CLI `alias set` → "no access", same wall as councilof.ai). Fix = reassign domain `openmoe.ai` to project `openmoe-deploy` in the Vercel **dashboard** (via Kimi bridge on Nick's session, or Nick). Deployment is ready; only the domain→project pin is wrong (points at a deleted deployment → DEPLOYMENT_NOT_FOUND).
- [ ] **meok capture fix**: add `{ source:"/api/waitlist", destination:"/api/waitlist" }` to `beforeFiles` in `meok/ui/next.config.ts`; PR→main→deploy. Restores lead capture independent of M2.
- [ ] **csoai.org `/signup`**: add redirect or page (mirror meok's `/signup → /waitlist`).
- [ ] **Hermes brain**: point Hermes at Ollama (:11434) so it can participate; verify `hermes_ask` returns.
- [ ] **[Nick gate]** add Bash permission rule for `git push origin :main` + authorize `gcloud compute ssh meok-backend`.

## PHASE 1 — FOUNDATION 100/100 (Jun 16–22)
**meok.ai**: Pro-tier activation E2E (needs `MEOK_MASTER_API_KEY` + Stripe product/price IDs from Nick); webhook→fulfilment loop; every public page Lighthouse ≥95 + JSON-LD; capture→Loops/Resend confirmed.
**csoai.org**: full conversion funnel (signup→pricing→checkout→verify); council/standards content depth; trust center; GEO parity with meok.
**openmoe.ai**: dev-funnel mirror of meok (two funnels/one engine per MASTER_PLAN_MIRROR_TOURNAMENT); GEO files; openscore.ai restored; openmoe-bft → PyPI.
**Hive/VM**: stand up the tournament (ShadowArena in openmoe_bft/harmony.py) on the VM Queens; SOV3 King schedules nightly self-improvement runs.

## PHASE 2 — CONVERSION + AUTOMATION (Jun 23–29)
- Content engine on the VM hive (Queens draft, council/BFT vote, King seals) feeding all 3 domains' blogs/landers.
- A/B: meok (consumer) vs openmoe (developer) funnels sharing the ShadowArena scoring spine; analytics on all three.
- Outbound revenue loop (branded email, 25/day) driving to scorecard/signup.
- Smithery/marketplace presence verified (the ~200 published servers building live).

## PHASE 3 — POLISH TO AAA+++ (Jun 30 – Jul 4)
- Full QA sweep: every route 200, every schema valid, every CTA→live Stripe, every GEO file present, 0 console errors, Lighthouse 100s.
- Security pass (headers, CSP, rate-limit, attestation chain).
- Launch checklist + go-live; nightly hive QA cron keeps it 100/100.

## DEFINITION OF 100/100 (per domain)
Routes all 200 · JSON-LD on every page · AEO/GEO files present · CTA→live checkout · lead capture verified · Lighthouse ≥95 (target 100) · security headers · attestation/verify live · no orphan/404.

## OWNERSHIP SPLIT
- **GCP VM Queens**: inference, council votes, tournament, content drafting, research.
- **SOV3 King (Mac)**: orchestration, scheduling, memory/Honeycomb, sealing verdicts.
- **Claude (builder)**: code, deploys, QA, this plan's checkboxes.
- **Hermes**: ops/research once brain restored.
- **Nick (gates)**: `MEOK_MASTER_API_KEY`, Stripe keys, `git push`/ssh permission rules, councilof/2nd-Vercel-account, `gh auth refresh -s workflow`.
