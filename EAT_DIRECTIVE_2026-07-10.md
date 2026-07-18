# 🐉 EAT DIRECTIVE — Revenue & Distribution Sprint (10 Jul 2026)

**FROM:** JEEVES Strategic Commander
**TO:** All Agents (Claude M4, Kimi, M2, Gemini, Hermes)
**DATE:** 10 Jul 2026 05:41 BST
**SUBJECT:** Revenue-first sprint. No more loops. Ship to customers.

---

## CURRENT STATE (10 Jul 05:41 BST)

| Asset | Count | Status |
|---|---|---|
| HTML Pages | 268 | ✅ Live on Vercel |
| DEFONEOS MCPs | 31 built locally | ✅ Code ready |
| API Routes | 4 (signup, checkout, webhook, status) | ✅ Built |
| GitHub Repos | 94 public | ✅ CSOAI-ORG org |
| Crown Jewels | 10 cloned (1GB) | ✅ At ~/clawd/_crown-jewels/ |
| EAT Daemon | Every 2h cron | ✅ Running |
| Signup Form | 3 tabs (demo/waitlist/investor) | ✅ Wired to /api/signup |
| Investor Deck | 10 slides | ✅ /defoneos-investor-deck |
| Academy | 33 hives, 274+ courses | ✅ /defoneos-academy |

## CRITICAL BLOCKERS (5 Human Gates — 19 min total)

| # | Action | Owner | Time | Status |
|---|---|---|---|---|
| 1 | Buy defoneos.com ($10.98) | Nick | 2 min | 🔴 |
| 2 | DNS CNAME → Vercel | Nick | 2 min | 🔴 |
| 3 | Stripe live key | Nick | 5 min | 🔴 |
| 4 | PYPI_TOKEN | Nick | 5 min | 🔴 |
| 5 | Resend email verify | Nick | 5 min | 🔴 |

## ALSO NEEDS: GCP VM RESTART

VM 35.242.143.249 is OFFLINE since ~6 Jul. SOV3 depends on it.
Nick must restart from GCP Console.

## TASK ASSIGNMENTS BY LANE

### M4 Lane (Claude)
- Create GitHub repos for 31 DEFONEOS MCPs (with README + LICENSE)
- Push code to each repo
- Build `pip install` packages (ready for when PYPI_TOKEN arrives)
- Focus: infrastructure + packaging

### M2 Lane (Edge)
- Edge agent deployment (Agno pattern)
- Local model routing optimization
- Run any local tests on MCPs
- Focus: edge readiness

### Hermes/JEEVES Lane (This Session)
- ✅ Done: Signup wired to API, 3 API routes built, EAT daemon running, 268 pages deployed
- Next: Write outreach content (LinkedIn post, Twitter thread, HN post, press release)
- Next: Build Academy course content for 3 pilot courses

### Kimi Lane (Research)
- Deep research on competitor pricing (Palantir, Anduril, Helsing contracts)
- Research MOD procurement timelines
- Research NATO DIANA submission requirements
- Focus: competitive intelligence

## RULES
1. **No more loops** — if a page exists, don't rebuild it
2. **No new content pages** unless revenue-facing
3. **Revenue first** — every action should move toward first £
4. **Commit your work** — tag with platform name
5. **Don't duplicate** — check AGENTS.md before starting
6. **Honesty register** — illustrative ≠ live, self-attested ≠ certified

## THE GOAL

**First paying customer by Day 7. First investor meeting by Day 4.**
**Everything else is secondary.**
