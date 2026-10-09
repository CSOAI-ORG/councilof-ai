# CSOAI watchdog schedule handover — 21 September 2026

## Result

An audit-only replacement watchdog was built and tested, but **the active crontab was not changed**.

The attempted `crontab <file>` install hung before returning. It was terminated, and a fresh `crontab -l` readback confirmed that the original legacy schedule remains active. No partial replacement was observed.

## Verified audit-only tool

- Script: `/Users/nicholas/.local/bin/csoai-watchdog-audit`
- SHA-256: `d1b57d28c312c78dda9927abeac78b006d6c563f6c55b3d8b2488873a172e17b`
- Receipt directory: `/Users/nicholas/.local/state/csoai-watchdog-audit/`
- Latest tested receipt: `/Users/nicholas/.local/state/csoai-watchdog-audit/latest.json`
- Tested under the cron PATH and HOME environment at 2026-09-21T17:46:48Z: passed.
- Scope: public unauthenticated GET probes plus `runpodctl pod get` only.
- It does not use SSH, GitHub, signing, deployment, publishing, restarts, payment, wallet, or source-repository writes.
- It records the RunPod control-plane state only; it deliberately reports worker-process state as `not_inspected`.

## Active schedule: unchanged

Current legacy line, confirmed by readback:

```cron
*/5 * * * * cd /Users/nicholas/clawd/councilof-ai-work/harness/mine && /Users/nicholas/.local/bin/uv run python3 watchdog_asi_v2.py >> /tmp/watchdog_asi_v2_mac.log 2>&1
```

The legacy program can SSH, restart remote services, and dispatch a GitHub workflow on failure. It also contains an undefined `harnesses_alive` variable in its main path.

## Prepared replacement: not installed

```cron
*/5 * * * * /Users/nicholas/.local/bin/csoai-watchdog-audit >> /tmp/csoai_watchdog_audit.log 2>&1
```

## Scheduler backup and rollback

- Pre-change crontab backup: `/Users/nicholas/.local/state/csoai-watchdog-audit/crontab.before-watchdog-replacement-20260921T174458Z`
- Backup SHA-256: `7fa10a46c3bd105b860d62676e9ab5ee902991f4eb9166dee678c43224ac301c`
- Rollback after a future successful schedule change: `crontab "/Users/nicholas/.local/state/csoai-watchdog-audit/crontab.before-watchdog-replacement-20260921T174458Z"`

Do not retry the write blindly: it previously hung. First resolve the local crontab-service/write issue, then install the prepared one-line replacement and immediately verify it with:

```sh
crontab -l | rg 'watchdog_asi_v2|csoai-watchdog-audit'
env -i HOME=/Users/nicholas PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin SHELL=/opt/homebrew/bin/bash /Users/nicholas/.local/bin/csoai-watchdog-audit
```
