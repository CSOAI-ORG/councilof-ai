# GHA billing 422 — OWNER GATE (this lane cannot spend)

## State
GitHub Actions is account-level disabled (HTTP 422 on workflow_dispatch / pr-gates / deploy.yml).
Every open PR is gate-starved. Live production still serves; deploy cannot run.

## Why agent cannot do this
Hard rule: **never spend, never sign.** GitHub Actions re-enable is a billing / spending-limit
control at https://github.com/settings/billing/summary. Money path = owner only.

## Exact owner steps (≈2 min)
1. Open https://github.com/settings/billing/summary (org **CSOAI-ORG** if prompted)
2. Check **Actions** spending limit / disable state
3. Re-enable Actions (or raise spending limit if that's the 422 cause)
4. Confirm workflow_dispatch works:
   ```bash
   gh workflow list --repo CSOAI-ORG/councilof-ai
   gh workflow run deploy.yml --repo CSOAI-ORG/councilof-ai   # or pr-gates
   ```
5. Tell the agent `GHA UNBLOCKED` so pr-gates + deploy can resume

## Until then
- Merges use mergeStateStatus CLEAN with empty checks (owner-authorized squash path already used)
- Do not claim green gates
- Deploy stays blocked (DEPLOY-LOCK: GHA on master only)

## Related owner money gates (same freeze)
- Zenodo appeal (DOI)
- RunPod pod keep/stop
- Paid directory listings (Toolify $99 etc.) — freeze
