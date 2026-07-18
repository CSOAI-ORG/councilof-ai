# STRIPE REVENUE - EXECUTE NOW (30 MINUTES)

## 🚀 OPEN THIS TAB: https://dashboard.stripe.com

### STEP 1: Switch to LIVE MODE (1 minute)
```bash
1. Click "Test mode" toggle in top-left
2. Switch to "LIVE mode"  
3. Complete any verification prompts
```

### STEP 2: Create Products (5 minutes)
**Click "Products" → "Create Product"**

**Product 1:**
```
Name: MEOK Sovereign
Price: £12.00 GBP  
Billing: Monthly
Description: Personal AI companion with sovereignty
→ SAVE → Copy price_id: price_xxxxxxxxxxxxx
```

**Product 2:**  
```
Name: MEOK Family
Price: £29.00 GBP
Billing: Monthly  
Description: Multi-user AI family with advanced features
→ SAVE → Copy price_id: price_xxxxxxxxxxxxx
```

### STEP 3: Get API Keys (2 minutes)
**Go to: Developers → API Keys**
```bash
Publishable key: pk_live_xxxxxxxxxxxxx
Secret key: sk_live_xxxxxxxxxxxxx (click "Reveal")
```

### STEP 4: Create Webhook (3 minutes)
**Go to: Developers → Webhooks → Add endpoint**
```
URL: https://try.meok.ai/api/stripe/webhook

Events (select these):
✅ checkout.session.completed
✅ invoice.payment_succeeded
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted

→ SAVE → Copy signing secret: whsec_xxxxxxxxxxxxx
```

### STEP 5: Deploy to Vercel (15 minutes)
**TERMINAL COMMANDS:**
```bash
cd /Users/nicholas/clawd/meok/ui

# Add all 5 environment variables:
echo "sk_live_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_SECRET_KEY production

echo "pk_live_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

echo "price_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_PRICE_SOVEREIGN production

echo "price_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_PRICE_FAMILY production

echo "whsec_xxxxxxxxxxxxx" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_WEBHOOK_SECRET production

# Deploy to production:
/Users/nicholas/.local/node/bin/vercel --prod
```

### STEP 6: Test Payment (4 minutes)
```bash
1. Open try.meok.ai
2. Sign up/login
3. Go to subscription page  
4. Choose £12 or £29 plan
5. Use test card: 4242 4242 4242 4242
6. Verify success!
```

**RESULT: £12-29 recurring revenue per subscriber starts TODAY!**