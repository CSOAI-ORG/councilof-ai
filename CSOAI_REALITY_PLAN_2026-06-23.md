# CSOAI → Reality: Master Staged Plan (2026-06-23)

> Goal: one canonical csoai.org (= `csoai-v2-app` / `~/councilof-ai`), every claim real
> ("always build real"), wired to the live hive, all sprawl retired. Owners: **[ME]** I do it ·
> **[NICK]** needs your credential/dashboard/VM access · **[DONE]** already real.
> THE CRITICAL PATH is Stage 0 — nothing is publicly live until it's cleared.

## STAGE 0 — Unblock the deploy  ⟵ the one thing blocking everything
- **[NICK] Fix the Vercel Framework Preset.** `csoai-v2-app` project is set to `framework: "vite"` (confirmed via API; latest deploy = ERROR "no public output dir"). Dashboard → `csoai-v2-app` → Settings → Build & Development → Framework Preset → **Next.js** → Save. 30 seconds. Until this, the merged site cannot deploy no matter what.
- **[ME]** Once flipped: trigger a clean preview, confirm green prod build (375 pages).

## STAGE 1 — Ship the one canonical site
- **[NICK]** Set env vars on `csoai-v2-app`: `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`STRIPE_PRICE_*`, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DISCORD_WEBHOOK_URL`, `DATABASE_URL`, `ATTESTATION_API_URL`, `IDENTITY_API_URL`, `POLICY_API_URL`.
- **[NICK]** Merge `absorb-all-sites` → `master` (project auto-deploys from master) OR `vercel --prod` from `~/councilof-ai`.
- **[NICK]** Move the `csoai.org` domain off the old `csoai-org` project onto `csoai-v2-app` (dashboard).
- **[ME]** Verify apex live: `/sovereign-town` 200 + live numbers, `/frameworks/*` render real prose, redirects fire.
- **[NICK]** Retire `csoai-org-v2` + old static `csoai-org` projects (keep one canonical).

## STAGE 2 — Make every claim real (honesty register · "always build real")
- **[DONE]** `csoai-kimi-bridge` built real (`~/csoai-kimi-bridge`, MCP round-trip verified, live data).
- **[NICK]** Publish it: `npm publish` + create `github.com/CSOAI-ORG/csoai-kimi-bridge` + push. (Makes the `/kimi-bridge` page true.)
- **[ME]** Act on the Layer-0/protocols audit (in flight): for every vaporware claim (fake `npm install`/repo/endpoint on `/a2a`, `/x402`, `/did`, `/mcp`, `/opengrid`, etc.) → **build the real thing** or de-hype the page. No false install command ships on csoai.org.
- **[ME]** Final claim-sweep before go-live: every advertised package/repo/endpoint resolves.

## STAGE 3 — Backend & hive integration (Layer 0 becomes real)
- **[DONE]** Sovereign Town live signed feed wired into the site + the kimi-bridge.
- **[ME]** Wire `/verify` + attestation across surfaces to one canonical authority (the signed ledger), per the DB-reconciliation plan (write-through, email identity_map).
- **[ME/NICK]** Optional council upgrade on the VM: env-gated `COUNCIL_BRAIN=claude` (Opus 4.8 judge). Council already emits `attestable` correctly — low urgency. VM write = NICK go.
- **[ME]** Layer-0 "what it needs to be real" (from audit): a real protocol/registry backend + signed protocol attestations if the pages promise it.
- **[ME]** One signed feed = the single source of truth every surface + hive reads (no hardcoded numbers).

## STAGE 4 — Verify, align, retire sprawl
- **[ME]** E2E re-audit against the LIVE apex (not a preview).
- **[ME]** DB reconciliation Phase 1: cert issuers write through to the attestation ledger.
- **[NICK]** Consolidate Vercel projects toward your 195→6 target; delete the dead csoai variants.
- **[ME]** Keep this plan + the canonical-site/feed pointers in the shared workspace + memory so every TUI/hive aligns.

## STAGE 5 — Live & ongoing
- **[ME]** Verification gate as standing practice: nothing fundraising/GTM-facing goes external without a 🟢/🟡/🔧 check.
- **[NICK/ME]** Scheduled feed refresh (publish_status into the launchd sync) so numbers never drift.
- **[ME]** Monitor: redirects, sitemap indexing, the live feed freshness.

---
### Reality check: what's already real vs what's a gate
- **Built & verified:** merged site (375 pages + verifier + honest copy), audit fixes, the kimi-bridge.
- **Pure gates (you, ~10 min total):** Vercel preset → env vars → merge/deploy → domain move → npm/GitHub publish.
- **Critical path:** Stage 0 first. Everything downstream is ready and waiting on it.
