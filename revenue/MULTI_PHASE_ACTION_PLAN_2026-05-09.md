# Multi-Phase Business Action Plan
**Created:** 2026-05-09
**Scope:** Infrastructure (Phase 2) → Templeman Opticians (Phase 3) → Network Nick (Phase 4)

---

## PHASE 2: Infrastructure Fixes

### 2.1 DNS Fixes (Requires Namecheap login)

| Domain | Current State | Fix Required |
|--------|--------------|--------------|
| **safetyof.ai** | A: 185.199.220.59 (GitHub Pages) → 404 | Change A record to `76.76.21.21` (Vercel) |
| **compliance.meok.ai** | No DNS records | Add CNAME: `compliance` → `cname.vercel-dns.com` |
| **agriculture-robotics.ai** | No DNS records, unreachable | Check Namecheap — may have expired. Renew if still owned. |

**Action:** Log into Namecheap → Advanced DNS for each domain → update records.

### 2.2 Cloudflare Tunnel (Network-level issue)

**Problem:** Port 7844 to Cloudflare edge IPs is unreachable from this network. General internet works (Google reachable). This is likely an ISP/firewall block.

**Attempted fixes:**
- Restarted cloudflared with `protocol: http2` (was defaulting to QUIC)
- Still failing — all connection attempts timeout on port 7844

**Options:**
1. **Run tunnel from different network** — iokfarm server, VPS, or Vercel cron
2. **Contact ISP** — ask if port 7844 (UDP) is blocked
3. **Use Vercel directly** — all domains are already on Vercel; tunnel may be unnecessary if DNS points correctly

**Recommendation:** Since all services (api.meok.ai, sov3.meok.ai, sovereign.templeman-opticians.com) are localhost services, consider deploying them to Vercel/Render instead of tunneling.

### 2.3 n8n Workflows (6 ready, 0 running)

**Status:** 6 workflow JSONs exist in `~/clawd/revenue/n8n-workflows/` and `n8n-workflows-fixed/`. All are import-ready.

**Credential gaps (9 required):**
| Credential | Status | Provider |
|-----------|--------|----------|
| Anthropic API key | ✅ Available in `~/.hermes/.env` | Anthropic |
| Twilio (SMS) | ❌ Not configured | Twilio |
| SMTP (email) | ❌ Not configured | Gmail/SendGrid/Mailgun |
| Stripe Live key | ❌ TEST mode only | Stripe |
| Slack webhook | ❌ Not configured | Slack |
| Apollo.io key | ❌ Not configured | Apollo |
| Smartlead.ai key | ❌ Not configured | Smartlead |
| Postgres (CRM) | ❌ Not set up | Self-hosted |
| Google OAuth (GBP) | ❌ Not configured | Google Cloud |

**Setup steps:**
1. Stand up n8n Docker container (Docker Compose file needed)
2. Add all 9 credentials in n8n UI
3. Import 6 workflow JSONs
4. Replace `REPLACE_WITH_*_CRED_ID` placeholders
5. Activate workflows

### 2.4 Vertical SaaS Domains (8 live, no Stripe)

| Domain | Status | Has Stripe? | Action Needed |
|--------|--------|-------------|---------------|
| landlaw.ai | HTTP 200, static HTML | ❌ No | Add Stripe payment link |
| fishkeeper.ai | HTTP 200, static HTML | ❌ No | Add Stripe payment link |
| koikeeper.ai | HTTP 200, static HTML | ❌ No (mentions £7.99/mo) | Add Stripe payment link |
| grabhire.ai | HTTP 200, static HTML | ❌ No | Add Stripe payment link |
| muckaway.ai | HTTP 200, has Stripe JS | ⚠️ Partial | Complete Stripe integration |
| planthire.ai | HTTP 200, static HTML | ❌ No | Add Stripe payment link |
| commercialvehicle.ai | HTTP 200, static HTML | ❌ No (mentions pricing) | Add Stripe payment link |
| optimobile.ai | HTTP 200, static HTML | ❌ No | Add Stripe payment link |

**Action:** Create Stripe payment links for each vertical, embed in HTML.

---

## PHASE 3: Templeman Opticians

### 3.1 GBP Optimization (Highest ROI, ~2h setup)

**Current:** GBP exists but not optimized. Biggest local-SEO lever untouched.

**Action items:**
1. **Verify ownership** of Google Business Profile
2. **Complete every field:** hours, services, attributes, description with keywords
3. **Add 50+ photos:** storefront, team, equipment, before/after
4. **Reply to every existing review** (use Claude to draft)
5. **Set up weekly posts:** offers, hours updates, service highlights
6. **Add Q&A section** with common questions pre-answered

**Expected result:** 30-60% increase in "near me" search visibility within 90 days.

### 3.2 Recall Automation (n8n workflow #1 ready)

**Current:** Manual recall process (if any). n8n workflow JSON exists but needs:
- Templeman PMS database connection (Optix, Acuity, BCMS, or custom?)
- Twilio UK SMS sender
- SMTP configured

**Action items:**
1. Identify which PMS Templeman uses
2. Export patient database or set up direct DB connection
3. Configure Twilio for UK SMS (£15/mo)
4. Import n8n workflow #1
5. Test with single patient row

**Expected result:** 15-30% recall rate uplift = £8-20K/yr extra revenue.

### 3.3 Review Automation (n8n workflow #3 ready)

**Current:** No automated review collection.

**Action items:**
1. Set up Google My Business API access (free)
2. Configure OAuth for Templeman GBP location
3. Import n8n workflow #3 (GBP review → Claude draft reply)
4. Create post-appointment SMS workflow for review requests

**Expected result:** More reviews → higher GBP rank → more local clicks.

### 3.4 NHS Home Visit Lead Capture

**Current:** templeman-opticians.com exists but no dedicated home visit form.

**Action items:**
1. Add hero section: "Are you eligible for a home eye test?"
2. Create 3-question form (age, mobility, postcode)
3. Wire to n8n workflow #2 (universal form → Claude reply)
4. Auto-eligibility check + instant booking link

---

## PHASE 4: Network Nick → MEOK Distribution

### 4.1 Client Audit

**Known clients:**
| Client | Domain | Status | Monthly Retainer |
|--------|--------|--------|-----------------|
| Tree King | tree-king.co.uk | Live | £200-800/mo |
| Randalls Crane Hire | randalls-crane-hire.co.uk | Vercel queued | £200-500/mo |
| WCR Grab Hire | wcr-grab-hire.co.uk | Vercel queued | £200-500/mo |

**Action:** Full client list needed. How many total Network Nick clients? What are their industries?

### 4.2 "AI Compliance Lite" Product (£150/mo per client)

**What it includes:**
- Pre-built templates: AI Use Policy, Data Processing Record, Privacy Notice update for AI
- Quarterly self-attestation (signed cert from MEOK attestation API)
- 30 min/quarter live consult

**Unit economics:**
- Cost to deliver: £30/mo MEOK API + £30 Nick's time = £60
- Margin: £90/mo per client
- At 30 clients: £2,700/mo MRR

### 4.3 Outreach Strategy

**Option A: Email blast to existing clients**
```
Hi {name}, quick heads-up — UK GDPR + AI Bill changes mean you need updated documentation.
We've productised it: £150/mo, includes signed attestation, quarterly review, all template updates.
First month free if you sign by {date}. Reply YES or book at cal.com/networknick-ai-lite
```

**Option B: Discovery call during next regular check-in**
- Add AI compliance to regular client review agenda
- Show them what their AI/data exposure looks like
- Close on the spot with first-month-free offer

### 4.4 Stripe Connect Rev-Share

**Setup:**
1. Create Stripe Connect account for Network Nick
2. Wire 30% commission from MEOK → Network Nick automatically
3. Dashboard showing NN revenue from MEOK referrals

---

## Quick Wins (Can Execute Today)

1. ✅ **DNS fix instructions** — documented below
2. ✅ **n8n Docker Compose** — generate deployment file
3. ✅ **Postgres CRM schema** — generate shared database schema
4. ✅ **Form JS snippets** — generate webhook code for each brand site
5. ✅ **GBP optimization checklist** — step-by-step guide
6. ✅ **AI Compliance Lite landing page** — create for Network Nick
7. ✅ **Client outreach email templates** — ready to send

---

## What Requires Your Action

| Task | Time | Why You |
|------|------|---------|
| Namecheap DNS changes | 10 min | Account access |
| Stripe → LIVE mode | 5 min | Account access |
| Twilio account setup | 15 min | Card + phone verification |
| Smartlead account | 15 min | Card + domain verification |
| Templeman PMS details | 5 min | You know which system they use |
| Network Nick client list | 10 min | You have the client records |
| Google Cloud OAuth setup | 20 min | Account access |
| NLnet grant submission | 30 min | Identity + signature |
| BSI grant submission | 1h | Companies House docs needed |
