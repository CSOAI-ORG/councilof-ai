# 🚀 SITES FIX PLAN - GITHUB & VERCEL

**Date:** April 16, 2026  
**Status:** 2/4 Sites Deployed, Payment Links Needed

---

## 📊 CURRENT STATUS

### ✅ Deployed & Ready
| Site | URL | Domain | Status |
|------|-----|--------|--------|
| meok | https://meok-pg6jr1pnp-niks-projects-0a2ef942.vercel.app | meok.ai | ✅ Ready |
| csoai-org | https://csoai-be5tn3xdu-niks-projects-0a2ef942.vercel.app | csoai.org | ✅ Ready |

### ❌ Needs Deployment
| Site | Domain | Status |
|------|--------|--------|
| cobolbridge.ai | cobolbridge.ai | No deployment |
| prooof.ai | prooof.ai | Not in Vercel |

### ❌ Failing (ARCHIVED 2026-06-27 — see _findings/CSOAI_MASTER_ABSORB_PLAN_2026-06-16.md)
| Site | Status | Decision |
|------|--------|----------|
| ~~csga-global~~ | ~~4 error states~~ | **DELETED 2026-06-10** per Vercel census cleanup; archived decision in _findings/CSOAI_MASTER_ABSORB_PLAN_2026-06-16.md |

---

## 🔗 STRIPE PAYMENT LINKS (ADD TO SITES)

### CSOAI Governance Suite
```html
<!-- Add to csoai.org/pricing or /certification -->
<a href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K" class="btn-primary">
  Subscribe SMB - £49/mo
</a>

<a href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K" class="btn-primary">
  Subscribe Professional - £149/mo
</a>

<a href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K" class="btn-enterprise">
  Subscribe Enterprise - £499/mo
</a>
```

### MEOK Bundles
```html
<!-- Add to meok.ai/pricing -->
<a href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K" class="btn">
  MEOK Core Pack - £49/mo
</a>

<a href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K" class="btn">
  MEOK Pro Bundle - £99/mo
</a>
```

---

## 🛠️ FIXES NEEDED

### 1. meok.ai Site
**Repo:** CSOAI-ORG/meok-ai (PRIVATE)

**Changes:**
- [ ] Add pricing page with payment links
- [ ] Add "Buy Now" buttons to product pages
- [ ] Verify domain linking

**How to Deploy:**
```bash
# Vercel auto-deploys on git push
# Just push to main branch
git add .
git commit -m "Add Stripe payment links"
git push origin main
```

---

### 2. csoai.org Site
**Repo:** CSOAI-ORG/csoai-org (PUBLIC)

**Changes:**
- [ ] Add certification checkout page
- [ ] Add governance suite pricing
- [ ] Add "August Survival Audit" (£5,000)

**Payment Links to Add:**
- CSOAI Governance Suite - £199/mo
- EU AI Act Starter - £49/mo
- Enterprise Audit - £5,000

---

### 3. cobolbridge.ai Site
**Status:** No deployment

**Action:** Create simple landing page
```html
<!DOCTYPE html>
<html>
<head>
  <title>COBOL Bridge - Legacy Modernization</title>
</head>
<body>
  <h1>COBOL Bridge</h1>
  <p>Modernize 60 years of COBOL. Gain cloud speed.</p>
  <a href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K">Get Started - £199/mo</a>
</body>
</html>
```

**Deploy:**
```bash
# Create repo
cd ~/clawd
git init cobolbridge-site
# Add files
vercel --prod
```

---

### 4. prooof.ai Site
**Status:** Not in Vercel

**Action:** Check if hosted elsewhere or deploy to Vercel

---

## 🚀 DEPLOYMENT COMMANDS

### Link Custom Domain
```bash
# For meok.ai
vercel domains add meok.ai

# For csoai.org
vercel domains add csoai.org

# For cobolbridge.ai
vercel domains add cobolbridge.ai
```

### Promote to Production
```bash
# meok
vercel --prod

# csoai-org
vercel --prod

# cobolbridge (new)
vercel --prod
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] meok.ai loads with payment links
- [ ] csoai.org loads with certification checkout
- [ ] cobolbridge.ai deployed and loads
- [ ] All Stripe links work
- [ ] Mobile responsive
- [ ] HTTPS enabled

---

## 💰 EXPECTED IMPACT

After adding payment links:
- **Week 1:** £1,000-2,000 revenue
- **Month 1:** £5,000-8,000 revenue
- **Conversion rate:** 2-5% of visitors

---

## ⚠️ PRIORITY ORDER

1. **csoai.org** - Add governance checkout (highest value)
2. **meok.ai** - Add bundle pricing (volume play)
3. **cobolbridge.ai** - Deploy landing page (new market)
4. **csga-global** - Fix or delete (cleanup)

---

## 📚 FILES CREATED

- `~/clawd/SITES-FIX-PLAN.md` - This file
- `~/clawd/cobolbridge-landing.html` - Landing page template
- `~/clawd/csoai-checkout.html` - Checkout page template

---

**Next Step:** Modify GitHub repos and push changes for auto-deployment.
