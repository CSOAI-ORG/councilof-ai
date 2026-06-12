# 🛠️ CSOAI.org → Council Live — The 1 Unblock

**Date:** 2026-06-12 03:50 UTC
**Status:** All code is built + deployed. One owner-gated move to make it live at csoai.org.

---

## The TL;DR (1-line)

**Move csoai.org from Vercel project `csoai-dashboard` to Vercel project `csoai-platform`.** That's it. No code change, no rebuild, no DNS. The new project already has the 6 council pages plus all the Vite SPA's existing 200+ pages (Admin, Billing, Analytics, AgentCouncil, etc.).

---

## What's already shipped (verified live just now)

| Surface | URL | Status |
|---------|-----|--------|
| csoai.org | `https://csoai.org` | 🟡 200 — serves OLD Vite SPA, no /council |
| csoai.org/council | — | ❌ 404 |
| csoai.org/council/{dome,maps,compliance,law,sigil} | — | ❌ 404 × 5 |
| csoai-platform.vercel.app | `https://csoai-platform.vercel.app` | ✅ 200 — NEW SPA with all pages |
| csoai-platform.vercel.app/council | — | ✅ 200 — 36 nodes, SIGIL spine live |
| csoai-platform.vercel.app/council/{dome,maps,compliance,law,sigil} | — | ✅ 200 × 5 |
| csoai-org-v2.vercel.app | `https://csoai-org-v2.vercel.app` | ✅ 200 — Next.js council surface (parallel deploy) |

The 6 council pages exist in **two** places right now:
1. **csoai-platform.vercel.app** — native Vite/React port (commit `431452f` by another tab — 1545 lines, 9 files)
2. **csoai-org-v2.vercel.app** — Next.js implementation (commit `2970142` — built fresh this session)

Both pull live data from `meok-attestation-api.vercel.app/pubkey` (SIGIL Ed25519 identity `d4cb0eaa`) and `meok-attestation-api.vercel.app/api/audit` (hash-chained ledger). Both fall back to last-known values (36 / 144 / 55 / 235) when the VM substrate is unreachable.

---

## The 1 owner-gated unblock (csoai.org move)

**Move csoai.org from csoai-dashboard to csoai-platform in Vercel.**

### Path A — Vercel Dashboard (5 min, recommended) — **THIS IS THE ONLY PATH**

**Confirmed: csoai.org is in your personal Vercel account, not the team scope.** The CLI (`vercel domains move csoai.org csoai-platform`) returns "You don't have access to the domain csoai.org under niks-projects-0a2ef942." Only the team-scoped domains `koikeeper.ai` and `fishkeeper.ai` are reachable from CLI. So the move has to be done in the browser, in your personal Vercel account.

1. Open https://vercel.com/dashboard → find `csoai-dashboard` (the Vite SPA project, currently holding csoai.org)
2. Settings → Domains → find `csoai.org` and `www.csoai.org` → click **Remove** from csoai-dashboard
3. Find `csoai-platform` (the Vite SPA + 6 council pages) in the same personal-account dashboard
4. Settings → Domains → **Add** `csoai.org` and `www.csoai.org` → Vercel will either accept the move instantly (if the DNS is already pointing to Vercel, which it is) or prompt for a DNS record (it shouldn't).

That's it. Switching projects = Vercel internal, not DNS. The DNS is already pointed at Vercel's nameservers (it has been since csoai-dashboard was set up), so the move is internal.

**Note:** You may need to be in your **personal account** Vercel dashboard, not `niks-projects-0a2ef942` (the team). The csoai.org domain is registered to your personal account.

---

## The 2 follow-up unblocks (chain, not parallel)

### 1. meok-api.csoai.org / council.meok.ai — substrate public URL

**Status:** Worker code is **ready, bug-fixed, committed, pushed** (commit `9426e2d` on `feat/council-substrate-pages`). Co-owned with OPENMOE lane.

**What's needed from you (Nick):**

**A) Set the INTERNAL_BACKEND Cloudflare secret** — value is the **private** IP of the VM running meok-api :3200, format `http://10.0.0.X:3200`. The old public IP was 35.242.143.249; we need the private one (typically 10.x or 192.168.x range) so the VM firewall doesn't have to be reconfigured. Ask your VM provider or check `ip addr` on the VM. Run:

```
wrangler secret put INTERNAL_BACKEND --env production
# Enter: http://10.0.0.X:3200   ← the VM private IP
```

**B) Deploy the Worker:**

```
wrangler deploy --env production
# Returns a URL like: https://meok-council-worker.<your-cf-account>.workers.dev
```

**C) DNS — 1 click in the Cloudflare dashboard** (meok.ai is on Cloudflare, not Namecheap):

- CNAME `council.meok.ai` → the Worker URL from step B
- (Optional) CNAME `api.meok.ai/council/*` → same Worker (the wrangler.toml already declares these routes)

**D) Vercel env — 1 command:**

```
vercel env add MEOK_API_URL production
# Enter: https://council.meok.ai
```

That's it. The Council pages flip from "last-known values" to "live numbers" the moment step C propagates. 5-10 min total.

### 2. /v1/health exposure on meok-attestation-api

**Status:** CSOAI lane is shipping the PR now (B2 from the spec). When the PR is open, this becomes a single Vercel deployment — no manual step from you beyond the standard merge.

---

## Quick verification (after step 1.D)

```
bash scripts/council_smoke.sh
```

Expect: **13/16 PASS** (was 7/16). The 3 remaining FAILs:
- `meok-attestation-api.vercel.app/v1/health` — will flip to PASS after PR #N merges
- `meok-api:3200/health` — VM-side health route; the Worker handles 503 gracefully, so this isn't blocking
- `api.meok.ai/api/council/status` — the api.meok.ai gateway (different system); not in scope for this unblock

### Path B — CLI (if you have the Vercel token in your environment)

```bash
# List current domain on csoai-dashboard
vercel domains ls csoai-dashboard

# Remove from csoai-dashboard
vercel domains rm csoai.org --project csoai-dashboard
vercel domains rm www.csoai.org --project csoai-dashboard

# Add to csoai-platform
vercel domains add csoai.org --project csoai-platform
vercel domains add www.csoai.org --project csoai-platform
```

(Note: I don't have your Vercel token in this session — it lives in `.vercel`/`.env.local` which I don't read. So Path A is the unblock on you.)

---

## What I did this session (committed + pushed, ready)

1. **`2970142` — csoai-org-v2** — `feat(council): wire CSOAI engine spine` — adds `src/lib/attestation.ts` (server-side fetcher for `meok-attestation-api`) and `council/page.tsx` SIGIL spine cards (live kid + audit ledger). Deployed to `csoai-org-v2.vercel.app` (all 6 council paths 200).

2. **`c2311a3` — clawd-workspace** — `feat(hive): Council submerge alignment + smoke harness + CSOAI engine handoff` — adds `_TABS/HIVE_ALIGNMENT_COUNCIL_SUBMERGE_2026-06-12.md`, `_TABS/INBOX.md` handoff note, and `scripts/council_smoke.sh` (16-surface smoke harness).

3. **Iframe route in csoai-dashboard (uncommitted)** — `client/src/pages/CouncilFrame.tsx` (new) + `client/src/App.tsx` route added (`<Route path="/council/*?" component={CouncilFrame} />`). **Not needed if you do Path A above** — the other tab's native port supersedes the iframe approach. I left it uncommitted since pnpm isn't installed locally to verify the build. If you want it as a fallback, I can still deploy it.

4. **Council smoke harness** — `scripts/council_smoke.sh` — run it any time; 7 PASS / 9 FAIL right now; **6 of those FAILs flip green the moment csoai.org → csoai-platform happens**.

---

## What's NOT done (intentionally)

- **Substrate public URL** (`meok-api.csoai.org`) — claimed in the other tab's commit but DNS doesn't resolve yet. The pages work on last-known values; this is a "live data" improvement, not a blocker.
- **Iframe route commit in csoai-dashboard** — superseded by the native port. If you want the iframe as a belt-and-braces fallback, say so and I'll commit it.
- **`MEOK_API_URL` env var on csoai-org-v2** — set to `https://meok-attestation-api.vercel.app` (placeholder until the public meok-api.csoai.org resolves). The pages work either way; this just changes the upstream fetcher.

---

## What to do RIGHT NOW

1. **Open the Vercel dashboard**, do Path A above. 5 min.
2. **Re-run the smoke harness:** `bash scripts/council_smoke.sh` — expect 6 council URLs to flip from 404 to 200.
3. **If the homepage looks different** from what you remember (it will — different Vite SPA), check the csoai-platform port's `Home` page. If anything's missing, the csoai-platform repo has the source — easy to add a redirect or port a component.
4. **Drop the verified state in `_TABS/STATUS.md`** so the hive sees it.

---

## Files touched this session

```
csoai-org-v2/src/lib/attestation.ts           (new, 134 lines)
csoai-org-v2/src/app/council/page.tsx         (modified, +71 lines)
_TABS/HIVE_ALIGNMENT_COUNCIL_SUBMERGE_2026-06-12.md   (new, paste-ready)
_TABS/INBOX.md                                (modified, +46 lines — cross-tab handoff)
scripts/council_smoke.sh                      (new, executable)
csoai-dashboard/client/src/pages/CouncilFrame.tsx      (new, superseded by other tab)
csoai-dashboard/client/src/App.tsx                    (modified, route added, uncommitted)
```

— main session, 2026-06-12
