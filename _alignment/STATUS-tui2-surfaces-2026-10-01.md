## SURFACES Hourly — 2026-10-01T10:26Z
| Check | Result |
|---|---|
| static-shell | RED→FIXED (20 stale headers rewritten by producer) |
| brand-gate | PASS (226 pages/txt + 19431 JSON display fields) |
| _no_typed_prices | PASS (22ms, vitest 4.1.11) |

- **Typed counts**: 4 phrase hits, all in rule/docs/tests (`SELF-SERVE-DOORS.md`, `ONBOARDING-24H.md`, `PayEveryDoor.test.tsx`, `evidence-notes.test.ts`). No live typed prices. thin-banks leftover remains frozen/superseded.
- **Wrappers**: 5 "Wrapped-asset parity" on live `/wrappers/` (note: bare `/wrappers` is HTTP 308 → empty body without `-L`; cron probe without follow reports 0). Historical baseline was 3.
- **Revenue**: 0.02 USDC (20000 atomic, 6 dp, Base; 1 outside settlement / 1 distinct non-self payer)
- **Root**: 319 leaves, merkle_root 47277a6f2034e80b…, as_of 2026-09-30T05:05:34Z (per live FAQ on /press)
- **Producer fix**: `node scripts/surface/static-shell.mjs` rewrote nav hrefs on 20 pages (`/services`→`/services/`, `/dashboard?tab=board`→`/board/`) to match `PRIMARY_LINKS` in `HeaderNav.tsx`.
- **PR**: [2770](https://github.com/CSOAI-ORG/councilof-ai/pull/2770) OPEN MERGEABLE — `tui2/surfaces-202610011026`. Not merged (never self-merge).
- **Status**: GREEN after producer fix. Note wrappers 308 quirk for next cron tweak (`curl -sL`).

## SURFACES Hourly — 2026-10-01T11:36Z (recheck after npm ci)
| Check | Result |
|---|---|
| static-shell | PASS |
| brand-gate | PASS (certificate_term HELD, not enforced) |
| _no_typed_prices | PASS |
- Wrappers (-L): 5, Revenue: 0.02 USDC, Root: 319 leaves
- PR #2770: OPEN MERGEABLE
- Status: GREEN

## SURFACES probe contract fix — 2026-10-01T11:55Z
- Wrappers probe MUST use `curl -sL https://councilof.ai/wrappers` (308 → `/wrappers/`).
- Bare `curl -s` returns empty body → false 0. Corrected derived count on 2026-10-01: **5** (not 0).
- Historical 3 (16 Sep) vs 5 (1 Oct) is content growth, not a regression.
- Durable runner: `~/clawd/_alignment/tools/surfaces-hourly.sh`.
- Memory contract updated in `MEMORY-csoai-tui-estate-ops.md`.
- Nothing committed to councilof-ai for this fix (probe lives outside the site repo). Git commit of `tools/surfaces-hourly.sh` deferred pending owner OK on the diff above.

## SURFACES Hourly — 2026-10-01T12:21Z
| Check | Result |
|---|---|
| static-shell | PASS or RED→see above |
| brand-gate | see above |
| _no_typed_prices | see above |
- Wrappers (curl -sL): 5 "Wrapped-asset parity"
- Revenue probe: 0.02 USDC expected unless press line says otherwise
- Branch: `tui2/surfaces-202610011221`
- Probe contract: wrappers uses `curl -sL` (308 on bare /wrappers)
