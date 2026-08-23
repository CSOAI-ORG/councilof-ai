# AG-UI E2E — Handoff (2026-08-22, JEEVES)

## What was asked
"End user testing e2e — a lot of the AG UI is still behind and buggy on csoai. Get it all 100/100."

## What "the AG UI" is
The **Council Console + Council Lobby** glass overlay (`client/src/components/CouncilConsole.tsx` +
`client/src/components/lobby/*`), mounted on every page. Its pane routes: `/os`, `/gspc-scoreboard`,
`/gspc-verify`, `/gspc-arena`, `/assess`, `/watchdog`, `/academy`, `/coliseum`.

## Done (merged)
PR **#297** (`edc4293`) — 3 fixes, all on master:
1. `deploy.yml` **`cancel-in-progress: false`** → deploys queue, not cancel. Root cause of the 404 flapping.
2. `canon.json` `/honesty` marker → `council-inhouse-ft` (was stale after P0 #266 de-branding). drift-guard GREEN.
3. `vitest.config.ts` — exclude `**/e2e/**` + `**/worktrees/**`. `npm test` 3/3 (was 12/15 red).

## Done (open PR)
PR **#309** — `routes.spec.ts` + `production-surfaces.spec.ts` refreshed for the Council OS homepage
redesign (title `Council of AI`, hero `See how your AI behaves…`, nav Home/Measure/Regulation/…,
BuiltOnFooter strip removed → skipped). **Wait — this PR is E2E-only; review before merge.**

## GitHub triage (closed, superseded/stale)
`#116 `#145 `#147 `#148 `#164 `#165 `#176 `#208 (+ my earlier polluted `#291`).
Remaining open: `#186`, `#265`, `#309`.

## Root cause of "behind and buggy"
**The AG-UI code is healthy** — its live APIs all 200, every pane route exists, no placeholders, the
consent-lock is intact. The "buggy" symptoms came from **deploy churn**: the active "Council OS" lane
pushes to master every 1–2 min; each push triggers `deploy.yml`, and with `cancel-in-progress: true`
the in-flight prerender deploy got cancelled mid-run, leaving the production alias on a thin Vite shell
→ deep links 404 → drift-guard/persona-gauntlet/crawler-view/Claims-E2E flapped red.
`cancel-in-progress: false` (merged) fixes the cancellation; the wrapper's "Assert apex received
prerender" + "Recheck trailing-clobber" steps (added by the other lane) also guard it.

## Two blockers to a STABLE 100/100 — both need the OWNER
1. **The lane's continuous deploys.** Even with `cancel-in-progress:false`, the site oscillates 200↔404
   on a **seconds-timescale** — verified: curl showed `/pricing`,`/honesty`,`/library`=200 seconds before
   the CI checks read them as 404. No code fix holds green while a push lands every ~1–2 min and every
   check samples a deploy window. **Only a human stops this**: batch the lane's commits, or **revoke the
   direct-deploy Cloudflare Pages token** so only gated CI ships.
2. **tRPC = 162 `tsc` errors, architectural, NOT build-gating.** `client/src/lib/trpc.ts` imports
   `AppRouter` from `../../../server/routers`, which **does not exist**. 20+ files call procedures
   (`auth`, `council`, `admin`, `analytics`, …) on a tRPC server that was never wired (this is a static
   CF Pages site + Functions — there is no `/api/trpc` server). The build still passes (esbuild erases
   the type import). Fix = product decision: **remove tRPC** and its call sites, or **build a real tRPC
   server**. Do not half-fix.

## Verification
`npm test` 3/3 · `build:client` clean · pre-deploy smoke 11/11 · drift-guard PASS (when site not clobbered).
