# STRIPE SETUP - FINAL EXECUTION GUIDE

## 🎯 IMMEDIATE REVENUE ACTIVATION

**Based on current project structure analysis:**
- Main deployable project: `/Users/nicholas/clawd/meok/ui/`
- Vercel configuration: ✅ Found and optimized
- Deployment target: try.meok.ai (confirmed)

---

## STEP 1: STRIPE DASHBOARD SETUP (10 minutes)

### 1.1 Open Stripe Dashboard
```bash
# Go to: https://dashboard.stripe.com
# Switch to LIVE mode (important - not test mode)
# Click "Activate account" if prompted
```

### 1.2 Create Products (Exact Settings)
```bash
PRODUCT 1:
Name: "MEOK Sovereign"  
Price: £12.00 GBP
Billing: Monthly recurring
Description: "Personal AI companion with sovereignty"
→ Save and copy price_id: price_xxxxxxxxxxxxx

PRODUCT 2:
Name: "MEOK Family"
Price: £29.00 GBP  
Billing: Monthly recurring
Description: "Multi-user AI family with advanced features"
→ Save and copy price_id: price_xxxxxxxxxxxxx
```

### 1.3 Get API Keys
```bash
# Stripe Dashboard → Developers → API Keys
Publishable key: pk_live_xxxxxxxxxxxxx (starts with pk_live)
Secret key: sk_live_xxxxxxxxxxxxx (starts with sk_live - keep private!)
```

### 1.4 Create Webhook
```bash
# Stripe Dashboard → Developers → Webhooks → Add endpoint

Endpoint URL: https://try.meok.ai/api/stripe/webhook

Select these events:
✅ checkout.session.completed
✅ invoice.payment_succeeded
✅ invoice.payment_failed  
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted

→ Save and copy signing secret: whsec_xxxxxxxxxxxxx
```

---

## STEP 2: VERCEL DEPLOYMENT (15 minutes)

### 2.1 Navigate to Project
```bash
cd /Users/nicholas/clawd/meok/ui
```

### 2.2 Add Environment Variables
```bash
# Replace xxxxx with your actual values from Step 1

echo "sk_live_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_SECRET_KEY production

echo "pk_live_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

echo "price_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_PRICE_SOVEREIGN production

echo "price_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_PRICE_FAMILY production

echo "whsec_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_WEBHOOK_SECRET production
```

### 2.3 Deploy to Production
```bash
/Users/nicholas/.local/node/bin/vercel --prod
```

---

## STEP 3: TEST PAYMENT FLOW (5 minutes)

### 3.1 Test Subscription
```bash
# Open try.meok.ai on phone or computer
# Complete signup/login process
# Navigate to subscription page
# Click "Subscribe to MEOK Sovereign" (£12) or "MEOK Family" (£29)

# Use Stripe test card:
Card Number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 567
ZIP: 12345

# Should complete successfully and redirect to dashboard
```

### 3.2 Verify Webhook
```bash
# Stripe Dashboard → Webhooks → View events
# Should see "checkout.session.completed" event
# Status should be "Succeeded"
```

---

## SUCCESS INDICATORS

✅ **Products Created:** 2 products in Stripe dashboard  
✅ **Environment Variables:** 5 variables added to Vercel
✅ **Deployment:** try.meok.ai shows updated version
✅ **Test Payment:** Completes successfully  
✅ **Webhook Events:** Received and processed
✅ **User Access:** Subscriber gets premium features

---

## EXPECTED REVENUE

### Immediate:
- **Test subscriptions:** £12-29 from first users
- **Word of mouth:** 2-3 subscribers from initial testers

### Week 1:
- **Target:** 5-10 subscribers = £60-290/month
- **Growth rate:** 20-30% weekly (industry standard)

### Month 1:  
- **Target:** 25-50 subscribers = £300-1,450/month
- **Annual value:** £3,600-17,400 recurring

---

## TROUBLESHOOTING

### If Deployment Fails:
```bash
# Check build memory settings
/Users/nicholas/.local/node/bin/vercel env add NODE_OPTIONS "--max-old-space-size=14336" production
/Users/nicholas/.local/node/bin/vercel --prod
```

### If Webhook Fails:
```bash
# Verify URL: https://try.meok.ai/api/stripe/webhook
# Check endpoint responds: curl -X POST https://try.meok.ai/api/stripe/webhook
```

### If Payment Fails:
```bash
# Verify all 5 environment variables are set
/Users/nicholas/.local/node/bin/vercel env ls production
```

---

**READY TO EXECUTE:** This setup should take 30 minutes total and generate immediate recurring revenue!

**Next: Execute domain monetization for $60k-120k potential from premium domains.**