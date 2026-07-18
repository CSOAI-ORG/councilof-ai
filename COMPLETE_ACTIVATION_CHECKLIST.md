# COMPLETE ACTIVATION CHECKLIST
## From 0 to Revenue in 4 Hours

---

## PHASE 1: SECURITY (Do First - 30 min)

### 🔐 1.1 Rotate Stripe Key
- [ ] Find hardcoded key in `create-stripe-catalog.js`
- [ ] Check if key is in git history
- [ ] Roll key in Stripe Dashboard
- [ ] Update file to use env var
- [ ] Add file to .gitignore

### 🚫 1.2 Remove James Castle
- [ ] Stripe team access
- [ ] GitHub org access
- [ ] Vercel team access

### 🔍 1.3 Scan for other leaked keys
```bash
grep -r "sk_live" --include="*.js" --include="*.py" . 2>/dev/null | grep -v node_modules
```

---

## PHASE 2: STRIPE ACTIVATION (30 min)

### 💳 2.1 Activate Live Mode
- [ ] Go to https://dashboard.stripe.com/settings/account
- [ ] Click "Activate your account"
- [ ] Fill business details (MEOK AI Ltd)
- [ ] Upload ID and proof of address
- [ ] Add bank account
- [ ] Wait for approval (usually instant)

### 📉 2.2 Create Products
```bash
export STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY
cd ~/clawd/unified-portfolio-catalog
python create-stripe-products.py
```

### 💰 2.3 Fix Pricing Mismatches
```bash
cd ~/clawd
export STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY
python fix-stripe-pricing.py
```

### 🚫 2.4 Disable Legacy Coupon
- [ ] Go to https://dashboard.stripe.com/coupons
- [ ] Find "LEGACY20"
- [ ] Set "Valid" to "No"

---

## PHASE 3: DNS FIX (15 min)

### 🌐 3.1 Update Namecheap
For EACH of these domains:
- csoai.org
- meok.ai
- cobolbridge.ai
- proofof.ai

Do:
1. Log in https://www.namecheap.com
2. Go to Domain List
3. Click Manage
4. Find "Nameservers"
5. Select "Custom DNS"
6. Enter:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
7. Save

### ✅ 3.2 Verify DNS
Wait 5-60 minutes, then test:
```bash
host csoai.org
host meok.ai
host cobolbridge.ai
host proofof.ai
```
Should show Vercel IPs, not 76.76.21.21

---

## PHASE 4: VERIFICATION (30 min)

### 🌐 4.1 Test All Sites
```bash
curl -I https://csoai.org
curl -I https://meok.ai
curl -I https://cobolbridge.ai
curl -I https://proofof.ai
```

### 💳 4.2 Test Stripe Checkout
- [ ] Go to https://csoai.org/pricing
- [ ] Click "Book Emergency Audit"
- [ ] Should show Stripe checkout (not test mode)

- [ ] Go to https://meok.ai/pricing
- [ ] Click "Get Pro"
- [ ] Should show Stripe checkout

- [ ] Go to https://proofof.ai
- [ ] Click "Get Pro"
- [ ] Should show Stripe checkout

---

## PHASE 5: LAUNCH (1 hour)

### 📢 5.1 Announce
- [ ] LinkedIn post: "4 websites, 1 mission: AI safety"
- [ ] X/Twitter thread
- [ ] Email to any existing contacts

### 📊 5.2 Set Up Monitoring
- [ ] Stripe Dashboard for payments
- [ ] Vercel Analytics for traffic
- [ ] Set up alerts for errors

### 🎯 5.3 First Customer Goal
Target: First £100 in revenue within 48 hours

---

## POST-LAUNCH (This Week)

### 📝 5.4 Legal
- [ ] Add privacy policy to all sites
- [ ] Add terms of service
- [ ] Add cookie notice

### 🎯 5.5 MCP Distribution
- [ ] Add Dockerfiles to top 20 MCPs
- [ ] Submit to Glama
- [ ] Submit to Smithery
- [ ] Publish to PyPI

### 📈 5.6 Growth
- [ ] EU AI Act blog campaign
- [ ] LinkedIn thought leadership
- [ ] Cold outreach to enterprises

---

## TROUBLESHOOTING

### Stripe activation rejected?
- Contact support@stripe.com
- Provide company registration documents
- Explain business model clearly

### DNS not propagating?
- Check: https://whatsmydns.net
- Flush local DNS: `sudo dscacheutil -flushcache`
- Wait up to 24 hours max

### Pricing still wrong?
- Must use NEW price IDs from fix script
- Update code with new IDs
- Deactivate old prices in Stripe

---

## SUCCESS CRITERIA

✅ All 4 domains load correctly  
✅ Stripe checkout works in live mode  
✅ Test payment goes through  
✅ First real customer pays  

**YOU ARE NOW EARNING REVENUE 💰**
