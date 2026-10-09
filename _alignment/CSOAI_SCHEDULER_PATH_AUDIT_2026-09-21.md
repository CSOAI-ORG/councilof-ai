# CSOAI Scheduler Path Audit — 21 September 2026

## Scope

This is a read-only investigation of the reported `crontab <file>` hang. It did **not** alter the active crontab, restart cron, edit source, start or stop any service, or contact a remote worker.

Observed at: 2026-09-21T17:55Z–18:57Z  
Account: `nicholas` (uid 501)

## Finding

The macOS cron **daemon is running** and the current account can read its crontab promptly. The available evidence does **not** prove the precise cause of the reported installer hang, because reproducing `crontab <file>` would mutate the live schedule and was outside this audit.

The evidence rules out several common explanations:

| Check | Result | Meaning |
|---|---|---|
| `/usr/sbin/cron` | Running as LaunchDaemon `com.vix.cron`, PID 535 | Cron itself is not stopped. |
| `crontab -l` | Three successful reads in 3.6–7.6 ms | Current account is allowed to access its table; reads are healthy. |
| Installed table | 17,184 bytes, SHA-256 `7fa10a46c3bd105b860d62676e9ab5ee902991f4eb9166dee678c43224ac301c` | The active table still contains the legacy watchdog line. |
| Candidate replacement | 17,113 bytes, SHA-256 `df8053c2a9692e4344ca743e5289d3c64401c90b5bfecffd4de958b629d4262a` | The audit-only candidate was prepared but is not installed. |
| Spool directory | `/usr/lib/cron/tabs` is root-owned, mode 0700, mtime 20 September 03:27 | That protection is normal; the setuid `crontab` installer writes there. It is not accessible directly to this user. |
| Disk | 3.5 GiB free on the writable data volume | No disk-full signal. |
| Access controls | `cron.allow` absent; `cron.deny` lists only `Guest` | No observed access-control denial for this account. |
| Candidate schedule | `*/5 * * * * /Users/nicholas/.local/bin/csoai-watchdog-audit …` has five cron fields plus command | The replacement line is structurally valid. |
| Unified log | Installer invocations show only normal user lookup; no documented error, denial, or install-completion record | The log cannot distinguish a write request that the calling tool terminated from a setuid/spool-path stall. |

## What is actually still scheduled

The active crontab continues to launch:

```
*/5 * * * * cd /Users/nicholas/clawd/councilof-ai-work/harness/mine && /Users/nicholas/.local/bin/uv run python3 watchdog_asi_v2.py >> /tmp/watchdog_asi_v2_mac.log 2>&1
```

That legacy watchdog is not audit-only. Its current source contains remote SSH restart commands and a GitHub workflow dispatch. Its recent log shows repeated SSH timeouts and GitHub 401 errors. It also contains a correctness defect: line 153 refers to `harnesses_alive`, which is not defined.

None of those behaviours was modified in this audit. The failed candidate replacement therefore must **not** be described as active.

## Safe alternative: a parallel user LaunchAgent

A user-level `launchd` scheduler is available and proven on this Mac without touching cron:

- Existing job: `ai.csoai.gspc-execution-readiness`
- Source plist: `/Users/nicholas/clawd/councilof-ai-work/condor/launchd/ai.csoai.gspc-execution-readiness.plist`
- It has a valid plist, `StartInterval = 60`, and launchd reports 2,338 completed runs with last exit code 0.

The prepared executable at `/Users/nicholas/.local/bin/csoai-watchdog-audit` is static-checked:

- Python compilation passed.
- It uses only unauthenticated public GETs and `runpodctl pod get`.
- It contains no SSH, GitHub, restart, deployment, publication, signing, payment, or wallet command.
- SHA-256: `d1b57d28c312c78dda9927abeac78b006d6c563f6c55b3d8b2488873a172e17b`.

A distinct LaunchAgent could run that executable every five minutes and write local receipts. It would coexist with the legacy cron line; it would **not** change, silence, or repair the legacy watchdog.

## Recommended one-step owner gate

Authorize exactly this bounded change:

> Create and bootstrap one user LaunchAgent named `ai.csoai.watchdog-audit` that runs only `/Users/nicholas/.local/bin/csoai-watchdog-audit` at a five-minute interval, with local stdout/stderr logs and no `KeepAlive`. Do not alter the current crontab.

Expected plist location:

```
/Users/nicholas/Library/LaunchAgents/ai.csoai.watchdog-audit.plist
```

Required behaviour:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ai.csoai.watchdog-audit</string>
  <key>ProgramArguments</key><array>
    <string>/Users/nicholas/.local/bin/csoai-watchdog-audit</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StartInterval</key><integer>300</integer>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>/tmp/csoai_watchdog_audit.log</string>
  <key>StandardErrorPath</key><string>/tmp/csoai_watchdog_audit.err.log</string>
</dict></plist>
```

After that single approval, the installer should:

1. validate the plist with `plutil -lint`;
2. bootstrap only that label in `gui/501`;
3. read the first JSON receipt from `~/.local/state/csoai-watchdog-audit/latest.json`;
4. verify the active crontab hash remains `7fa10a46…`.

## Separate future decision

A parallel LaunchAgent supplies a safe receipt path but does not stop the legacy cron job from attempting obsolete SSH and GitHub actions every five minutes. Disabling or replacing that cron line is a separate owner decision and was deliberately excluded here.

## Bottom line

Use launchd for the new audit-only scheduler. Do not retry the current `crontab <file>` installation without a controlled, owner-authorized mutation capture. The present evidence supports a privileged installer-path problem or caller termination, but does not identify which one.

