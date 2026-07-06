# 🚀 7-DAY SPRINT PLAN — Day 18-24 (T-31 to T-25 to Article 50)
**Date:** 2026-06-17
**Author:** JEEVES (this session)
**Status:** 🚀 EXECUTING

---

## 🎯 Mission
Take the CSOAI empire from 211 pages / 24 API endpoints / 69-queue / 59-59 E2E to a state where **one env-key press fires first £199/mo charge in <24h**.

## 📊 Current state (Day 17 close)
- csoai.org: 211 pages (BUT 6 untracked: /glossary, /regulators, /onboarding, /status, /security, /trust)
- csoai-mcp-monetization: 25 endpoints (24 + /openapi.json from FastAPI)
- E2E: 59/59 A+ (100%)
- Queue: 69 prospects (11 verticals, 55+ organisations)
- Sigils: 607 in chain (Day 17 was actually sigil #53 in JEEVES session, more from parallel agents)
- Keystones: 16 (hourly cron = 24/day)
- Mailer: stuck at 9/9 strikes (waiting on Resend domain verification)

## 📋 The 7-day plan

### Day 18 (T-31) — DEPLOY + MAILER RESET
- Deploy the 6 untracked csoai.org pages
- Reset mailer strike counter to 0
- Add /revenue endpoint to csoai-mcp-monetization
- Add /case-studies page to csoai.org
- Add 5 prospect emails (consulting firms: Big 4)
- E2E + sigil #54

### Day 19 (T-30) — VERTICAL PUSH
- 5 more prospect emails (hyperscalers: AWS, Azure, GCP)
- Add /api/discover endpoint to csoai-mcp-monetization (MCP server discovery for AI agents)
- Add /auditor page to csoai.org
- Add /tools page (a page showing CSOAI's verification tools)
- E2E + sigil #55

### Day 20 (T-29) — CUSTOMER EVIDENCE
- 5 more prospect emails (telecom providers: BT, Vodafone, Orange, Deutsche Telekom, NTT)
- Add /customer/{email}/certificates endpoint (list of all keystone certs by email)
- Add /customer/{email}/events endpoint (full event log per customer)
- Add /evidence/{cert_id} page to csoai.org (per-cert detail page)
- E2E + sigil #56

### Day 21 (T-28) — SALES AUTOMATION
- 5 more prospect emails (Big Tech: Google, Microsoft, Apple, Meta, Amazon)
- Add /quote endpoint to csoai-mcp-monetization (generates a price quote for an organisation)
- Add /api/quote/{org_name} endpoint (auto-lookup known orgs)
- Add /sales/cta.html to csoai.org (a sales landing page)
- E2E + sigil #57

### Day 22 (T-27) — DEVELOPER EXPERIENCE
- 5 more prospect emails (national cyber agencies: NCSC, BSI, ANSSI, BSI, ENISA)
- Add /api/docs.html (developer documentation)
- Add /api/playground.html (try the API in browser)
- Add /sandbox/ page (live demo)
- E2E + sigil #58

### Day 23 (T-26) — SECTOR SPECIFIC
- 5 more prospect emails (Big Pharma: Pfizer, Roche, Novartis, Merck, GSK)
- Add /sectors/{name}.html static pages for top 12 sectors (heavy SEO push)
- Add /industries/{name}.html enhanced for top 6
- Add /pricing.html with comparison matrix
- E2E + sigil #59

### Day 24 (T-25) — SOV3 ALIGNMENT + WEEK SEAL
- 5 more prospect emails (insurance Big-4 + re-insurance brokers)
- Wire SOV3 sigil_emit into csoai-mcp-monetization /admin (full audit trail)
- Add /sigil/{digest} endpoint to csoai-mcp-monetization (verify any sigil)
- Final seal + sigil #60
- Weekly retrospective + next 7-day plan

## 📊 Success criteria
By end of Day 24:
- csoai.org: 250+ pages
- csoai-mcp-monetization: 30+ endpoints
- E2E: 70+ tests
- Queue: 100+ prospects
- Sigils: 660+
- Keystones: 200+ (24/day × 7 days)
- **THE ONE THING:** One keystroke from £199/mo charge (mailer fires within 30 min of Resend verification)

## 🎯 The single unblock
The ONLY human keystroke needed:
1. Open https://resend.com/domains → Add `mail.meok.ai` → Copy 3 DNS records (SPF, DKIM, MX) → Add to your registrar → Wait 5-60 min → Click Verify
2. Add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` to `~/clawd/csoai-mcp-monetization/.env`

That's it. The 7-day plan delivers everything else.

## ⚡ Force multipliers
- **EAT mode:** Full block work, 8 blocks per day
- **Daily E2E:** cron fires at 08:00 (Day 4 install)
- **Hourly keystone:** cron fires every hour (Day 13 install)
- **3 Kimi TUIs + Claude:** aligned on the 3-leg architecture
- **Empire alignment:** csoai.org (marketing) + csoai-mcp-monetization (revenue) + SOV3 (substrate)

## 🐉 The dragon's promise
By Day 24 (T-25 to Article 50), the CSOAI hive will be:
- **Production-ready**
- **Fully documented** (250+ pages, 30+ API endpoints, 70+ E2E tests)
- **100-prospect queue** spanning 15+ verticals
- **660+ sigils** in chain (Ed25519, public verify)
- **200+ keystone certs** (1 free per prospect)

**The one unblock: 5-10 min of human keystrokes. That's the only thing between the empire and first £199/mo charge.**

---

📅 Starts: Day 18, 2026-06-17
🎯 Ends: Day 24, 2026-06-23
⏱️ Daily ritual: 8 blocks (deploy + prospects + endpoints + pages + E2E + sigil + keystone + seal)
🚨 Red lines: 2 keystrokes (mailer + Stripe webhook)
