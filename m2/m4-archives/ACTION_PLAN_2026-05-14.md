# ACTION PLAN — 2026-05-14
## From £0 to Revenue in 80 Days (EU AI Act Deadline: August 2)

---

## ✅ DONE TODAY (Automated)

### 1. Fixed 8 Broken Cron Jobs
- Changed delivery mode from invalid `"memory"` to `"none"` in `~/.openclaw/cron/jobs.json`
- Reset all error counters
- Jobs will resume on next schedule:
  - `daily-ai-governance-monitor` — 8am daily
  - `market-portfolio-analysis` — 9am/3pm weekdays
  - `morning-productivity-briefing` — 7am Mon-Sat
  - `weekly-security-audit` — 10am Mondays
  - `consciousness-care-development` — 9am daily
  - `sovereign-temple-deployment` — 10am daily
  - `multimodal-rag-development` — 11am daily
  - `world-changing-deployment-tracking` — 12pm daily

### 2. Published 19 MCP Servers to Smithery
All submitted under namespace `nicholastempleman`:
1. eu-ai-act-compliance-mcp
2. care-membrane-mcp
3. gdpr-compliance-ai-mcp
4. iso-27001-ai-mcp
5. proofof-ai-mcp
6. iso-42001-ai-mcp
7. consciousness-engine-mcp
8. planthire-ai-mcp
9. muckaway-ai-mcp
10. nis2-compliance-mcp
11. dora-compliance-mcp
12. hipaa-compliance-mcp
13. soc2-compliance-ai-mcp
14. pci-dss-mcp
15. nist-rmf-ai-mcp
16. csoai-governance-crosswalk-mcp
17. healthcare-ai-governance-mcp
18. owasp-agentic-mcp
19. meok-governance-engine-mcp

**Status:** All PENDING review. Check at https://smithery.ai/servers/nicholastempleman/

### 3. Created AGENTS.md Distribution Snippets
- Written to `/Users/nicholas/clawd/mcp-marketplace/AGENTS.md`
- Includes quick start, server table, installation, usage patterns, pricing

### 4. Strategic Analysis Written
- Full audit: `~/.clawdbot/shared-knowledge/intel/jeeves-strategic-deep-audit-2026-05-14-online-research.md`
- Session log: `~/.clawdbot/shared-knowledge/intel/session-2026-05-14-kilo-deep-learn.md`

---

## 🔴 YOUR MANUAL ACTIONS (4 Hours Total)

### Action 1: Vercel Deployment Protection (5 min)
Toggle OFF on each project:
- https://vercel.com/niks-projects-0a2ef942/safetyofai/settings/deployment-protection
- https://vercel.com/niks-projects-0a2ef942/industrial-hire-ai/settings/deployment-protection
- https://vercel.com/niks-projects-0a2ef942/meok-ai-frontend/settings/deployment-protection
- https://vercel.com/niks-projects-0a2ef942/fishkeeper-ai/settings/deployment-protection
- https://vercel.com/niks-projects-0a2ef942/koikeeper-ai/settings/deployment-protection

### Action 2: Namecheap DNS (30 min)
Login: https://ap.namecheap.com (username: nicholastempleman)

For EACH of these domains, add:
- A Record: Host=`@`, Value=`76.76.21.21`, TTL=Automatic
- CNAME Record: Host=`www`, Value=`cname.vercel-dns.com`, TTL=Automatic

**Priority 1:** safetyof.ai, councilof.ai, agisafe.ai, asisecurity.ai, biasdetectionof.ai, dataprivacyof.ai, ethicalgovernanceof.ai, transparencyof.ai, accountabilityof.ai

**Priority 2:** grabhire.ai, planthire.ai, muckaway.ai, optimobile.ai, commercialvehicle.ai

**Priority 3:** meok.ai, fishkeeper.ai, koikeeper.ai, diyhelp.ai, pokerhud.ai, loopfactory.ai, suicidestop.ai

**Priority 4:** cobolbridge.ai, proofof.ai, csga.ai

### Action 3: Stripe Live Mode (2 hours)
1. Login: https://dashboard.stripe.com/login
2. Identity verification: Settings → Account → Upload ID
3. Get live keys: https://dashboard.stripe.com/apikeys
4. Create 4 products:
   - MEOK Sovereign: £12/mo recurring
   - MEOK Family: £29/mo recurring
   - EU AI Act Compliance Audit: £5,000 one-time
   - Enterprise MCP Subscription: £199/mo recurring
5. Webhooks: https://try.meok.ai/api/webhooks/stripe
   - Events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.*
6. Stripe CLI auth: https://dashboard.stripe.com/stripecli/confirm_auth?t=37EnM8J6XYpjWw52aXE2qIT1v3AWmCll (code: ardent-agile-pretty-joyful)
7. Update Vercel env vars with live keys

### Action 4: LinkedIn (30 min)
1. Create new LinkedIn profile
2. First post (copy from LINKEDIN_POST_READY.txt)
3. Connect with 5 fintech CTOs using DM script

---

## 📋 THIS WEEK'S PRIORITIES

| Day | Action | Time |
|-----|--------|------|
| Today | Vercel + DNS + Stripe CLI auth | 1 hr |
| Today | LinkedIn profile + first post | 30 min |
| Tomorrow | Stripe products + webhooks | 1 hr |
| Tomorrow | First 5 LinkedIn DMs | 15 min |
| Day 3 | NLnet grant application | 4 hrs |
| Day 4 | Refactor top 5 MCPs to workflow-based | 4 hrs |
| Day 5 | Submit to Glama + first sales calls | 2 hrs |

---

## 📊 METRICS TO TRACK

| Metric | Current | Week 1 Target | Week 4 Target |
|--------|---------|---------------|---------------|
| MRR | £0 | £0 | £5,000 |
| Smithery uses | 0 | 50 | 500 |
| LinkedIn connections | 0 | 25 | 100 |
| DMs sent | 0 | 25 | 100 |
| Sales calls | 0 | 3 | 10 |
| Deals closed | 0 | 0 | 1 |
| MCP downloads | 0 | 100 | 1,000 |
