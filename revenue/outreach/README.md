# SMTP SETUP + MASS OUTREACH — ACTION PLAN
## Goal: £3,333/day = £1.2M/year

---

## CURRENT STATUS

| Domain | MX Records | SMTP Ready? | Action Needed |
|--------|-----------|-------------|---------------|
| meok.ai | Namecheap forwarding | ❌ NO | Buy PrivateEmail OR use SendGrid |
| councilof.ai | Namecheap forwarding | ❌ NO | Buy PrivateEmail OR use SendGrid |
| iokfarm.co.uk | mx1.cloudhosting.uk | ⚠️ MAYBE | Check if this has SMTP |
| optomobile.ai | Namecheap forwarding | ❌ NO | Buy PrivateEmail OR use SendGrid |
| cobolbridge.ai | Namecheap forwarding | ❌ NO | Buy PrivateEmail OR use SendGrid |
| treetingessex@gmail.com | Gmail | ✅ YES | Use Gmail SMTP (App Password) |

**You have ZERO real SMTP on any .ai domain.**

---

## FASTEST PATH TO SENDING EMAILS

### STEP 1: SendGrid (5 Minutes, $0 to Start)

**Why SendGrid:**
- Free tier: 100 emails/day
- Paid: $15/mo = 50,000 emails/day
- Best deliverability for mass outreach
- One API key, verify all domains once
- Can send FROM any verified domain

**How:**
1. Go to https://sendgrid.com
2. Sign up (free)
3. Verify sender identity (nicholas@meok.ai)
4. Create API key
5. Paste API key into `smtp_config.yaml`
6. Run: `python3 mass_sender.py --vertical aquaculture --dry-run`

### STEP 2: Namecheap PrivateEmail (Optional, $15/year per domain)

**Why PrivateEmail:**
- Professional replies from your own domain
- Good for low-volume, high-value conversations
- NOT good for mass outreach (500/day limit)

**How:**
1. Log into Namecheap → go to Domain List
2. For each domain: click Manage → PrivateEmail → Buy ($15/year)
3. Create mailbox: nicholas@meok.ai
4. Set password
5. Update MX records (Namecheap does this automatically)
6. Add credentials to `smtp_config.yaml`

### STEP 3: Gmail App Password (For Tree King)

**Why:**
- treetingessex@gmail.com already exists
- Free
- Good for 100-200/day

**How:**
1. Go to https://myaccount.google.com/apppasswords
2. Generate App Password for "Mail"
3. Add to `smtp_config.yaml` under gmail section

---

## EMAIL VOLUME MATH

### Target: £3,333/day = £1.2M/year

**Current products:**
- Aquaculture MCPs: £29-£999/mo (avg £200/mo)
- MEOK subscriptions: £29-£499/mo (avg £150/mo)
- Optomobile: £29/mo
- COBOL Bridge: £299-£999/mo (avg £500/mo)
- CSO AI: £999-£4,990/mo (avg £2,000/mo)
- Tree King: £150-£2,000/job (avg £400)

**To hit £3,333/day in MRR:**
- Need ~1,000 customers at £100/mo average
- OR ~200 customers at £500/mo average
- OR ~67 customers at £1,500/mo average

**Email volume needed:**
- At 1% conversion: 100,000 emails → 1,000 customers
- At 2% conversion: 50,000 emails → 1,000 customers
- At 3% conversion: 33,000 emails → 1,000 customers

**With SendGrid $15/mo plan (50k/day):**
- 1,500,000 emails/month capacity
- At 1% conversion: 15,000 customers/month
- At 0.1% conversion: 1,500 customers/month

**Email is NOT the bottleneck. Product-market fit + landing pages + trust is.**

---

## PRIORITY ORDER

### THIS WEEK (Revenue Now)

1. **SendGrid setup** (5 min) → Start sending aquaculture emails
2. **Tree King replies** (30 min) → £1,150-£3,700 immediate
3. **Vercel deploy** (10 min) → meok.ai landing pages live
4. **Grant applications** (2 hours) → £775k potential

### NEXT WEEK (Pipeline)

5. **Target list building** → Scrape UK trout farms, opticians, etc.
6. **Cold email sequences** → 5-touch sequences per vertical
7. **Landing page optimization** → Conversion rate testing
8. **Stripe analytics** → Track actual MRR, churn, LTV

### THIS MONTH (Scale)

9. **Hire VA/freelancer** → For target list building, email sending
10. **Paid ads** → Google Ads for "tree surgeon essex", "aquaculture monitoring"
11. **Partnership outreach** → Stirling, OATA, CEFAS, BTA
12. **Content marketing** → Blog posts, case studies, farm videos

---

## TARGET LISTS TO BUILD

### Aquaculture (290 UK Trout Farms)
- Source: ASC certified farms list, British Trout Association
- Method: Scrape websites, LinkedIn, industry directories
- Volume: 20 emails/day → 400/month → 12 conversions/month at 3%

### Optometry (2,000 UK Independent Opticians)
- Source: GOC register, Optical Confederation, local business directories
- Method: Scrape practice websites, email info@ addresses
- Volume: 50 emails/day → 1,000/month → 20 conversions/month at 2%

### COBOL Bridge (500 UK Banks/Insurers/Gov)
- Source: FCA register, public sector IT contacts, LinkedIn
- Method: LinkedIn outreach + email follow-up
- Volume: 15 emails/day → 300/month → 3 conversions/month at 1%

### CSO AI (100 Gov/NHS/Research)
- Source: UKRI contacts, NHS Digital, Cabinet Office AI team
- Method: LinkedIn + direct email to published contacts
- Volume: 10 emails/day → 200/month → 4 conversions/month at 2%

---

## HOW TO USE MASS_SENDER.PY

```bash
# Dry run (test everything, don't send)
cd ~/clawd/revenue/outreach
python3 mass_sender.py --vertical aquaculture --dry-run --targets aquaculture_targets.csv

# Real send (after filling in smtp_config.yaml)
python3 mass_sender.py --vertical aquaculture --targets aquaculture_targets.csv

# With specific provider
python3 mass_sender.py --vertical aquaculture --provider gmail --targets targets.csv

# Limit to 10 emails (for testing)
python3 mass_sender.py --vertical aquaculture --limit 10 --targets targets.csv
```

---

## FILES IN THIS DIRECTORY

| File | Purpose |
|------|---------|
| `smtp_config.yaml` | Your SMTP credentials (KEEP PRIVATE) |
| `mass_sender.py` | Email sending engine |
| `EMAIL_TEMPLATES.md` | All outreach templates |
| `sent_log.csv` | Tracking log (auto-generated) |

---

## SECURITY WARNING

- `chmod 600 smtp_config.yaml` — keep credentials private
- Never commit SMTP credentials to GitHub
- Use App Passwords, not main passwords
- Rotate API keys every 90 days
- Monitor SendGrid reputation score

---

## NEXT IMMEDIATE ACTION

**You need to do ONE thing right now:**

Go to https://sendgrid.com → Sign up → Verify nicholas@meok.ai → Create API key → Paste it into `smtp_config.yaml`

Then tell me "SendGrid ready" and I'll start sending.

---

*Generated: 2026-05-24*
*MEOK AI Labs*
