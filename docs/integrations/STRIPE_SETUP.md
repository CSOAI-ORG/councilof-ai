# Stripe Integration Setup (Day 32)

## Required Stripe Products

csoai.org currently uses 8 pricing tiers → 11 tiers (after Day 33 expansion).
Each tier needs a Stripe Payment Link or Price ID.

### Current Pricing Tiers

| Tier | Price | Billing | Stripe Link Required |
|------|-------|---------|---------------------|
| Sovereign | £29/mo | monthly | yes |
| Pro | £199/mo | monthly | yes |
| Enterprise | £1,499/mo | monthly | yes |
| Article 50 Emergency Kit | £999 | one-time | yes |
| LAUNCH50 | £499 | one-time (12mo) | yes |
| Quick Compliance Check | £9 | one-time | yes |
| Audit-Prep Bundle | £4,950 | one-time | yes |
| Watchdog Certificate | £4,950 | one-time | yes |
| **Annual Pro (NEW)** | **£1,999/yr** | annually | **NEEDED** |
| **Edu/Research (NEW)** | **£99/mo** | monthly | **NEEDED** |
| **BYOK Sovereign (NEW)** | **£99/mo** | monthly | **NEEDED** |

### Known Bug (from audit)

3 Stripe links are shared between different-priced tiers (the "wrong price" bug):
- `…8k91S` used by both Sovereign £9/mo AND Sovereign Starter £29/mo (should be £29)
- `…8k91T` used by both Sovereign Pro £19/mo AND Pro £199/mo (charges £19 not £199 — **10× underprice**)
- `…8k91R` used by both Family £29/mo AND LAUNCH50 £499 kit (charges £29/mo recurring not £499 one-time)

**Fix:** Create 3 new Payment Links + edit 3 lines in `pricing.html`.

## Stripe Webhook Setup

The webhook endpoint: `/webhook/stripe` on csoai-mcp-monetization:3400
Required env vars:
- `STRIPE_SECRET_KEY` (currently placeholder in Vercel)
- `STRIPE_WEBHOOK_SECRET` (need to set in Vercel + add to Stripe dashboard)

Webhook events to handle:
- `checkout.session.completed` → record in subscriptions
- `customer.subscription.created` → record tier upgrade
- `invoice.paid` → record payment
- `payment_intent.succeeded` → record one-time purchase

## 2 Unblockers for Revenue

1. **`mail.meok.ai` Resend verification** (5-60 min DNS setup) → fires 336 emails → first charges
2. **`STRIPE_SECRET_KEY` in Vercel** → fires real revenue from /checkout flow
