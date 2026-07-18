# STRIPE LIVE SETUP - EXECUTE NOW

## STEP-BY-STEP COMMANDS FOR NICK

### 1. Open Stripe Dashboard
```bash
# Go to: https://dashboard.stripe.com/apikeys
# Switch to "Live" mode (toggle in sidebar)
```

### 2. Create Products (Copy these exact settings)
```bash
# Product 1: MEOK Sovereign
Name: "MEOK Sovereign"
Price: £12.00 GBP monthly recurring
Description: "Personal AI companion with sovereignty"
→ Save and copy price_id: price_xxxxx

# Product 2: MEOK Family  
Name: "MEOK Family"
Price: £29.00 GBP monthly recurring  
Description: "Multi-user AI family with advanced features"
→ Save and copy price_id: price_xxxxx
```

### 3. Get API Keys
```bash
# In Stripe Dashboard → API Keys
Publishable key: pk_live_xxxxx (copy this)
Secret key: sk_live_xxxxx (copy this - NEVER share publicly)
```

### 4. Create Webhook
```bash
# Stripe Dashboard → Webhooks → Add endpoint
Endpoint URL: https://try.meok.ai/api/webhooks/stripe
Events to listen for: Select these:
- checkout.session.completed
- invoice.payment_succeeded  
- invoice.payment_failed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted

→ Save and copy webhook secret: whsec_xxxxx
```

### 5. Deploy to Vercel (Run these commands)
```bash
# Navigate to MEOK project
cd /Users/nicholas/clawd/meok

# Add environment variables
echo "sk_live_xxxxx" | vercel env add STRIPE_SECRET_KEY production
echo "pk_live_xxxxx" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production  
echo "price_xxxxx" | vercel env add STRIPE_PRICE_SOVEREIGN production
echo "price_xxxxx" | vercel env add STRIPE_PRICE_FAMILY production
echo "whsec_xxxxx" | vercel env add STRIPE_WEBHOOK_SECRET production

# Deploy to production
vercel --prod
```

### 6. Test Payment Flow
```bash
# Open try.meok.ai on phone
# Complete signup → subscribe → enter test card:
# Card: 4242 4242 4242 4242
# Exp: 12/34, CVC: 567, ZIP: 12345
# Should complete successfully and redirect to dashboard
```

## SUCCESS INDICATORS:
✅ Products created in Stripe
✅ Webhook receiving events  
✅ Test payment completes
✅ User gets access to paid features

**Expected Result: First paying customer within 48 hours**
**Revenue Target: £12-29 per new subscriber**