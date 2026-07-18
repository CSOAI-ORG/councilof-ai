# REVENUE READINESS — FUNNEL TEARDOWN — 2026-06-15 (Opus)

Traced the actual customer→cash path end-to-end against the LIVE site. Good news: the
storefront recovered (WAF cooldown cleared, pages 200). Bad news: **three separate leaks
mean a visitor cannot currently (a) sign up free, (b) get captured as a lead, or (c) buy the
Team tier** — and the deepest one blocks the entire API surface.

## What WORKS now (verified live)
- meok.ai homepage / pricing / scorecard / article-50-kit / newsletter → **200**
- csoai.org → **200**
- **All 22 Stripe payment links in source → 200** (checkout itself is healthy)
- Scorecard degrades gracefully (shows score even when cert API is down)

## The 4 leaks (ranked by revenue impact)

### 🔴 1. ENTIRE `/api/*` SURFACE RETURNS 403 — *the kingpin technical blocker*
`GET/POST https://www.meok.ai/api/*` → **403 (server: Vercel)**. Tested `/api/waitlist`,
`/api/og`. This blocks: API-based checkout, same-origin lead capture, AND OG preview images.
This is why the scorecard was built to call *external* services (Buttondown, attestation API)
to route around it.
**Fix (human, Vercel dashboard):** the firewall rule / deployment-protection blocking `/api/*`
must be lifted or scoped. One setting unblocks checkout + capture + OG together.

### 🔴 2. FREE SIGNUP IS DEAD — `/signup` → 404
The "Start free" CTA (Explorer tier — top of funnel) points at `https://meok.ai/signup` → **404**.
`proofof.ai/signup` also 404s. `meok.ai/start` → 200 (candidate target).
**Fix:** point "Start free" at a page that exists (`/start`?) or build `/signup`. Source edit + deploy.

### 🔴 3. LEAD CAPTURE NEVER WORKED — Buttondown account doesn't exist
Scorecard + newsletter + status page all POST to `buttondown.email/.../meok-eu-ai-compliance-brief`
(and `/meok`) → **both 404**. With `no-cors`, the browser never surfaced it: **100% of scorecard
+ newsletter signups were silently dropped.** Buttondown was never set up.
**Done by me:** repointed the scorecard to the durable same-origin `/api/waitlist` (Postgres +
logs + Loops/Resend) — *but that path is currently 403'd by leak #1, so it only captures once #1
is fixed.* **Left untouched:** newsletter + status forms (newsletter promises weekly delivery →
needs the Buttondown list created OR a vendor migration — your call).
**Fix options:** (A) fix leak #1 → /api/waitlist captures (durable, no new vendor); OR
(B) create the Buttondown list (2 min, restores the external bypass for newsletter too).

### 🟡 4. TEAM CHECKOUT BUTTON WAS DEAD — *fixed in source*
Live `/pricing` (served by static `ui/public/pricing.html`) had its only paid CTA pointing at
`buy.stripe.com/teams_meok` → **403 placeholder**. **Fixed (committed + pushed):** repointed to
the live, active "MEOK ONE Team" £99/mo link (verified via Stripe API). Goes live on next deploy.
Note: page shows `$99` but Stripe charges `£99` — currency mismatch, your call.

## What I shipped this turn (4 commits to CSOAI-ORG/meok-ai main)
- `822831a` — pricing.html dead Team link → real £99 Stripe link
- `c4e3924` — scorecard lead capture → /api/waitlist (was dead Buttondown)
- (+ earlier: `4e7b299` meok-api /health route; `45d3a1c` solana-sbt untrack)

## The unlock sequence (all human-gated, ~10 min total)
1. **Lift the Vercel `/api/*` 403** (firewall/protection) → unblocks checkout, lead capture, OG.
2. **Redeploy meok.ui** (dashboard "Redeploy" — NOT CLI, per AGENTS.md) → ships the 3 source fixes
   above + the coherent two-product pricing. WAF cooldown has cleared, so the original deploy-freeze
   reason is gone.
3. **Point "Start free" at a live page** (or build /signup) → free-tier funnel opens.
4. **MEOK_MASTER_API_KEY** (the original kingpin) → Pro keystone signing + paywalled tools.
5. **Approve outbound** — 5 drafts ready in `revenue/PROSPECT_DRAFTS_2026-06-15.md` (drive to scorecard).

**Bottom line:** the storefront is back and checkout links work, but a visitor today hits a dead free-signup, a silently-dropped lead capture, and (until redeploy) a dead Team button — all sitting behind one Vercel `/api/*` 403 plus a needed redeploy. Clear those two and the funnel is open end-to-end.
