# DEL BOY MODE — M2 Revenue Activation Plan
## From £0 to First Revenue | M2 MacBook Domain Controller
**Date:** 2026-05-31 | **Status:** EXECUTE NOW

---

## CURRENT REALITY (Audited)

| Asset | Status | Notes |
|-------|--------|-------|
| **Stripe account** | ✅ LIVE, verified, GB, charges enabled | 20+ products configured, **£0 revenue** |
| **PyPI packages** | ✅ 28 published, 10,330 downloads/mo | Top: watermark-attest (1,157), governance-engine (1,085), patient-safety (962) |
| **Domains** | 11 live, 7 dead | councilof.ai, csoai.org, safetyof.ai — all with **no Stripe checkout** |
| **MCP marketplace** | 345 servers built | ~28 published to PyPI, 0 monetized |
| **Lib2b` @csoai/lib2b`** | ⚠️ NOT PUBLISHED TO NPM | Repo exists but npm package returns 404 |
| **Lovable projects** | 36 projects, Pro plan | No GitHub connection, no revenue flow |
| **Grants** | 5 applications drafted | None submitted |

---

## THE PROBLEM

```
Products:  20+ ✅
Payments:  ✅ Live Stripe
Pipeline:  ❌ NOTHING CONNECTED
Revenue:   £0

20 products exist on Stripe but NO domain has a "Buy Now" button.
This is the entire problem in one sentence.
```

---

## PHASE 1: IMMEDIATE REVENUE (Today) — £0 → £500/mo

### Action 1.1: Wire councilof.ai to Stripe (30 min)
**Why:** councilof.ai is live, has organic traffic, positioned as B2B SaaS. Zero friction to add checkout.
**What:**
- Add pricing page with Stripe checkout link to councilof.ai
- Price: £499/mo (Starter), £1,499/mo (Pro), £4,990/mo (Enterprise)
- Stripe price IDs exist in `prod_UbxMotixQGr9CN` (Enterprise), `prod_Ubx9DdgoXPnzUD` (Pro)
- Link: `https://buy.stripe.com/...` or checkout.session.create
**Revenue target:** £499/mo (1 customer)

### Action 1.2: Wire safetyof.ai Free+Paid Checkout (30 min)
**Why:** safetyof.ai has "Free 5-min AI Safety Posture Score" — add paid full audit at the end.
**What:**
- Free scan → results page → upsell full audit at £299
- Stripe checkout.wp_rIN4Hj2rH99K3vw8k836
**Revenue target:** £299/mo (1 audit/month)

### Action 1.3: Add Stripe Checkout Link to csoai.org (15 min)
**What:** Add "Get Certified" CTA → Stripe checkout for CSOAI certification
**Price:** £1,999/mo (Enterprise certification)
**Revenue target:** £1,999/mo (1 certification)

### Action 1.4: Publish `@csoai/lib2b` to npm (30 min)
**Why:** The protocol layer repo exists but npm package returns 404. This is the SDK that all domains should use.
**What:**
```bash
cd /tmp && git clone https://github.com/CSOAI-ORG/lib2b
npm publish --access public
```
**Revenue target:** Adoption → enterprise sales

---

## PHASE 2: QUICK WINS (Week 1) — £500 → £5,000/mo

### Action 2.1: Deploy 7 Dead Domains
| Domain | Action | Revenue Path |
|--------|--------|--------------|
| diyhelp.ai | Deploy to Vercel/Lovable | Lead gen → Stripe |
| loopfactory.ai | Deploy | Monetize loop marketplace |
| pokerhud.ai | Deploy | Freemium → £9/mo |
| industrial-hire-ai.com | Deploy | Lead gen → £200/mo |
| industrial-domains.com | Deploy | Domain portfolio value |
| asisecurity-portal.com | Deploy | B2B security SaaS |
| optomobile.ai | DNS fix + deploy | £99/mo SaaS |

### Action 2.2: Activate PyPI Conversion Funnel
**Current:** 10,330 downloads/month, £0 revenue
**Fix per package:**
- Add `meok-ai-labs` branding to all responses (already partially done)
- Add "Powered by CSOAI" with link to pricing page
- README must include Pro tier upsell
- Add telemetry header showing free tier vs. paid features

**Quick fix:** Update top 5 packages (watermark-attest, governance-engine, patient-safety, omnibus-tracker, mcp-injection-scan) with:
```python
# In every tool response:
response["_metadata"] = {
    "provider": "MEOK AI Labs",
    "tier": "free",  # or "pro" if api_key validated
    "upgrade": "https://csoai.org/pricing"
}
```

### Action 2.3: Submit Pending Grant Applications
**Grant files ready on M4:**
- adopt-round-7 — EU Adopt AI
- agriscale — Agriculture AI
- dsit-ai-assurance — UK AI assurance
- nlnet-ngi-zero — NLnet €50K

**Action:** SSH to M4, submit all 4 applications. Target €50K from NLnet.

---

## PHASE 3: ACTIVATE THE STACK (Week 2) — £5K → £25K/mo

### Action 3.1: Align All Domains with lib2b/ACP/MCP
| Domain | Integration |
|--------|-------------|
| councilof.ai | Add ACP gateway for agent compliance queries |
| safetyofai | Add MCP server for posture scanning |
| csoai.org | Add lib2b SDK for governance queries |
| proofof.ai | Add ACP for deepfake verification agents |

### Action 3.2: Publish 50 More MCPs to PyPI
**Current:** 28 published, 345 built in marketplace
**Quick publish:** Pick top 50 built but unpublished servers, push to PyPI
**Focus on high-demand categories:**
- EU AI Act compliance (17 servers built, 3 published)
- Security MCPs (injection-scan is top seller)
- Financial compliance (DORA, SOC2, PCI-DSS)

### Action 3.3: Configure Email Outreach
**What:**
- Configure SendGrid or Gmail SMTP
- Load 50 fintech prospect list
- Send councilof.ai intro email
- Target: 3 discovery calls → 1 deal

---

## PHASE 4: SCALE (Month 2-3) — £25K → £100K/mo

### Action 4.1: Social Proof
- Submit all 345 MCPs to Smithery marketplace
- Create `npx meok-setup` installer for Claude Desktop
- Get 100 GitHub stars on awesome-meok
- Blog post: "345 MCP Servers for AI Governance — Complete Collection"

### Action 4.2: Enterprise Sales
- Target: 5 enterprise deals at £5K/mo average
- UK fintech (Monzo, Starling, Revolut)
- EU AI Act compliance consulting
- CSOAI certification program

### Action 4.3: Content Marketing
- 3 blog posts/week on AI governance
- Weekly LinkedIn newsletter
- Reddit (r/MachineLearning, r/artificial)
- Hacker News launch

---

## THE NUMBERS

```
                     NOW    WEEK 1    MONTH 1    MONTH 3
Domains live         11       18         18         18
PyPI published       28       78        150        200
PyPI dl/mo        10,330   20,000     50,000    100,000
Stripe products      20       25         30         40
Customers              0        1          5         20
MRR                  £0     £499     £5,000    £25,000
Grant pipeline       £0    €50K      €50K      €200K
```

---

## THE BOTTLENECK MAP

```
Customer wants compliance tools
  ↓
Searches Google → finds councilof.ai [✅ LIVE]
  ↓
Clicks Pricing → no prices [❌ NO PRICING PAGE]
  ↓
Can't buy → leaves [⟳ NEVER RETURNS]
  ↓
Finds our PyPI package [✅ DOWNLOADED]
  ↓
Uses free tier → needs Pro features [❌ NO UPGRADE PATH]
  ↓
Gives up → lost customer forever [💀 CHURN BEFORE ACQUISITION]

FIX: Wire Stripe checkout + add upgrade paths = 1 customer/week = £499/mo
```

---

## COMMAND CHEAT SHEET

```bash
# Deploy a domain (SSH to M4, Vercel not authed on M2)
ssh nicholas@192.168.50.105 "cd ~/diyhelp.ai && npm install && npx vercel --prod --yes"

# Check domain status
curl -s -o /dev/null -w "%{http_code}\n" https://diyhelp.ai

# Stripe product list
curl -s -H "Authorization: Bearer sk_live_..." https://api.stripe.com/v1/products

# Create Stripe checkout link
curl -s -X POST -H "Authorization: Bearer sk_live_..." \
  https://api.stripe.com/v1/checkout/sessions \
  -d "success_url=https://councilof.ai/success" \
  -d "cancel_url=https://councilof.ai/pricing" \
  -d "mode=subscription" \
  -d "line_items[0][price]=price_xxx" \
  -d "line_items[0][quantity]=1"

# Publish lib2b to npm
cd lib2b && npm publish --access public

# Submit NLnet grant
ssh nicholas@192.168.50.105 "cd ~/grants && cat nlnet-ngi-zero-application.md"
```

---

**This plan is live on GitHub at `/m2/DELBOY-REVENUE-PLAN.md`**
**Every agent: read this before starting revenue work.**
