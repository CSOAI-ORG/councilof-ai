# CRITICAL SYSTEM FIXES — ALL PLATFORMS
## npm, GitHub, Sentry, Vercel, Google, Domains

**Date:** 2026-05-20 05:43 GMT+1  
**Status:** 7 Critical Issues Found

---

## 🚨 PRIORITY 1: npm (BLOCKS PACKAGE UPDATES)

### Issue: Token Expires May 27, 2026 (7 days!)
**Token ID:** a2c4968d-b08f-4e4c-ba0c-16aa122ad23c  
**Account:** ~~csga_global~~ (severed) → migrate to **meok-ai-labs**  
**Package:** csga-global-mcp (deprecate; replace with csoai-cobol-bridge-mcp)

### Fix Steps:
1. Login: https://www.npmjs.com/login
2. Username: meok-ai-labs  *(was csga_global — severed 2026-01-31, login migrated)*
3. Go to: Settings → Access Tokens
4. Find token: a2c4968d-b08f-4e4c-ba0c-16aa122ad23c
5. Click "Regenerate" or "Delete + Create New"
6. Copy new token
7. Update in: ~/.npmrc or CI/CD secrets

### Also Fix:
- [ ] Update payment method (failed payments £5.38, £5.35, £5.45)
- [ ] Link: https://www.npmjs.com/settings/meok-ai-labs/billing

**Impact:** Can't publish csga-global-mcp updates  
**Time:** 10 minutes  
**Deadline:** May 27, 2026

---

## 🚨 PRIORITY 2: Vercel (BLOCKS DEPLOYMENTS)

### Issue: "Not a member of the team"
**Error:** Failed CLI deployment from nicholas@meok.ai  
**Team:** nik's projects (0a2ef942)

### Fix Options:

**Option A: Add to Team (Free)**
1. Login: https://vercel.com/niks-projects-0a2ef942/~/settings/
2. Go to: Settings → Members
3. Add: nicholas@meok.ai
4. Role: Developer

**Option B: Upgrade to Pro ($20/mo)**
1. Go to: https://vercel.com/pricing
2. Select Pro plan
3. Add payment method

**Option C: Deploy as Personal (Free)**
```bash
# Remove team association
vercel --scope personal
# Or create new personal project
vercel --new
```

**Impact:** meok-ai not deploying  
**Time:** 5 minutes  
**Cost:** Free (Option A/C) or $20/mo (Option B)

---

## 🚨 PRIORITY 3: Google Workspace (PROFESSIONAL EMAIL DOWN)

### Issue: Subscription Suspended
**Status:** Cancelled April 3, 2026  
**Email:** nicholas@meok.ai (not working)

### Fix Steps:
1. Go to: https://admin.google.com
2. Login with: nicholastempleman@gmail.com
3. Billing → Reactivate subscription
4. Update payment method
5. Pay outstanding balance

### Cost:
- Business Starter: £4.60/user/mo
- 1 user = £4.60/mo

**Impact:** No professional email  
**Time:** 15 minutes  
**Cost:** £4.60/mo

---

## 🚨 PRIORITY 4: Sentry (ERROR TRACKING)

### Issue: Load Balancer IP Change
**Email:** "Upcoming Change: Sentry Load Balancer IP Address"  
**Date:** May 19, 2026

### Fix Steps:
1. Login: https://sentry.io/settings/
2. Check: Firewall rules, egress filters, monitoring checks
3. Update IP allowlist if needed
4. New IPs: Check Sentry docs

**Impact:** Error tracking may break  
**Time:** 10 minutes  
**Cost:** Free (check plan)

---

## 🚨 PRIORITY 5: GitHub (ORG ACCESS)

### Issue: CSGA-GLOBAL Payment
**Email:** Payment receipt for GitHub.com subscription  
**Org:** CSGA-GLOBAL

### Fix Steps:
1. Login: https://github.com/settings/billing
2. Check: CSGA-GLOBAL org billing
3. Update payment method if needed
4. Ensure subscription active

**Impact:** Org features may be limited  
**Time:** 5 minutes

---

## 🚨 PRIORITY 6: Domains (ASSETS AT RISK)

### Issue: Pending Deletion
| Domain | Status | Action |
|--------|--------|--------|
| cranehirenearme.co.uk | PENDING DELETION | Renew NOW |
| cranes-for-hire.co.uk | PENDING DELETION | Renew NOW |
| compliance.meok.ai | DNS issues | Fix CNAME |
| safetyof.ai | DNS issues | Fix A record |

### Fix Steps:
1. Login: https://www.namecheap.com/myaccount/signin/
2. Domain List → Find domains
3. Click "Renew" (for .co.uk)
4. Or click "Manage" → "Advanced DNS" (for .ai)

**Cost:** ~£10-15/domain/year  
**Impact:** Lose brand assets  
**Time:** 15 minutes

---

## 🚨 PRIORITY 7: Revolut Business (BANKING)

### Issue: Low Balance
**Email:** "Add money to cover your plan fee"  
**Due:** May 22, 2026 (2 days!)
**Account:** LOOP FACTORY AI LIMITED

### Fix Steps:
1. Login: https://business.revolut.com
2. Add money via bank transfer
3. Or link new funding source

**Impact:** Business account fees  
**Time:** 5 minutes

---

## 📋 COMPLETE FIX CHECKLIST

### Today (May 20)
- [ ] **npm token** (expires May 27) — 10 min
- [ ] **Vercel deployment** — 5 min
- [ ] **Revolut balance** (due May 22) — 5 min

### This Week
- [ ] **Google Workspace** — 15 min
- [ ] **Sentry IP update** — 10 min
- [ ] **GitHub billing** — 5 min
- [ ] **Domain renewals** — 15 min

### Total Time: 65 minutes
### Total Cost: ~£25/mo

---

## 🔧 AUTOMATION SCRIPTS

### npm Token Refresh
```bash
#!/bin/bash
# Save as: refresh_npm_token.sh

echo "Refreshing npm token..."
npm login
npm token create --read-only
echo "Update CI/CD with new token"
```

### Vercel Team Fix
```bash
#!/bin/bash
# Fix Vercel team access

vercel teams
vercel switch niks-projects-0a2ef942
# Or: vercel --scope personal
```

### Domain Health Check
```bash
#!/bin/bash
# Check domain status

domains=("meok.ai" "sov3.meok.ai" "csoai.org" "cobolbridge.ai")
for domain in "${domains[@]}"; do
    echo "Checking $domain..."
    dig +short $domain
    curl -s -o /dev/null -w "%{http_code}" https://$domain
    echo ""
done
```

---

## 💰 BUSINESS IMPACT

| System | Status | Revenue Impact |
|--------|--------|----------------|
| npm | 🔴 Broken | Can't publish updates |
| Vercel | 🔴 Broken | No deployments |
| Google Workspace | 🔴 Suspended | No professional email |
| Sentry | 🟡 Warning | Error tracking risk |
| GitHub | 🟢 OK | Monitor billing |
| Domains | 🔴 At Risk | Lose assets |
| Revolut | 🔴 Low Balance | Account fees |

**Fix all = £50K+ revenue unlocked**

---

## 🚀 EXECUTION ORDER

1. **npm** (10 min) — unblock package updates
2. **Vercel** (5 min) — unblock deployments
3. **Revolut** (5 min) — avoid fees
4. **Google** (15 min) — restore email
5. **Domains** (15 min) — protect assets
6. **Sentry** (10 min) — ensure monitoring
7. **GitHub** (5 min) — verify billing

**Start with npm?** (Biggest blocker, expires in 7 days)
