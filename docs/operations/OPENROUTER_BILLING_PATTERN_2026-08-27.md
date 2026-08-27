# OpenRouter account/billing pattern — reference for Billing.tsx rebuild (2026-08-27)
# JEEVES lane · Claude left Billing.tsx as a 301 stub. This is the OpenRouter pattern
# the user asked us to learn from. Non-colliding — Claude owns the component.

## OpenRouter's public account flow (what end users experience)
1. Sign-up (free) → get an API key immediately
2. Dashboard shows: credits balance, usage history, cost per call
3. Top up credits — usage-based billing, NOT subscription-first
4. API key is the "account" — no org/team needed for solo devs

## The patterns CSOAI should adopt (mapped to our doctrine)
1. **Zero-friction key generation** — SDK/CLI drop-in IS the key. No sign-up wall.
2. **Transparent usage dashboard** — cost per verified-execution, not per-token.
3. **Credit-based billing** — top up USDC/x402 (paddle/stripe for fiat), spend as you go.
   NOT subscription-first (the "free trust engine forever" boundary).
4. **The key is the account** — a developer gets a key, uses it, sees their usage.
   No "account creation" ceremony needed.

## What Billing.tsx should show (the concrete page)
- Current credit balance (USDC / £)
- Usage: verified-executions this month, total
- Top-up button (paddle/stripe)
- Payment method (saved + add)
- Invoice/payment history
- Plan: Free tier (trust engine) vs Pro tier (metered workflow/scale/assurance)

## The doctrine boundary (bind every route)
- No public $ prices on the non-auth page (the lobby already handles this)
- A grade is never sold
- The trust engine (measurement cards, verification) is free forever
- Metered = workflow, scale, assurance ONLY
