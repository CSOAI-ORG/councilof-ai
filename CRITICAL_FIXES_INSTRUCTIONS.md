# CRITICAL FIXES — STEP BY STEP

## 1. STRIPE LIVE MODE ACTIVATION (30 minutes)

### Step 1: Log in to Stripe
https://dashboard.stripe.com

### Step 2: Activate Account
1. Go to https://dashboard.stripe.com/settings/account
2. Click "Activate your account" (big blue button)
3. Fill in business details:
   - Business name: MEOK AI Labs
   - Business website: https://meok.ai
   - Industry: Technology / Software
   - Business address: Your UK farm address
   - Business type: Private limited company (MEOK AI Ltd)

### Step 3: Identity Verification
1. Upload photo ID (passport or driver's license)
2. Upload proof of address (bank statement or utility bill)
3. Selfie verification (they'll ask for camera access)

### Step 4: Bank Account
1. Add bank account for payouts
2. Account number and sort code
3. Account holder name: Nicholas Templeman or MEOK AI Ltd

### Step 5: Wait for Approval
- Usually instant to 24 hours
- You'll get email confirmation
- Then you can process live payments

---

## 2. NAMECHEAP DNS FIX (5 minutes)

### For ALL 4 domains, do this:

1. Log in to https://www.namecheap.com
2. Username: nicholastempleman
3. Go to "Domain List" (left sidebar)
4. For each domain below, click "Manage":

**Domain 1: csoai.org**
- Click "MANAGE" next to csoai.org
- Find "NAMESERVERS" section
- Select "Custom DNS" dropdown
- Delete existing entries
- Enter:
  ```
  ns1.vercel-dns.com
  ns2.vercel-dns.com
  ```
- Click Save (green checkmark)

**Domain 2: meok.ai**
- Same steps as above

**Domain 3: cobolbridge.ai**
- Same steps as above

**Domain 4: proofof.ai**
- Same steps as above

### Verification:
After 5-60 minutes, these should work:
- https://csoai.org
- https://meok.ai
- https://cobolbridge.ai
- https://proofof.ai

---

## 3. PRICING MISMATCHES (Already fixing below)

See create-stripe-price-updates.py for automated fix.

---

## POST-FIX VERIFICATION

After all 3 fixes are done:

```bash
# Test DNS
curl -I https://csoai.org
curl -I https://meok.ai
curl -I https://cobolbridge.ai
curl -I https://proofof.ai

# Test Stripe (make small test payment)
# Go to each site's pricing page and click "Get Started"
```

---

## SUPPORT

If Stripe activation fails:
- Contact support@stripe.com
- They typically respond in 24 hours
- Have your company registration number ready

If Namecheap DNS doesn't propagate:
- Clear local DNS: `sudo dscacheutil -flushcache`
- Check global propagation: https://whatsmydns.net
- Wait up to 60 minutes
