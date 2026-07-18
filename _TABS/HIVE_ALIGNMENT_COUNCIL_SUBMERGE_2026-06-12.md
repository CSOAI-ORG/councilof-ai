# 🐝 HIVE ALIGNMENT — COUNCIL SUBMERGE TASK
**SIGIL · LAW · MAPS · COMPLIANCE · DOME · COUNCIL · GUARDIAN → CSOAI Dome**
**Date:** 2026-06-12 · **Tab:** main/orchestrator · **Branch:** `feat/stripe-checkout-wiring`
**Owner:** Nick Templeman · MEOK AI Labs / CSOAI · 100% founder-owned

---

## 0. ONE-PARAGRAPH ALIGNMENT

The Council substrate is **built and committed** as a single overlay on top of the
`csoai-org-v2` Next.js site: 5 new pages (`/council`, `/council/dome`,
`/council/maps`, `/council/compliance`, `/council/law`, `/council/sigil`),
shared `CouncilNav`, and a server-side fetcher (`src/lib/meok.ts`) that pulls
live state from the `meok-api :3200` substrate. The build is green (Next 16.2.4,
all 5 pages prerendered, no UI regressions on v2). It is **NOT yet deployed to
Vercel production** — `csoai.org/council*` returns 404 across the board as of
2026-06-12 03:22 BST. The merge into CSOAI's own authority surface is the
deliverable; pushing the council into meok.ai (the distribution surface) was
deliberately not done in this pass so the source-of-truth stays on csoai.org.

## 1. THE TASK

You asked: "**MEOK SIGIL LAW MAPS COMPLIANCE DOME COUNCIL GUARDIAN but we also
want csoai to be able to use all of this**". The work: take the seven
sovereignty primitives — MEOK SIGIL (the cryptographic identity primitive),
LAW (6-region regulatory map), MAPS (the 36-node council graph), COMPLIANCE
(13 frameworks), DOME (12-domain expertise map), COUNCIL (the substrate
itself), GUARDIAN (the per-child schedule/block-game safety layer) — and
submerge them under the CSOAI Dome so csoai.org is the canonical home.

## 2. WHAT SHIPPED — VERIFIED, NOT ASSERTED

| # | Item | Commit | Repo | Live? |
|---|------|--------|------|-------|
| 1 | `/council` overview page (4-stat grid, live health) | `415520d` | csoai-org-v2 | ❌ not deployed |
| 2 | `/council/dome` — 12-domain expertise map + thresholds | `415520d` | csoai-org-v2 | ❌ not deployed |
| 3 | `/council/maps` — 36-node council graph + high-affinity bridge pairs | `415520d` | csoai-org-v2 | ❌ not deployed |
| 4 | `/council/compliance` — 13 frameworks + recent decisions | `415520d` | csoai-org-v2 | ❌ not deployed |
| 5 | `/council/law` — 6 regions (EU, UK, US, CA, APAC, GLOBAL) + Charter pivot | `415520d` | csoai-org-v2 | ❌ not deployed |
| 6 | `/council/sigil` — in-browser SIGIL encode/decode demo (225 lines) | `415520d` | csoai-org-v2 | ❌ not deployed |
| 7 | `src/lib/meok.ts` — server-side fetcher to meok-api :3200 with revalidate (60s substrate, 1h law) | `415520d` | csoai-org-v2 | bundled |
| 8 | `src/components/CouncilNav.tsx` — sticky 6-link nav (Council + Article 50) | `415520d` | csoai-org-v2 | bundled |
| 9 | Homepage Council substrate section + 4-stat grid update | `415520d` | csoai-org-v2 | bundled |
| 10 | Build: 18 routes, 5 new pages all prerendered, no v2 token regressions | `415520d` | csoai-org-v2 | green |

**Single commit hash:** `415520dfa52e1173922697ad0b8c5a509aa2387d` —
`feat(council): submerge MEOK Maps + Compliance + Law + Sigil into CSOAI Dome`.

## 3. THE ARCHITECTURE — WHAT EVERY QUEEN MUST HOLD

```
                          ┌──────────────────────────────┐
                          │         CSOAI DOME            │
                          │  (csoai.org — the body)       │
                          └──────────────┬───────────────┘
                                         │
            ┌────────────────┬───────────┼───────────┬────────────────┐
            ▼                ▼           ▼           ▼                ▼
       ┌────────┐      ┌────────┐   ┌────────┐  ┌────────┐      ┌────────┐
       │ COUNCIL│      │  DOME  │   │  MAPS  │  │  LAW   │      │ COMPLY │
       │ 36+55  │◀────▶│ 12 dom │   │ 36-    │  │ 6 reg  │      │13 frmwk│
       │ nodes  │      │ expert │   │ node   │  │ EU/UK/ │      │ EU AI  │
        ────────       │ 144    │   │ graph  │  │ US/CA/ │      │ Act /  │
            ▲          └────────┘   └────────┘  │ APAC/  │      │ DORA / │
            │                                    │ GLOBAL │      │ NIS2…  │
       ┌────────┐                                └────────┘      └────────┘
       │ GUARD- │
       │ IAN    │  per-child schedule + block-game
       │ (HM)   │  ← 5d830d6 (complete)
       └────────┘
            ▲
            │
       ┌────────┐
       │  SIGIL │  in-browser ed25519/blake3 + canonical JSON
       │(encode)│  ← /council/sigil
       └────────┘
```

**Rules (locked in this task):**

1. **CSOAI is the body** — Council/Dome/Maps/Compliance/Law/Sigil all surface
   under `csoai.org/council/*`. CSOAI-as-engine owns the canonical registry.
2. **MEOK is the surface** — `meok.ai` continues to host the consumer chat
   and the developer/MCP marketplace; the council is exposed *to* meok.ai as
   data (read-only via the same `meok-api :3200` substrate), never duplicated
   as a parallel `/council` route on meok.ai.
3. **MAP = data, DOME = picture** — the underlying graph is data
   (`meok-api :3200`); the visual map at `/council/dome` is the rendered
   surface. Two responsibilities, two owners. Don't conflate.
4. **OLM = ICRL** — old-name "Open Lattice Model" is now the
   **Internal Council Rule Language** (or "Internal Canonical Rule Language");
   use the new name in all hive comms.
5. **CouncilNav lives in `src/app/layout.tsx`** — every csoai.org page now
   carries the 6-link Council strip plus the Article 50 link.

## 4. WHAT'S NOT DONE (the honest gaps)

- **Vercel deploy.** The 5 council pages are built locally, but the production
  deploy to csoai.org hasn't happened in this pass. `csoai.org/council*` 404s
  across the board. Next step: either push `feat/stripe-checkout-wiring` to
  main → auto-deploy, or run a `vercel --prod` from this branch.
- **meok-api :3200 substrate offline.** Verified at 2026-06-12 03:22 BST —
  curl to `localhost:3200/health` returns 404. The Council pages still render
  because of the `last-known` fallback in `src/lib/meok.ts`, but the live
  numbers (36/144/55/235) won't update until meok-api is back. This is the
  same meok-api that powers `meok.ai` chat, so an outage there = Council
  staleness here.
- **Meok.ai-side exposure.** The "we also want csoai to be able to use all of
  this" part has a *partial* answer: meok-api is the same substrate csoai.org
  reads, so meok-one / sovereign-temple agents can call it directly. But
  there's no `/council` mirror route on meok.ai and there shouldn't be — CSOAI
  is the body, MEOK is the surface. If you want a "Council badge" on meok.ai
  plans that's a separate PR on `meok-one` (PRIME/ME lanes).
- **Article 50 link target.** Homepage nav added the Article 50 link but the
  target route hasn't been confirmed in this pass — needs checking on the
  next deploy.

## 5. HANDOFFS TO OTHER QUEENS

- **PRIME / meok-one lane** — if you want a `/csoai` badge on meok-one's
  settings page that says "Powered by CSOAI Council", spec the badge and
  request it via `_TABS/INBOX.md`. Don't duplicate the route.
- **MCP Fleet lane** — the `/api/a2a` registry on meok.ai should advertise
  csoai.org/council as the certification source-of-truth. Add a
  `csoai_registry_url` field to your agent cards.
- **Verticals / openmoe lane** — when you wire CTAs on csoai-platform, the
  canonical link to the council is `https://csoai.org/council`, not
  `meok.ai/council` (that doesn't exist).
- **Council substrate owner (main)** — the meok-api :3200 substrate is the
  authority for council numbers. Any node added in the substrate propagates
  to all 5 pages on revalidate (60s). Don't hardcode numbers in the React
  components.

## 6. NEXT 4 MOVES (PRIORITIZED, this lane's queue)

1. **Deploy to Vercel production** — `vercel --prod` from
   `feat/stripe-checkout-wiring` (or merge to main first if the team branch
   policy requires it). Verify `csoai.org/council/sigil` returns 200 and the
   in-browser encode/decode works. This is THE blocker — every other item
   is gated on the council being publicly addressable.
2. **Bring meok-api :3200 back up** — check `pm2 status meok-api` (or
   whatever the supervisor is), tail logs, restart. Once it's back, the 5
   council pages will live-update from the substrate. Estimate: 5 min once
   we have shell access.
3. **Article 50 link target** — confirm the target exists (likely
   `/council/law` anchor or a new `/charter` page). If missing, write a
   one-page `Charter.tsx` and add it to the CouncilNav.
4. **Council badge for meok.ai plans** — spec the badge in `_TABS/INBOX.md`
   for the meok-one lane; this is the lowest-leverage but most-visible item
   and the easiest "we also want csoai to be able to use all of this"
   win on the consumer surface.

## 7. GUARDRAILS (NON-NEGOTIABLE, every queen)

1. **CSOAI = body, MEOK = surface.** Never duplicate the Council route on
   meok.ai. Always link out to csoai.org/council.
2. **Verify before claiming live.** `csoai.org/council/*` is 404 right now.
   Any queen saying "the council is live" without a `curl -I` check is wrong.
3. **No invented numbers.** The 36 / 144 / 55 / 235 grid is real substrate
   data, not marketing copy. If a number needs to change, change it in
   meok-api, not in the React components.
4. **No CSGA / James Castle / Terranova** — severed, do not reference.
5. **Surgical git.** Never sweep another tab's uncommitted work. This commit
   only touched `csoai-org-v2/src/{app,components,lib}/`.

## 8. KEY FILES & STATE

| File | Purpose |
|------|---------|
| `csoai-org-v2/src/app/council/page.tsx` | Council overview |
| `csoai-org-v2/src/app/council/dome/page.tsx` | 12-domain expertise map |
| `csoai-org-v2/src/app/council/maps/page.tsx` | 36-node graph + bridges |
| `csoai-org-v2/src/app/council/compliance/page.tsx` | 13 frameworks |
| `csoai-org-v2/src/app/council/law/page.tsx` | 6 regions |
| `csoai-org-v2/src/app/council/sigil/page.tsx` | In-browser SIGIL demo |
| `csoai-org-v2/src/lib/meok.ts` | meok-api :3200 fetcher + revalidate |
| `csoai-org-v2/src/components/CouncilNav.tsx` | 6-link sticky nav |
| `csoai-org-v2/src/app/layout.tsx` | Mounts CouncilNav globally |
| `csoai-org-v2/src/app/page.tsx` | Homepage Council section |

Commit: `415520d` on `feat/stripe-checkout-wiring`.

## 9. HOW TO HAND THIS LANE TASKS

Best fit: csoai.org surface work, council substrate UI, SIGIL primitives,
in-browser crypto demos, regulatory maps, anything where CSOAI is the body.
Bad fit: meok-one app internals (→ meok-one lane), MCP marketplace code
(→ MCP Fleet), billing/Stripe (→ CSOAI engine tab), SOV3 brain (→ main only).

Brief format: `[goal]. Scope: [csoai-org-v2 / page or component]. Live = [curl
check]. Don't touch: [other tabs' dirs].`
