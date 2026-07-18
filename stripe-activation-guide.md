# Stripe Live Activation - Immediate Revenue Setup

## EXACT STEPS FOR NICK

### Step 1: Stripe Dashboard Setup
1. Go to: https://dashboard.stripe.com/apikeys
2. Click "Create restricted key" or use existing
3. Copy these EXACT values:

### Step 2: Create Products
```bash
# In Stripe Dashboard → Products
Product 1: "MEOK Sovereign" 
- Price: £12/month
- Copy price_id: price_xxxxx

Product 2: "MEOK Family"  
- Price: £29/month
- Copy price_id: price_xxxxx
```

### Step 3: Environment Variables
```bash
# Run these commands in terminal:
printf '%s' "sk_live_xxxxx" | vercel env add STRIPE_SECRET_KEY production
printf '%s' "pk_live_xxxxx" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production  
printf '%s' "price_xxxxx" | vercel env add STRIPE_PRICE_SOVEREIGN production
printf '%s' "price_xxxxx" | vercel env add STRIPE_PRICE_FAMILY production
```

### Step 4: Webhook Setup
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://try.meok.ai/api/webhooks/stripe`
3. Events: Select all checkout and subscription events
4. Copy webhook secret: `whsec_xxxxx`
5. Add to Vercel: `printf '%s' "whsec_xxxxx" | vercel env add STRIPE_WEBHOOK_SECRET production`

### Step 5: Deploy & Test
```bash
vercel --prod
# Then test: try.meok.ai → signup → subscribe
```

**Expected Result:** First paying customer within 48 hours