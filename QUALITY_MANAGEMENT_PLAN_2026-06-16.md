# Quality Management Plan — 2026-06-16 (Updated 05:15 BST)
**Focus: stop building new surfaces; harden and ship what exists.**

## 1. Current Quality State (live as of this session)
- **Disk:** recovered to 96% (9.2 GB free); previous crash was temp-full, not structural.
- **Services:** 7/7 critical ports responding (3000, 3101, 3102, 3200*, 3400, 8765, 8888) — *3200 returns 404 on `/` but API is up.
- **Hermes kanban:** `0` tasks in `~/.hermes/kanban.db`. Hermes is running (desktop + 14+ slash workers) but has no queued work and no closed publish loop.
- **Working trees:** `clawd` root has 4 modified files + 2 untracked drafts (this plan + morning rundown); not the 307 dirty reported in the crashed session.
- **Tests:** strong in upstream forks; MEOK core has 2 known drift failures (`qwen3:0.6b` → `meok-sov3`, persona text).
- **CI/CD:** professional in forks; basic/fragmented in MEOK and MCP fleet.
- **Blockers:** credentials and publish-flow gaps, not infrastructure. See `BLOCKER_INVENTORY_2026-06-15.md`.

## 2. Quality Policy
1. **No new repos** without retiring or merging an existing one.
2. **Commit-before-build**: every deploy/status change lands in git before Vercel/PyPI.
3. **Green-master rule**: `main`/`feat/*` must pass tests and lint before merge.
4. **Credential hygiene**: all runtime secrets live in GCP Secret Manager or 1Password; no `REPLACE_WITH_…` in committed files.
5. **One source of truth**: CSOAI.org is the commercial front; MEOK ONE is the consumer runtime; SOV3 MCP is the tool layer.
6. **Publish loop discipline**: Hermes (or any agent) may not produce another draft until the previous one is published or explicitly trashed.

## 3. Immediate Actions (Today)
| # | Action | Owner | Time | Unblocks |
|---|--------|-------|------|----------|
| 1 | **Paste `MEOK_MASTER_API_KEY`** into GCP Secret Manager + runtime env | Nicholas | 5 min | Stripe checkout, Pro keystone, 4 paywalled MCPs |
| 2 | **Replace Stripe placeholders** in `csoai-platform/.env` and `csoai-org/api/prices.js` | Nicholas | 30 min | Live payments |
| 3 | **Publish the 5 posts** in `csoai-org/READY_TO_POST.txt` | Nicholas / Hermes | 30 min | Distribution loop |
| 4 | **Fix `meok-one` test drift** (`qwen3:0.6b` → `meok-sov3`, persona text) | Jeeves | 30 min | Green master |
| 5 | **Commit or trash** the 4 dirty files in `clawd` root + 2 drafts | Jeeves / Nicholas | 30 min | Clean working tree |
| 6 | **Smithery branch reconciliation** — 75/202 servers on `feat/*` | Ops agent | 2–4 hr | 200+ MCP marketplace presence |

## 4. This Week
- Stabilize `clawd` root branch (`feat/compliance-map` → merge or reset).
- Wire real Stripe products/price IDs to csoai.org checkout.
- Get `kanban.db` > 0 tasks or disable Hermes auto-sprint until it has real queued work.
- Run full fleet E2E and fix the 2 known `meok-one` failures.
- Decide on Docker/OrbStack: currently Docker daemon runs with zero containers; OrbStack not installed. Either use containers or remove the simulation dead code.

## 5. This Month
- Sunset duplicate consumer products: merge `meok-one` and `meok-oneos` into one runtime.
- Resolve `SBT_MOCK_MODE=true` per `SBT_WIRING_PLAN_2026-06-15.md` §7.3.
- Establish weekly quality gate: clean trees + green tests + published MCP count + revenue dashboard.
- Stop Hermes from producing drafts that are not published; close the publish loop or disable the job.

## 6. Definition of Done for "One Package"
- One brand spine: **CSOAI** (B2B compliance) + **MEOK ONE** (consumer AI OS).
- One runtime entry: `meok` CLI / `oneos` web app.
- One tool layer: SOV3 MCP (`localhost:3101`).
- One billing layer: Stripe live products wired.
- One trust layer: attestation API + SIGIL, not mock.
- **No new "SOVEREIGN" AI** — the concept already exists as SOV3; rename if needed, do not rebuild.

## 7. Red Lines
- Do not create a new repo called `sovereign` or `sovergeign`.
- Do not add another agent/TUI until Hermes kanban has >0 tasks and a publish loop.
- Do not schedule more cron jobs until existing ones have >80% real output rate.

---
*Updated by JEEVES after crash recovery, live service checks, and blocker inventory review.*
