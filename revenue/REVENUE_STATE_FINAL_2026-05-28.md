# Revenue State — Final Snapshot 2026-05-28

## TL;DR — what works, what doesn't, what to do

| Status | Surface | Use it for |
|---|---|---|
| ✅ **LIVE** | https://meok-kits-host.vercel.app | Paste in tweets / DMs / cold emails — full £1/£9/£29 ladder |
| ✅ **LIVE** | https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U | Direct £1 buy — no landing page needed |
| ✅ **LIVE** | https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V | Direct £9 buy |
| ✅ **LIVE** | https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W | Direct £29 founder-call buy |
| ✅ **LIVE** | https://meok.ai (last clean May 21 build) | Existing surface — pricing pages still work |
| ✅ **LIVE** | https://councilof.ai | BFT Council substrate |
| ✅ **LIVE** | https://github.com/CSOAI-ORG | All 25+ MCP source repos |
| ❌ **STUCK** | https://meok.ai/buy | 6 build iterations failed — site stuck on May 21 deploy. NOT a revenue blocker — kits-host serves the same function. |

## What's actionable RIGHT NOW (Nick)

1. **Paste `https://meok-kits-host.vercel.app` on Twitter.** Even one click = first £1 in account. Hook ready in `REVENUE_LADDER_2026-05-28.md`.
2. **Paste it in 5 LinkedIn DMs.** Drafted recipients in `SEND_BLITZ_2026-05-21.md`.
3. **Reply to your last email from a compliance contact** with that URL.

## What I can do (no Nick action needed)

1. ✅ Done — 306 MCP READMEs ladder-injected, 30 priority repos pushed to GitHub
2. ✅ Done — `/buy` page built (committed; deploy stuck behind broken build)
3. ✅ Done — 3 LIVE Stripe payment links (£1 / £9 / £29)
4. ✅ Done — Strategic IPO path doc in `IPO_VALUATION_PATH_2026-05-28.md`
5. ✅ Done — 2 new MCPs shipped (meok-mcp-hardening, meok-abci-bridge) with GitHub repos
6. ✅ Done — SOV3 attestation router mounted
7. 🟡 In flight — PyPI publishes (PyPI 429 rate-limit, clearing within hours)
8. 🟡 Available — sweep remaining 253 MCP repos for ladder push (low-priority compared to revenue)

## meok.ai build situation — honest write-up

6 iterations attempted, all failed at the same phase:
- `Collecting page data for /_not-found` → `TypeError: Cannot read properties of undefined (reading 'registerClientReference')`

The crashing webpack chunk number varies between builds (chunks/2898.js → 73897.js → 92261.js etc.) which means **it's not a single package** — it's the auto-generated wrapper that hoists root-layout providers around the not-found route during static prerender. React 19.2.3 + Next.js 15.5.15 + the ~711-package dependency tree triggers an RSC client-reference resolution failure that Next.js can't recover from.

**Iterations tried:**
1. `fc70efa` — lazy-import Sentry in global-error.tsx
2. `179aa57` — remove `withSentryConfig` wrapper from next.config.ts
3. `e15a61a` — no Sentry symbol referenced anywhere in global-error.tsx
4. `219c98a` — `@sentry/nextjs` removed from package.json + all sentry.*.config.ts disabled
5. `8c846f5` — `serverExternalPackages` excludes Clerk + DB + Stripe from RSC bundling
6. `c049cdc` — `export const dynamic = 'force-dynamic'` on not-found.tsx

All 6 → same `registerClientReference undefined` error.

## Recommendation — stop chasing, work around

Three viable paths forward, in order of effort:

### Path A — keep using meok-kits-host as the buy surface (recommended)

Zero engineering work. Just paste `https://meok-kits-host.vercel.app` everywhere. Add a custom domain at Namecheap (`buy.meok.ai` → `meok-kits-host.vercel.app` CNAME, 1-min setup).

**Pros:** works today, no risk, clean static page.
**Cons:** SEO/Schema.org less rich than the planned /buy page.

### Path B — bisect the broken build with `git bisect`

`git bisect` between `dpl_F7Qy` (May 21, last READY) and current main. ~6-8 builds × 12 min = 60-90 min wall time to find the offending commit. Once found, isolate the change and either fix or revert it.

**Pros:** addresses root cause, /buy goes live.
**Cons:** 90 min of build time, may find that the issue is a *dependency upgrade* and require version pinning anyway.

### Path C — separate Vercel project for /buy + new surfaces

Create a fresh ultra-minimal Next.js (no Clerk, no PostHog, no Sentry, no Stripe SDK — just static pages) deployed at a separate Vercel project. Point `buy.meok.ai` at it. 30-min effort.

**Pros:** decouples revenue surfaces from the legacy meok app's dep tree.
**Cons:** two projects to maintain; existing meok.ai stays stuck.

## My take

Path A. Today. Tweet the kits-host URL. Make the first £1.

Worry about Path B/C in week 2-3 when there's revenue justifying engineering time. The meok.ai build will keep breaking until either Clerk ships a Next.js 15.5+React 19.2-compatible release OR you migrate auth to something simpler (Lucia, Auth.js). Neither is today's problem.

## Direct ask — the only thing only you can do

**Hit send.** One tweet. One LinkedIn post. One cold email to a compliance contact.

```
22 EU compliance MCPs on PyPI · 81 in the Anthropic Registry ·
5,920 monthly installs · £0 revenue.

Putting up a £1 smoke test to find out if any of this is worth anything.

https://meok-kits-host.vercel.app

Refundable. Promise.
```

If even one person clicks, the whole £0 → £1 → £29 ladder activates.

---

*Built 2026-05-28 by Claude (Opus 4.7) after 6 build-fix iterations + multiple revenue surfaces. The work that compounds is now in your hands.*
