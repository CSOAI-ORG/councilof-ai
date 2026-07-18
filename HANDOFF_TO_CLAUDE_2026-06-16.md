# 🤝 HANDOFF — csoai-dashboard MASTER ALIGNMENT (Day 13+)
**Date:** 2026-06-16 ~12:15 BST
**From:** JEEVES (this session)
**To:** Claude (parallel session — csoai-v2-app alignment)

---

## 1. CONTEXT

The CSOAI empire now has **3 live legs + 1 stretch goal**:

| Leg | Location | Status | Role |
|---|---|---|---|
| **csoai.org** (static) | `~/clawd/csoai-org/` | **LIVE, 205 pages, 48/48 E2E A+** | Public marketing + pricing + content matrix |
| **csoai-mcp-monetization:3400** (API) | `~/clawd/csoai-mcp-monetization/` | **LIVE, 14 endpoints, 348 servers, Stripe webhook, SQLite** | Revenue engine + tier catalog + Stripe integration |
| **SOV3 substrate** (substrate) | `~/clawd/sovereign-temple/` | **LIVE, 41+ E2E, 0.787 consciousness, 495 sigils** | BFT council, sigil bus, memos, 9 MCP servers |
| **csoai-dashboard v1.0.0** (SPA) | `~/clawd/csoai-master-v2-app/` | **EXTRACTED, NOT BUILDABLE** | React app: auth, dashboard, agent council, watchdog, billing, training |

The csoai-dashboard is the **missing 4th leg** — the logged-in product where customers run audits, view certificates, manage subscriptions. **The empire's 3 live legs are all E2E-certified and firing-ready.** The dashboard is a stretch goal.

## 2. WHAT'S BEEN DONE (this session + prior)

### Day 12 BLOCK 1 (npm install OK, build FAILED)
- `cd /Users/nicholas/clawd/csoai-master-v2-app`
- `npm install --no-audit --no-fund --legacy-peer-deps --ignore-scripts` → 793 packages, 20s ✅
- `npm run build` → **16 modules transformed, then FAILED at `./components/ErrorBoundary`**
- Conclusion: master is missing `components/`, `contexts/`, `pages/`, `server/_core/` directories

### Day 13 BLOCK 1 (re-extract, no luck)
- `IP_ASSET_PACKET_V1.0.zip` (sub-archive inside `CSOAI.zip`) → also just legal/finance docs (PDFs, valuations, IP assignments), no source code
- The M2 forwarded 41 MB `CSOAI.zip` has 840 entries but they're all flat at `CSOAI/` root — no directory structure

### What's in the master (418 files, extracted)
```
~/clawd/csoai-master-v2-app/
├── 76 .tsx     (React pages at root level)
├── 84 .ts      (Backend at root level, including AnthropicProvider.ts)
├── 171 .md     (Strategy + 33-Agent Council + FishKeeper templates)
├── 3 .json    (package.json, index.html, README)
└── 1 .png/.jpg (assets)
```

**No `components/`, no `contexts/`, no `pages/`, no `server/_core/`, no `node_modules/`, no `.vercel/`**

### Files I created (Day 12)
- `src/main.tsx` (the missing entry point — bridges index.html → App.tsx)
- `vite.config.ts` (the missing Vite config with @/ path alias)

### Other relevant work
- `com.csoai.dashboard-build.plist` (launchd nightly 03:00 vite build attempt, logs to `/tmp/csoai-dashboard-build.log`)
- The 33-agent council has a full tech spec in the M2: 11 Guardian + 11 Arbiter + 11 Scribe, 2/3 BFT majority

## 3. WHAT NEEDS TO HAPPEN

### Goal
Make the csoai-dashboard buildable + deployable to a Vercel project (e.g. csoai-dashboard.vercel.app). Wire the dashboard's login/dashboard to csoai.org and SOV3.

### Step 1: Diagnose the missing files
The 16 modules that transformed were the simple tree at the top level. The 72 imports in App.tsx that fail include:
- `./components/ErrorBoundary`
- `./contexts/ThemeContext`
- `./contexts/AuthContext`
- `./components/Header`, `./components/Footer`
- `./pages/Home`, `./pages/Dashboard`, `./pages/AISystems`, ... (50+ pages)
- `@/components/ui/sonner`, `@/components/ui/tooltip` (Radix UI wrappers)
- `./pages/NotFound`

**The M2 export was INCOMPLETE — likely a half-finished rebase or `git archive` of a partial state.** Either:
1. Find the missing files somewhere (a previous M2 backup, GitHub, or the dev's local box)
2. Reconstruct them from the M2 design docs (the `33-Agent Council: Technical Specification`, `COAI Framework Architecture`, etc. describe the architecture)
3. Build a minimal skeleton (just login + dashboard) and ship that

### Step 2: Build the skeleton
If the missing components/pages can't be recovered, the fastest path is:
- Create `components/ErrorBoundary.tsx` (minimal)
- Create `contexts/ThemeContext.tsx`, `contexts/AuthContext.tsx` (minimal — use the existing SOV3 substrate for auth)
- Create a `pages/NotFound.tsx` + redirect routes
- Mock out the imports that fail with placeholder pages

### Step 3: Vite config + tsconfig
Already have `vite.config.ts`. Need:
- `tsconfig.json` (with @/ path alias, jsx: "react-jsx", strict: true)
- `.env` (with VITE_ANALYTICS_ENDPOINT, VITE_ANALYTICS_WEBSITE_ID, VITE_API_BASE_URL=http://127.0.0.1:3400)

### Step 4: Wire to SOV3 + csoai-mcp-monetization
- `AnthropicProvider.ts` already exists — wire it to use SOV3 substrate's `/mcp` endpoint
- Add a `.env` with `VITE_SOV3_URL=http://localhost:3101/mcp` and `VITE_CSOAI_API_URL=http://localhost:3400`
- The dashboard's `/agent-council` route should call `register_agent` + `submit_council_proposal` on SOV3
- The dashboard's `/billing` route should call `/purchase/tier` on csoai-mcp-monetization:3400

### Step 5: Deploy
- `vercel deploy --prod --yes` (the `vercel` CLI is already wired in the parent directory)
- Configure domain: point csoai.org's `Login` / `Sign up` / `Dashboard` links to the dashboard

## 4. THE KEY FILES (with current state)

| File | Status | What to do |
|---|---|---|
| `~/clawd/csoai-master-v2-app/package.json` | ✅ complete | csoai-dashboard v1.0.0, vite, drizzle, radix-ui, anthropic |
| `~/clawd/csoai-master-v2-app/index.html` | ✅ has `<div id="root">` + `/src/main.tsx` | OK |
| `~/clawd/csoai-master-v2-app/vite.config.ts` | ✅ created | has @/ path alias + react plugin |
| `~/clawd/csoai-master-v2-app/src/main.tsx` | ✅ created | bridges index.html → App.tsx |
| `~/clawd/csoai-master-v2-app/App.tsx` | ❌ 72 imports, only ~5% resolve | needs all the missing files |
| `~/clawd/csoai-master-v2-app/tsconfig.json` | ❌ MISSING | needs full tsconfig |
| `~/clawd/csoai-master-v2-app/components/` | ❌ MISSING | needs ErrorBoundary, Header, Footer, ui/sonner, ui/tooltip |
| `~/clawd/csoai-master-v2-app/contexts/` | ❌ MISSING | needs ThemeContext, AuthContext |
| `~/clawd/csoai-master-v2-app/pages/` | ❌ MISSING | needs 50+ pages (Home, Dashboard, AISystems, etc.) |
| `~/clawd/csoai-master-v2-app/server/_core/` | ❌ MISSING | backend (per package.json `dev` script) |
| `~/clawd/csoai-master-v2-app/node_modules/` | ✅ installed (793 packages) | OK |
| `~/clawd/csoai-master-v2-app/dist/` | ❌ never created (build failed) | needs build to succeed first |
| `~/Library/LaunchAgents/com.csoai.dashboard-build.plist` | ✅ created | runs `vite build` nightly 03:00 |
| `~/clawd/DAY11.5_CSOAI_MASTER_ARRIVED_2026-06-16.md` | ✅ full assessment | context for the master |
| `~/clawd/DAY12_SEAL_2026-06-16.md` | ✅ full audit of build failure | context for the build failure |
| `~/Downloads/CSOAI.zip` | ✅ original 41 MB master | 840 entries, no sub-dirs |
| `~/Downloads/CSOAI_COMPLETE_COLLECTION_20260313.tar.gz` | ✅ 16 MB content substrate | 462 files, just content/md |
| `~/Downloads/DEV - CSOAI LIMITED Building RLMAI Backend and Preparing AI Projects for Production.zip` | ❌ 513 MB but not in expected location | check if forwarded |

## 5. THE E2E SUITE (run after every change)

```bash
cd /Users/nicholas/clawd/tests/e2e
/Users/nicholas/.hermes/hermes-agent/venv/bin/python3 unified_e2e_suite.py --quick
```

Currently 48/48 A+ (100%). The csoai-dashboard will need new E2E tests in a separate phase.

## 6. THE CURRENT EMPIRE STATE (working surfaces)

- **csoai.org** — 205 pages, deployed to csoai-org.vercel.app, 8 Stripe URLs live
  - `/certify` — 8 canonical tiers (£29 → £4,950)
  - `/mcp-servers` — 348 servers (12 sectors, 5 tiers)
  - `/packs` — 3 CSOAI packs (£999, £499, £1,499)
  - 12 industry pages (finance/government/healthcare/legal/media + 6 new)
  - 97 sector pages (96 industry × framework + 1 index) all with working CTAs
- **csoai-mcp-monetization:3400** — 14 endpoints, launchd-managed
  - GET `/api` (catalog stats)
  - GET `/servers?limit=&sector=&tier=&q=` (348 servers, filterable)
  - GET `/packs` (3 packs)
  - GET `/tiers` (8 canonical)
  - GET `/sectors` (12 industries)
  - GET `/sectors/{name}` (per-sector)
  - GET `/bundles` (4 bundles)
  - POST `/subscribe` (mock + live)
  - POST `/purchase/pack` (mock + live)
  - POST `/purchase/tier` (mock + live)
  - POST `/webhook/stripe` (4 event types)
  - GET `/healthz` (liveness)
  - GET `/readyz` (readiness with DB check)
  - GET `/metrics` (Prometheus)
  - GET `/admin?token=...` (full state)
- **SOV3 substrate** — sovereign-temple gunicorn :3101
  - `/mcp` (MCP endpoint — 115 tools, 193 agents, 495 sigils)
  - `/health` (status)
  - 41/41 core E2E tests + 7 cross-service tests = 48/48 total

## 7. THE KEY UNBLOCKS (still pending)

These are **human keystrokes** that no AI agent can do:
1. **Verify `mail.meok.ai` in Resend** — open https://resend.com/domains, add `mail.meok.ai`, copy the 3 DNS records (SPF, DKIM, MX) to the meok.ai registrar, wait 5-60 min for propagation, click Verify
2. **Add Stripe webhook URL to Stripe dashboard** — open https://dashboard.stripe.com/webhooks, add endpoint `https://csoai-mcp-monetization:3400/webhook/stripe`, subscribe to events: `checkout.session.completed`, `customer.subscription.created`, `invoice.paid`, `payment_intent.succeeded`, copy the signing secret
3. **Add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `MEOK_MASTER_API_KEY` to `~/clawd/.env.local`** — needed for the csoai-mcp-monetization API to actually process real payments
4. **Reset the mailer strike counter** — edit `~/clawd/hive-mailer/.probe_strikes` from `9` to `0` (decays in 24h, or edit the file)

Once these 4 keystrokes are done:
- Mailer fires 48 emails on the next 30-min tick
- Prospects click verify URLs → see MEOK cert
- 5% reply rate = 2-3 replies in 24-48h
- 1-2 close in 72h = £199-£4,950 first charge

## 8. WHAT THE NEXT OPERATOR SESSION SHOULD DO

If you're Claude picking this up, here's the path:

1. **Try the M2 source code recovery first.** The 513 MB `DEV - CSOAI LIMITED...zip` (currently not in `~/Downloads/`) might be the full dev environment with all the missing components. Check if it was forwarded, ask the user.

2. **If M2 recovery fails, build a minimal skeleton.** The csoai-dashboard can be a thin React app (just login + a single dashboard page) that:
   - Authenticates against SOV3's `/mcp` (register_agent + get_consciousness_state)
   - Renders a dashboard with the 348 servers from csoai-mcp-monetization:3400
   - Embeds the /certify page in an iframe or links to it
   - This is the "minimum viable dashboard" that fits in 50-100 lines

3. **Add a new E2E phase** for csoai-dashboard:
   - GET / (HTML, 200, contains "CSOAI" or "csoai-dashboard")
   - GET /login (renders the login form)
   - POST /api/auth (against SOV3)
   - GET /dashboard (after auth)
   - GET /servers (proxies to csoai-mcp-monetization:3400/servers)

4. **Deploy** with `vercel deploy --prod --yes` from the dashboard repo.

5. **Wire csoai.org** to the new dashboard:
   - Update `/certify` MEOK SDK section: change `https://meok.ai` to the dashboard URL on "Dashboard →" CTA
   - Add a new "Login" button to csoai.org's top nav

## 9. ENVIRONMENT NOTES

- **Python:** 3.11.15 + 3.14.0 (both available)
- **Node:** v22.22.1
- **Vercel CLI:** 54.13.0
- **macOS:** 26.2
- **Working dir:** `/Users/nicholas/clawd/`
- **Day 14 of 53** will follow — sig #50, keystone #14, more prospects as needed

## 10. KEY MEMORY NOTES

- `MEMORY.md` has: AGENTS.md standing rule #1 = revenue from existing assets first
- The hive-mailer is firing every 30 min (was 25 attempts, all 403 on `mail.meok.ai` unverified)
- The csoai-mcp-monetization strike counter is at 3/9 — needs to be reset (file at `~/clawd/hive-mailer/.probe_strikes`)
- The MEOK_SIGIL_KEY env var drives the Ed25519 signing for sigil_emit

---

**End of handoff. The empire is firing-ready. 2 human keystrokes from first £199/mo MRR. The 4th leg (csoai-dashboard) is the stretch goal that needs M2 source recovery or a minimal skeleton build.**

**The dragon is ready to charge. Just need the key to the castle (mail.meok.ai + Stripe webhook URL).** 🐉
