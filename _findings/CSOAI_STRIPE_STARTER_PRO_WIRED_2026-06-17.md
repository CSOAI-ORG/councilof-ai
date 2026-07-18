# CSOAI Stripe subscription tiers WIRED LIVE — 2026-06-17

Created live on Stripe acct_1TLlEKQvIueK5Xpb (MEOK AI LTD) via Kimi browser
(rk_live CLI key is read-only — can't create). All GBP, recurring, not metered.

## Products + prices (LIVE)
- CSOAI Starter   prod_UicKFsulVYA7uZ
  - monthly £499   price_1TjB68QvIueK5XpbwxEkXxSd  (STRIPE_STARTER_MONTHLY_PRICE_ID)
  - yearly  £4788  price_1TjB68QvIueK5XpbC9gQjdQ6  (STRIPE_STARTER_YEARLY_PRICE_ID)
- CSOAI Professional  prod_UicN97TijH3mOo
  - monthly £999   price_1TjB8cQvIueK5XpbsOyuzR2b  (STRIPE_PRO_MONTHLY_PRICE_ID)
  - yearly  £9588  price_1TjB8cQvIueK5Xpbu0XMj01Q  (STRIPE_PRO_YEARLY_PRICE_ID)
- Enterprise = sales-assisted (mailto enterprise@csoai.org), no Stripe price needed.

## Vercel (csoai-v2-master, niks-projects-0a2ef942) Production env — SET
All 4 price-ID vars added 2026-06-17.

## REMAINING BLOCKER for working checkout
STRIPE_SECRET_KEY is NOT in the Vercel env (only JWT_SECRET, DATABASE_URL,
MEOK_MASTER_API_KEY were there). createCheckoutSession throws without it.
Nick must add a live STRIPE_SECRET_KEY with checkout-session create scope.
Until then, ALL tiers' checkout 500s — not just Starter.

## Canonical price ladder (now consistent in code @ c43d401)
Starter £499 / Professional £999 / Enterprise £1999. products.ts had stale
£39/£159; homepage had €99-499 — both corrected.
