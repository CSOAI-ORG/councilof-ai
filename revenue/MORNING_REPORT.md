# MORNING STATUS — prepared overnight while WOLF print runs

Generated: 2026-04-21, overnight. Print still running (~16h at start).

---

## ✅ DONE TONIGHT

### 1. Five sendable cold emails in `~/clawd/revenue/drafts/`
Each is a polished, personalized draft with Stripe payment links inline. Open, copy, paste into Gmail, hit send.

| File | Company | To: | Stripe CTA(s) |
|------|---------|-----|---------------|
| `01_beamery.md` | Beamery (HR-Tech) | abakar@beamery.com | £5K + £499/mo + £199 |
| `02_tractable.md` | Tractable (Insurance AI) | alex@tractable.ai, venkat@tractable.ai | £5K + £499/mo |
| `03_multiverse.md` | Multiverse (EdTech) | hello@multiverse.io | £5K + £499/mo |
| `04_zopa.md` | Zopa (Fintech) | *** find CTO on LinkedIn *** | £5K + £499/mo |
| `05_clearscore.md` | ClearScore (Fintech) | hello@clearscore.com | £5K + £499/mo |

**Morning action:** 15 minutes, 5 emails sent. Use LinkedIn Sales Navigator for Zopa CTO if you have it, otherwise press@zopa.com + direct CTO outreach on LinkedIn DM.

---

## ⚠️ FINDINGS — act on these

### Issue 1: Landing page is live but Google-invisible
**`eu-ai-act-landing-*.vercel.app`** is up, serving the compliance checker with working Stripe CTAs. Good.

**BUT** response header has `x-robots-tag: noindex` — Google will not crawl or rank it.

**Fix (morning, 2 min):**
```bash
cd ~/clawd/eu-ai-act-landing  # or wherever the source is
# Remove noindex from vercel.json / next.config.js / _headers
grep -rn "noindex" .
# Delete or change to "all,index,follow"
git commit -am "fix: allow search indexing on landing page"
git push
```

Otherwise **no organic traffic will ever find this page** — all revenue depends on you manually pointing people to the URL.

### Issue 2: No custom domain on the landing page
Current URL: `eu-ai-act-landing-4oblzcm3g-niks-projects-0a2ef942.vercel.app` — ugly, long, low-trust for cold emails.

**Fix:** Add a custom domain (e.g. `compliance.meok.ai` or `euaiact.meok.ai`) in Vercel → Domains. If meok.ai DNS is on Cloudflare/Vercel, this is a 5-minute setup + automatic SSL.

Once the domain is live, update `LIVE_PAYMENT_LINKS.md` and all 5 cold email drafts to reference the custom URL instead.

### Issue 3: MEOK main site has 3 consecutive failed builds
Project `meok` (prj_nnxvKjfuBMIDdjGNmedkJuCPKzoL) — last 3 production deploys are in `ERROR` state. Same commit built successfully 4 deploys back, so this is likely flaky infra (OpenTelemetry/Sentry webpack warnings showed up, full failure is further in the logs).

**Current state:** Branch alias still points to the last successful build (dpl_C8uY9d9iiLQeKfi83nZTCDmdvBWE), so the site is UP — but new commits won't deploy until this is fixed.

**Fix (morning):**
```bash
# Check full build logs
vercel logs <last-failing-deployment-url>
# Or inspect at: https://vercel.com/niks-projects-0a2ef942/meok/9rCB1wjXuA9jbNwf1gdMoA53oBGH
```
Common culprit: Sentry `global-error.tsx` + OpenTelemetry dependency. Try disabling Sentry instrumentation for the build, or pin `@sentry/nextjs` to a stable minor.

---

## ❌ BLOCKED / ASKS

### Gmail MCP — needs reauth
Tried to create drafts directly in your Gmail. Connector returned: *"This connector requires additional permissions. The user needs to reconnect it."*

**To enable for future sessions:** Claude Code → `/mcp` → find Gmail → reauth with `nicholas@csoai.org`. Google OAuth popup, grant Gmail scopes, no password needed. Once done, I can draft + send on your behalf.

### Ahrefs MCP — insufficient plan
Tried keyword research for EU AI Act content ranking. Plan doesn't include keywords-explorer.

**Workaround:** I can do free SERP-style research tomorrow using web fetches if you want, or skip SEO research entirely.

---

## 🎯 MORNING PRIORITY ORDER (90 min total)

1. **Fix noindex on landing page** (2 min) — unblocks all organic traffic
2. **Add custom domain to landing page** (10 min) — trust signal for emails
3. **Send the 5 cold emails** (15 min)
4. **Fix MEOK deploy failure** (30 min) — check build logs, pin Sentry
5. **Reauth Gmail MCP** (2 min) — so tomorrow's drafts go straight into your inbox
6. **Check on WOLF print** — Plate 5 (planet gears ~3h) next

---

## 🖨️ PRINT STATUS (what I know)

- Started overnight, ~16h remaining at prep
- Plate: 6 WOLF gear core parts in PA12-CF (ring gears A+B, outer rings A+B, front+back plates)
- After this: Plate 5 (planet gears, ~3h) → Plate 7 (assembly test) → first working WOLF actuator

See `project_wolf_print_progress.md` in memory for the full queue state.
