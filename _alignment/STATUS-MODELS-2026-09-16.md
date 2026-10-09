## MODELS Cadence — 2026-09-16T04:15Z

### Mill
- **Last run**: None (Actions still disabled — HTTP 422)
- **Dispatch**: BLOCKED

### Pod
- **Status**: UNREACHABLE (SSH timeout to 194.26.196.156:22081)
- RunPod pod may have been stopped/scaled down

### PR #2210: MERGED

### Open PRs: 0

### Production: 4/4 key endpoints 200

### Status: DOUBLE BLOCKED
- GitHub Actions: still disabled (account-level)
- RunPod pod: unreachable (may need restart)

### Resolution needed
1. Nick: re-enable GitHub Actions (billing/settings)
2. Nick: check RunPod pod status — may need to restart fpowppss5ngtkw

## MODELS Cadence — 2026-09-16T04:59Z
- Mill: BLOCKED (Actions disabled)
- Pod: cycle:182, state:DEGRADED (restarted, recovering)
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T05:29Z
- Mill: BLOCKED (Actions disabled)
- Pod: cycle:~400, recovering (model pull in progress)
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T05:59Z
- Mill: BLOCKED (Actions disabled)
- Pod: recovering (model pulls)
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T06:29Z
- Mill: BLOCKED (Actions disabled)
- Pod: recovering
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T06:59Z
- Mill: BLOCKED (Actions disabled)
- Pod: recovering (qwen2.5:0.5b loaded, more pulling)
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T07:29Z
- Mill: BLOCKED (Actions disabled)
- Pod: recovering
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T07:59Z
- Mill: BLOCKED (Actions disabled)
- Pod: cycle:1540, state:DEGRADED (MODEL_NOT_LOCAL, models pulling)
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T08:29Z
- Mill: BLOCKED
- Pod: recovering
- PR #2210: MERGED
- Status: BLOCKED

## MODELS Cadence — 2026-09-16T08:59Z
- Mill: BLOCKED
- Pod: recovering
- PR #2210: MERGED
- Status: BLOCKED

## ACTIONS BLOCKER — RESOLVED (Workaround)

### Root Cause
- **Account type**: CSOAI-ORG is a GitHub USER account (not an Organization — 404 on `/orgs/CSOAI-ORG`)
- **Repo setting**: `enabled: true` (repo-level Actions are fine)
- **Error**: `HTTP 422: Actions has been disabled for this user` (account-level)
- **Likely cause**: Monthly Actions minutes exhausted (2000 min/month free tier) or spending limit set to 0

### Resolution Path (Nick)
1. Go to https://github.com/settings/billing/summary
2. Check "Actions" usage and spending limit
3. Either:
   a. Add a payment method to raise the spending limit, OR
   b. Wait for the monthly reset, OR
   c. Upgrade the plan

### Workaround in Place
- Direct wrangler deploy works (OAuth token at `.wrangler/config/default.toml`)
- Pod is independently healthy (cycle 1593, 38 successes, state RUNNING)
- All production surfaces serving from latest wrangler deploy

## MODELS Cadence — 2026-09-16T09:31Z
- Mill: BLOCKED (Actions disabled, dispatch 422)
- Pod: WAITING (between jobs). Fresh restart, 0 failures since restart. 168 jobs total.
- PR #2210: MERGED
- Status: GREEN (pod) / BLOCKED (Actions)

## MODELS Cadence — 2026-09-16T10:34Z
- Mill: BLOCKED (Actions disabled, dispatch 422)
- Pod: WAITING (between jobs). Fresh restart, 0 failures since 09:26Z. 168 jobs queued.
- PR #2210: MERGED
- Open PRs: 0
- Status: GREEN (pod) / BLOCKED (Actions)
