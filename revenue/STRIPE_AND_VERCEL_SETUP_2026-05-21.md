# STRIPE & VERCEL DEPLOYMENT — Action Items for Nick
**Generated:** 2026-05-21 · JEEVES execution session

---

## STRIPE PRODUCTS CREATED (LIVE MODE)

| Tier | Product ID | Price ID | Amount | Interval |
|---|---|---|---|---|
| Starter | `prod_UYXaVdZbQ560kg` | `price_1TZQWRQvIueK5Xpb6wIJcZyq` | £49/mo | Monthly |
| Starter | `prod_UYXaVdZbQ560kg` | `price_1TZQWSQvIueK5XpbKpiXpAlD` | £490/yr | Annual |
| Pro | `prod_UYXbPXmFa7OkGM` | `price_1TZQWhQvIueK5XpbLxlC0yz1` | £149/mo | Monthly |
| Pro | `prod_UYXbPXmFa7OkGM` | `price_1TZQWiQvIueK5XpbeM0UYFmg` | £1,490/yr | Annual |
| Defence | `prod_UYXbRPHF29otzM` | `price_1TZQWUQvIueK5Xpb1YBLA1nf` | £999/mo | Monthly |
| Enterprise | `prod_UYXbVmmNobdMEF` | `price_1TZQWVQvIueK5XpbdQdpDDmj` | £2,499/mo | Monthly |

### NEXT STEPS (Nick — 15 min in Stripe Dashboard)

1. **Create Payment Links** for each tier in Stripe Dashboard → Products → each product → Create payment link
2. **Update `meok/ui/src/lib/stripe.ts`** with new price IDs for the governance tiers
3. **Create checkout links** and replace old `buy.stripe.com` URLs in all pages
4. **Set webhook endpoint**: `https://meok.ai/api/webhooks/stripe` → enable all events
5. **Copy webhook signing secret** → `STRIPE_WEBHOOK_SECRET` env var

---

## VERCEL ENV VARS (Nick — 10 min)

Run for **each** Vercel project (meok, safetyof-ai, meok-ai-landing, csoai-org, council-ai-storefront):

```bash
# In each project directory:
cd ~/clawd/meok/ui
vercel env add STRIPE_SECRET_KEY live
# Paste: sk_live_... (your secret key, NOT the restricted key)

vercel env add STRIPE_RESTRICTED_KEY live
# Paste: rk_live_REDACTED...

vercel env add STRIPE_WEBHOOK_SECRET live
# Paste from Stripe Dashboard → Webhooks

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY live
# Paste: pk_live_... from Stripe Dashboard → API Keys

vercel env add RESEND_API_KEY live
# Get from https://resend.com → API Keys → Create
```

### Or via Vercel Dashboard (faster):
1. https://vercel.com/dashboard → Select project → Settings → Environment Variables
2. Add each variable for Production, Preview, and Development environments

---

## PRICING RECONCILIATION — COMPLETED

All display prices updated to: **£49 / £149 / £999 / £2,499**

| Surface | Updated? |
|---|---|
| meok-ai-landing/pricing.html | ✅ New tiers |
| meok-ai-landing/index.html | ✅ £29→£49 |
| meok-ai-landing/scorecard.html | ✅ New tiers |
| meok-ai-landing/prompt-injection-firewall.html | ✅ New tiers |
| meok-ai-landing/cobol-bridge.html | ✅ New tiers |
| safetyof-ai/index.html | ✅ £29→£49, £79→£149 |
| meok/ui/src/ (34+ files) | ✅ New tiers |
| meok/ui/src/lib/stripe.ts | ✅ Added governance-defence tier |
| meok/ui/src/app/api/webhooks/stripe/route.ts | ✅ PII removed |
| Stripe live products | ✅ 4 new products with 6 prices |

---

## WHAT'S LEFT (requires Nick's browser)

| # | Action | Time |
|---|--------|------|
| 1 | `gh auth refresh -s public_repo,repo` | 30s |
| 2 | `npm login` (fresh token) | 30s |
| 3 | `mcp-publisher login github` | 1 min |
| 4 | Get `RESEND_API_KEY` from resend.com | 3 min |
| 5 | LoopFactory AI Ltd decision | 15 min |
| 6 | Create Payment Links in Stripe Dashboard | 15 min |
| 7 | Set Vercel env vars (all 5 projects) | 10 min |
| 8 | Vercel deployment protection OFF | 5 min |
| 9 | Verify live checkout works end-to-end | 10 min |