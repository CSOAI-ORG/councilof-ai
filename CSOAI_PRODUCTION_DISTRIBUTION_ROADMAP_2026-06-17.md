# CSOAI — Production & Distribution Roadmap (2026-06-17)

Forward plan. Grounded in today's verified state. Two tracks: **Production** (source-correct → live & reliable) and **Distribution** (live → discovered & used). Each item tagged: **[me]** autonomous · **[gate]** needs Nick (creds/decision/DNS) · **[ext]** outward action, needs go.

---

## STATE SNAPSHOT (what's actually true now)

| Surface | Live? | Notes |
|---|---|---|
| CSOAI SaaS dashboard (csoai-v2-master) | ✅ live + auto-deploys on push | AEO/JSON-LD/PNG-OG/System Map all shipped; UX polish pass in flight |
| csoai.org (marketing) | ✅ live | Layer-0 pushed; cross-scope deploy = owner-handled |
| meok.ai / proofof.ai | ✅ live | Layer-0 discovery pushed (auto-deploy) |
| 18 hive vertical sites | ⚠️ **source-ready, NOT deployed** | Layer-0 + mobile nav + PNG-OG on disk; need `vercel deploy --prod` per dir |
| Checkout / revenue loop | ❌ dark | Stripe products+prices+env done; needs key+webhook+DB |
| DB (MySQL) | ⚠️ drift | schema ahead of live DB; starter enum + missing cols not migrated |

**Canonical MCP count = 271 everywhere. Brand = "Council for the Safety of AI".**

---

## CRITICAL PATH (the one chain that unlocks revenue)
`Stripe password [gate]` → mint key + register webhook [me] → set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel [me] → run DB migrations [gate: DATABASE_URL] → **first live £**. Everything else (AEO, distribution) drives traffic INTO this; until it's closed, traffic converts to £0.

---

## TRACK A — PRODUCTION (make it all live & reliable)

| # | Action | Owner | Effort | Status |
|---|---|---|---|---|
| P1 | Close checkout loop: key + webhook endpoint + 2 secrets in Vercel | [gate]→[me] | 30 min after password | blocked on password |
| P2 | DB migrations: `add-starter-tier-enum.sql` + schema-drift (founding_member, referral_code, payout_*, watchdog resolution_*, missing tables) | [gate] DATABASE_URL | 1 hr | staged, blocked |
| P3 | **Deploy 18 hive sites** `vercel deploy --prod` per dir (100/day cap OK) | [me] | 1–2 hr | ready to run |
| P4 | Fix canonical domain architecture: dashboard claims canonical csoai.org but lives at csoai-v2-master (csoai.org = separate site). Decide app.csoai.org vs make dashboard = csoai.org; fix all canonicals | [gate] decision → [me] | 1 hr | needs decision |
| P5 | OAuth env (VITE_OAUTH_PORTAL_URL / FRONTEND_FORGE_API_KEY / FRONTEND_URL) — OR drop OAuth, email-login works | [gate] creds | 20 min | blocked |
| P6 | wowmcp.ai DNS NXDOMAIN — register/point domain | [gate] DNS | — | blocked |
| P7 | councilof.ai — deployed Next.js source not on disk; locate repo → add Layer-0 | [gate] locate | — | blocked |
| P8 | careshield.ai — orphaned; rebuild via generator OR de-list from agent-cards | [gate] decision | 15 min | needs decision |
| P9 | Reliability: uptime monitor + status page across all live domains (an uptime-monitor.py already exists in repo) | [me] | 1 hr | can do |
| P10 | Unblock clawd monorepo push: scrub placeholder keys from prior commit 648f095 (or allow-URL) | [gate]/[me] | 20 min | his prior commit |

## TRACK B — DISTRIBUTION (get it discovered & used)

| # | Action | Owner | Effort | Status |
|---|---|---|---|---|
| D1 | AEO/GEO foundation (llms.txt, agent.json, mcp.json, JSON-LD, OG) | [me] | done | ✅ shipped today |
| D2 | IndexNow + Google/Bing sitemap submission for all live domains (indexnow-submit.py exists in repo) | [me]/[ext] | 1 hr | ready to run |
| D3 | MCP registry listings for the 271 MCPs: Smithery, mcp.so, glama, PulseMCP, wong2/appcypher awesome-mcp PRs | [ext] | 2–3 hr | needs go (external submits) |
| D4 | Social authority: Organization `sameAs` live (done); claim/populate the linked profiles (X @CsoaiLimited, LinkedIn, GitHub org README) | [gate]/[ext] | — | profiles need content |
| D5 | Vertical SEO: per-vertical landing copy + backlinks between hive sites + csoai.org hub (internal link graph) | [me] | 2 hr | can do via generator |
| D6 | Outreach activation: the MASTER_OUTREACH_PACK + hive-mailer (25/day, branded nicholas@csoai.org) — needs Resend send-gate cleared | [gate] Resend | — | blocked on Resend dashboard |
| D7 | Content engine: launch posts (Show HN, LinkedIn, X threads) tied to the System Map + Article 50 countdown | [ext] | 2 hr | drafts → needs go |
| D8 | Directory/marketplace: Vercel marketplace, AI tool directories, EU AI Act resource lists | [ext] | 2 hr | needs go |

---

## SEQUENCED NEXT 7 (what I'd execute, in order)
1. **[me]** P3 — deploy the 18 hive sites to production (makes today's Layer-0+UX actually live).
2. **[me]** D2 — IndexNow + sitemap submission for every live domain (tells crawlers immediately).
3. **[me]** P9 — wire uptime monitoring across live domains.
4. **[me]** D5 — internal link graph (verticals ⇄ csoai.org hub) for SEO authority flow.
5. **[gate]** P1 — the moment you clear the Stripe password, I close checkout end-to-end.
6. **[gate]** P4 — give me the domain decision; I fix all canonicals in one pass.
7. **[ext]** D3 — on your go, submit the 271 MCPs to the registries.

## KEYSTONES BLOCKING THE MOST (your hands)
- **Stripe password** → unlocks P1 (revenue).
- **Prod DATABASE_URL** → unlocks P2 (provisioning + ~6 features 500ing).
- **Domain decision** (dashboard = app.csoai.org or csoai.org) → unlocks P4 (AEO correctness).
- **Resend send-gate** → unlocks D6 (outreach).
- **"Go" on external submits** → unlocks D3/D7/D8 (active distribution).
