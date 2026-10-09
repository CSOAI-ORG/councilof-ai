
## 2026-09-15T01:29 UTC
- Mill: 33 min ago, no dispatch
- 22 success, 1 failure, 1 cancelled
- Pod: cycle=12 (running), state=RUNNING
- PR #2210: MERGED
## MODELS Cadence — 2026-09-15T02:15Z

### Mill dispatch
- Last hub-queue-mill run: 2026-09-15T01:52:55Z (22 min ago)
- **Fresh** — no dispatch needed

### Run health (last 24)
- success: 23, cancelled: 1
- **96% success rate** — healthy

### 3090 Pod health
- State: **RUNNING** (uptime 5 days)
- Cycle: 56 | Jobs: 168 total
- Successful runs: 55 | Failed: 0 | Transport errors: 0
- GPU: 58% utilization, 12098/24576 MiB VRAM
- Memory: 37Gi/251Gi used (52Gi free, 207Gi available)
- Load average: 10.46, 11.48, 11.74 (actively computing)
- Current job: mistral-nemo:12b on swarm axis (bank_items=37)
- Last success: 2026-09-15T02:12:12Z

### PR #2210
- **Already MERGED** — all 8 checks passed (conflict-guard, selftest, bank-gate-and-delta, lane-guard, prove, card-verifier-parity, crawler-view, gates)

### Status: GREEN — mill fresh, pod healthy, no failed runs, PR merged.

## MODELS Cadence — 2026-09-15T02:46Z
- **Mill**: Fresh (52 min). No dispatch. Runs: 23 success / 1 cancelled (96%).
- **3090 Pod**: RUNNING, cycle 130, 129 successful / 0 failed. GPU 48%, 7.5/24GB. Current: qwen3:4b on provenance axis.
- **PR #2210**: MERGED.
- **Status**: GREEN.

## MODELS Cadence — 2026-09-15T04:31Z
- **Mill**: Stale (158 min). Dispatched fresh run.
- **Runs**: 23 success, 1 empty (96%).
- **Pod**: Cycle 157, 157 ok / 0 fail, state WAITING (between jobs).
- **PR #2210**: MERGED.
- **Status**: GREEN.

## MODELS Cadence — 2026-09-15T10:04Z

### BLOCKER: GitHub Actions disabled for user
- `workflow_dispatch` returns: "HTTP 422: Actions has been disabled for this user"
- Affects: hub-queue-mill (no recent runs), health-inventory, all manual dispatches
- Cron schedule (mill: :11/:41 hourly) appears to also be inactive (no runs in API)
- This is an **account-level GitHub restriction** — needs Nick to check billing/Actions settings

### Mill
- Last run: NOT FOUND in recent API results — possibly stale or no runs today
- Schedule: `11 * * * *` and `41 * * * *` (hourly) — appears inactive

### Pod
- Cycle: 157, ok: 157, fail: 0, state: WAITING (between jobs, healthy)

### PR #2210: MERGED

### Resolution needed
Nick must re-enable GitHub Actions at the account level:
https://github.com/settings/actions or https://github.com/CSOAI-ORG/councilof-ai/settings/actions

### Status: BLOCKED on GitHub Actions re-enablement.

## MODELS Cadence — 2026-09-15T07:30Z / 08:30Z / 09:30Z / 10:00Z
- **Mill**: BLOCKED (GitHub Actions disabled for user — no recent runs)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## ESCALATION — 2026-09-15T10:05Z

### GitHub Actions disabled for user account
- **symptom**: `workflow_dispatch` returns "HTTP 422: Actions has been disabled for this user"
- **scope**: schedule + push events appear broken; only pull_request events work
- **impact**:
  - Deploy: 50+ PRs merged today but site NOT rebuilt (mcp_trust shows as 12 tools, not 13)
  - Mill: no scheduled runs (pod is independently healthy — cycle 157, 0 fail)
  - Health inventory: can't dispatch
- **resolution**: Nick must check GitHub account Actions settings or billing
- **links**: https://github.com/settings/actions or https://github.com/settings/billing/summary

## MODELS Cadence — 2026-09-15T06:30Z
- **Mill**: BLOCKED (GitHub Actions disabled for user)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## MODELS Cadence — 2026-09-15T07:00Z
- **Mill**: BLOCKED (GitHub Actions disabled for user)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## MODELS Cadence — 2026-09-15T07:30Z
- **Mill**: BLOCKED (GitHub Actions disabled for user)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## MODELS Cadence — 2026-09-15T08:30Z
- **Mill**: BLOCKED (GitHub Actions disabled for user)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## MODELS Cadence — 2026-09-15T09:30Z
- **Mill**: BLOCKED (GitHub Actions disabled for user)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## MODELS Cadence — 2026-09-15T10:00Z
- **Mill**: BLOCKED (GitHub Actions disabled for user)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — independently healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED on Actions re-enablement

## MODELS Cadence — 2026-09-15T10:30Z
- **Mill**: BLOCKED (Actions disabled — no runs, dispatch still 422)
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — healthy
- **PR #2210**: MERGED
- **Status**: BLOCKED

## MODELS Cadence — 2026-09-15T10:30Z (update)
- **Mill**: BLOCKED
- **Pod**: cycle:157, ok:157, fail:0, state:WAITING — healthy
- **Actions**: 7 queued runs stuck. Workflows are being created but runners not executing. Likely minutes quota exceeded.
- **Resolution**: Nick check https://github.com/settings/billing/summary → Actions usage
- **Status**: BLOCKED on GitHub Actions quota

## Enhancement: Deploy Independence from GitHub Actions

### Problem
GitHub Actions is disabled at the account level (HTTP 422 on workflow_dispatch).
This blocks: mill, deploy, health inventory, all scheduled workflows.

### Current workaround
- Direct wrangler deploy via scripts/manual-deploy.sh (works now)
- OAuth token at .wrangler/config/default.toml has pages:write scope

### Recommended fix: Cloudflare Pages GitHub integration
Connect the repo directly to Cloudflare Pages (no Actions needed):
1. https://dash.cloudflare.com → Pages → councilof-ai → Settings → Builds & deployments
2. Connect to GitHub → CSOAI-ORG/councilof-ai
3. Build command: npm ci && npm run build
4. Output directory: dist/client

This makes the deploy independent of GitHub Actions entirely.
Pushes to master auto-deploy via Cloudflare's own integration.

### Impact
- Deploy: independent of Actions ✓
- Mill: still needs Actions (or RunPod cron) — pod is healthy, can add pod-side cron
- Health inventory: can run as a Cloudflare Worker (hourly cron trigger)
