# COBOL Bridge Stripe Price Fix Package
**Date:** 2026-06-17 05:30 BST  
**Agent:** JEEVES  
**Risk:** Lawsuit if customers are charged £2,499 instead of £199/seat/month

---

## Issue
Multiple planning docs confirm the COBOL Bridge Pro seat should be **£199/month**, but Stripe (or checkout code) is configured at **£2,499/month**.

Sources:
- `business-plans/TODO_COBOL_BRIDGE.md`: "FIX £2,499 pricing to £199/seat/month in Stripe (CRITICAL — lawsuit risk)"
- `business-plans/PORTFOLIO_STRATEGY.md`: "COBOL Bridge £2,499 pricing bug | Lawsuit risk | Nick | 30 min"
- `revenue/PRICING_SOURCE_OF_TRUTH.md` and audit docs repeat the £199 vs £2,499 mismatch.

---

## Exact Fix Steps

### Step 1 — Stripe Dashboard
1. Go to https://dashboard.stripe.com/products
2. Search product: **"COBOL Bridge Pro"** or **"COBOL Bridge"**
3. Open the product → Pricing section
4. Find the active price at **£2,499 / month**
5. Either:
   - **Edit** the existing price down to **£199 / month**, OR
   - **Archive** the £2,499 price and create a new price at **£199 / month** (recommended for audit trail)

### Step 2 — Refund / Credit Overcharged Customers
If any subscription or invoice has already been generated at £2,499:
1. Stripe → Customers → filter by product "COBOL Bridge"
2. For each affected customer, issue a full refund or account credit for the difference (£2,300/seat).
3. Document refunds for legal/defense.

### Step 3 — Update Code / Env
After creating the new £199 price, copy the new **Price ID** (`price_...`) into:
- `~/clawd/.env.local`:
  ```bash
  STRIPE_COBOl_BRIDGE_PRICE_ID=price_xxxxxxxxxxxxx
  ```
- Vercel production env for `cobol-bridge-demo`
- Any checkout buttons in `cobol-bridge-demo` source that hard-code a price ID

### Step 4 — Verify Live Checkout
1. Open https://cobolbridge.ai/pricing
2. Click checkout
3. Confirm Stripe Checkout shows **£199/month** for Pro seat
4. Complete a £0.20 live test charge

---

## Audit Trail
- [ ] Screenshot old £2,499 price before change
- [ ] Screenshot new £199 price after change
- [ ] Screenshot refund/credit records (if any)
- [ ] Save new Price ID in 1Password / password manager

---

## Autonomous Prep Done
- Confirmed issue in business plans and revenue docs
- meok-attestation-api and keystone healthy (certs can be attached to outreach)
- No code references to a hard-coded COBOL Bridge £2,499 found in active deploy dirs (the bug is in Stripe product config, not code)

---

*Ready for Nick to execute in Stripe dashboard. Estimated time: 5 minutes.*
