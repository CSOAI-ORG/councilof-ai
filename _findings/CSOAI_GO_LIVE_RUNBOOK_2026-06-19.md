# CSOAI go-live runbook — 2026-06-19

Verified live state, exact remaining gates, and paste-ready commands.
Project: Vercel `csoai-v2-master` (scope niks-projects-0a2ef942) ← GitHub CSOAI-ORG/csoai-dashboard (push = auto-deploy).
Repo on disk: ~/clawd/csoai-dashboard-master

## ✅ Verified LIVE today
- csoai.org apex 200 (v2 white+green); agent.json + .well-known/mcp.json + llms.txt all 200.
- Dashboard: /healthz 200, /api/courses 200 (real data). Signup (email/pw + JWT) works.
- Billing plumbing hardened + adversarially reviewed (commit 971ac79). Safe to take money once key lands.
- Stripe products LIVE (acct_1TLlEKQvIueK5Xpb): Starter £499/mo+£4788/yr, Pro £999/mo+£9588/yr.
- Vercel prod env present: 4 Stripe price IDs, JWT_SECRET, DATABASE_URL, MEOK_MASTER_API_KEY.

## Env var names the CODE actually reads (ground truth)
- `STRIPE_SECRET_KEY`        ← live key. **MISSING in Vercel.** THE blocker.
- `STRIPE_WEBHOOK_SECRET`    ← read by server/stripe/webhookHandler.ts:26. **MISSING in Vercel.**
- 4× `STRIPE_*_PRICE_ID`     ← set ✓
- `VITE_STRIPE_PUBLISHABLE_KEY` ← **NOT NEEDED.** Checkout is server-side hosted (checkout.sessions.create → redirect to session.url); no client-side loadStripe. Don't waste time on it.

## Webhook endpoint to register in Stripe
URL: `https://csoai-v2-master.vercel.app/api/stripe/webhook`  (raw-body mounted, sig verified)
Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid

## ⚠️ Do NOT reuse keystone STRIPE_WHSEC
keystone has `STRIPE_WHSEC` (whsec_…) but it belongs to a DIFFERENT endpoint (MEOK attestation webhook reroutes).
Webhook secrets are endpoint-specific — pushing it would make signature verification FAIL on real csoai events.
Get the whsec from the NEW endpoint you register above.

## ── PASTE-READY: the only two things gated on you ──

# 1) Live secret key (the revenue unblock). Copy sk_live_… to clipboard, then:
pbpaste | keystone set STRIPE_SECRET_KEY
keystone get STRIPE_SECRET_KEY | vercel env add STRIPE_SECRET_KEY production --scope niks-projects-0a2ef942 --force

# 2) Webhook signing secret (after registering the endpoint above in Stripe). Copy whsec_… then:
pbpaste | keystone set CSOAI_STRIPE_WHSEC
keystone get CSOAI_STRIPE_WHSEC | vercel env add STRIPE_WEBHOOK_SECRET production --scope niks-projects-0a2ef942 --force

# 3) Redeploy to pick up env (env changes need a fresh build):
cd ~/clawd/csoai-dashboard-master && vercel deploy --prod --scope niks-projects-0a2ef942

## Smoke test after deploy (run by Claude once key is in)
- POST a checkout create via the dashboard UI / tRPC → expect a session.url (not 500).
- Use Stripe test card on the live page only if in test mode; for live, do one real £ then refund.
- Confirm webhook delivery 200 in Stripe dashboard → user tier flips to starter/pro in DB.

## Non-blocking cleanup (your business call, not bugs)
- mcpRegistry.json 302 vs canonical 271 — which 31 to drop?
- "250,000 analysts / $45-150/hr" CEASAI narrative across 8+ files — honesty risk, keep/soften/cut?
- CEASAI acronym for the cert — keep or rebrand?
- Stale prices on cert/USD-API/SaaS lines; dead dup routes /blog, /public-watchdog.
