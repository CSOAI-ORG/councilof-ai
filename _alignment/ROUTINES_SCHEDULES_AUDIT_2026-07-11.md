# 🗓️ ALL ROUTINES & SCHEDULES — full sweep, SOV33 backend (M4, 2026-07-11)

Every scheduler on Nick's Mac + the OCI VM, in one place. **Four independent systems** run cron-like
work. Honesty register applied — dead ≠ hidden.

## 0. SOV33 backend core — LIVE ✅ (now DURABLE)
- **SOV3 `:3101`** — HEALTHY v2.0.0, **313 MCP tools**, 6 neural NNs. Now owned by a launchd KeepAlive
  keeper (§below) so it survives crash + reboot. Was dying every session teardown before.
- **OCI micro VM** `145.241.232.16` — HEALTHY `sov33-emergence.service` (tick 22+, sovereign-bound,
  care-floor OK, Ed25519 sigils). The always-free/always-on substrate.

## 1. launchd (macOS) — 92 meok/sov3/csoai agents (was 86 loaded, 21 failing)
### 1a. 🔴 DEAD-GCP-VM tunnels — crash-looping KeepAlive → REMOVED (6)
All point at dead `meok-backend`/`35.242.143.249` (GCP billing CLOSED). KeepAlive restarted them forever
against an unreachable host = constant CPU/heat (the launchd-sprawl overheat pattern). **Booted out all 6**
(king-vm-tunnel, m2-bridge, m2-vm-bridge, ollama-tunnel-vm, sov3-vm-tunnel, ssh-reverse-tunnel). 0 residual
ssh procs after. Plists kept on disk → reversible when billing returns.
### 1b. 🟠 Ollama / local-temple config errors (78 = EX_CONFIG) — 4 (documented, not auto-pruned)
### 1c. 🟡 ops.* python jobs exit 2 — 6 (care-mission 600s, gamification 300s, coverage-audit/elder-care/evidence-vault/regulator-export). Noisy, low-CPU. Triage root cause next.
### 1d. 🟡 `ops.olm-health` (127) → DISABLED — its `optimize-sovereign-olm.sh` is gone from disk; OLM-router training now runs inside the hardened federation-refresh, so redundant.
### 1e. ✅ Healthy load-bearing: meok-backend :8000 (Hermes' OS backend — don't kill), meok-mcp, x402, sov3-auth-proxy, sov3-eternal-loop (1800s), sov3-daily-federation-refresh (@3am), ops.scorecard/daily-e2e/daily-git-commit, d9-pond-auto, daily-sov3-sigil.

## 2. crontab — ~40 lines (⚠️ duplicates + dead infra)
- **DUPLICATED (dedupe):** auto-fire-emails, daily-sov3-sigil, weekly-indexnow, jeeves-full-auto, jeeves-all-day-batch, sovereign_api.py --demo — each listed twice.
- **Dead infra:** ssh2.vast.ai GPU probe (fails soft), king/VM ssh mirrors of the dead tunnels.
- **Live/useful:** `_oci/a1_retry.sh` (*/15 grabs 24GB A1 when capacity frees), haulage-autopilot, gaming-empress revenue (*/15), meok-guardian (*/2), sovereign-24-7 (*/5), memory prune/VACUUM @3am, daily eurlex/competitive/revenue/aeo, hermes-* shifts.

## 3. Claude scheduled-tasks (`~/.claude/scheduled-tasks/`) — 18 tasks ⚠️ STALE
All `enabled:true` but **17/18 last ran ~2026-06-20** (3 weeks stale — the scheduler daemon isn't firing
them). Only `meok-os-overnight-batch` ran recently (2026-07-11). Heavy OVERLAP with launchd ops.* jobs
(scorecard/uptime/morning-briefing exist in BOTH) → duplication across schedulers is the real hazard.

## 4. Claude session crons (CronCreate) — none. Dynamic /loop — none active.

---
## Consolidated verdict
- **3 overlapping scheduler systems** (launchd 92 · crontab ~40 · Claude-tasks 18), duplicated intent.
  Over-scheduled, not under. Real cost = dead-GCP crash-loopers (fixed). Real gap = durability + dedup.
- Nothing load-bearing needs GCP except the dead tunnels — everything real is Mac + OCI + Vercel.

## Actions this session
1. ✅ SOV3 `:3101` made **CRASH/REBOOT-DURABLE**. Root cause: `run-local.sh` ran inside tracked shells;
   every teardown killed it. Built foreground launcher `sovereign-temple/sov3-serve.sh` (same env: .env +
   keystone overlay + postgres + PYTHONPATH, but `exec`s the server so launchd owns the pid) + one throttled
   KeepAlive keeper `com.meok.sov3-keeper` (RunAtLoad + KeepAlive + ThrottleInterval=30 — no crash-loop
   hammering, respects the overheat lesson). **Hard-tested: `kill -9` → keeper auto-revived it healthy, 313
   tools, ppid=1.** Net launchd this session: −6 tunnels −1 olm-health +1 keeper = **−6**.
2. ✅ `sov3-daily-federation-refresh` hardened VM-independent (VM-reachability gate; local ingest 1282 sources
   / catalog 371 servers / vault 18391 files still run; skips dead-VM push/pull instantly vs 30s hangs).
3. ✅ Booted out 6 dead-GCP-VM KeepAlive tunnels + disabled broken olm-health.
4. ✅ **Disabled the whole exit-2 `ops.*` cluster (6 jobs)** — gamification(300s)/care-mission(600s)/
   coverage-audit/elder-care/evidence-vault/regulator-export all point at `meok/scripts/auto-*.py`
   scripts that are **gone from disk** → failed every fire (gamification every 5 min). Same dead-script
   class as olm-health. Plists kept → reversible if the scripts are restored.
5. ✅ **Crontab deduped** — removed 3 exact-duplicate lines (auto-fire-emails, daily-sov3-sigil,
   weekly-indexnow each fired twice). 81→78 lines, 0 unique jobs lost. Backup: `_infra/cron-backups/`.
6. ✅ **Disk reclaim — was at 100% (166 MB free)**, which was degrading the whole backend (postgres/SOV3
   need scratch) and blocking the J-space model download. Purged pure caches (pip 722M, Cypress 623M,
   brew, HF partial) → **1.5 GB free**. ⚠️ Data volume still ~100% capacity — the big reclaim
   (OrbStack ~34G stale VM disk) needs Nick via the OrbStack UI, not `rm`.

**Net launchd change this session: −13 dead agents (6 tunnels + olm-health + 6 exit-2) + 1 durable keeper = −12.**
The estate is materially leaner and cooler; the one canonical backend is now the only KeepAlive process that matters.

## ⚠️ Architectural finding — TWO SOV3 tool-sets diverge
`run-local` `:3101` exposes the **hermes/k25 build** (313 tools: hermes_ask/hermes_research/k25_analyze_image…).
The federation-refresh verify + "arcana" tail calls `mcp_federation_catalog`/`sigil_emit`/`bootstrap_agent`/
`federate_command`/`schedule_task`/`reflect_on_history`/`lapis_dashboard` — the federation build that ran on
the dead VM. They need reconciling to one canonical `:3101`. Core refresh value (ingest/catalog/train) unaffected.

## Owner-gated / next
- Reopen GCP billing → §1a tunnels + VM brain return (Nick's money).
- Dedupe crontab (6 dup lines); collapse scorecard/uptime/briefing to ONE scheduler each.
- Reconcile the two SOV3 tool-sets to one canonical build.
