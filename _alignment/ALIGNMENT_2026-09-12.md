# ALIGNMENT 2026-09-12 — Eight-TUI Goal Mode + Mac→3090 Evacuation

**Issued by:** Nick (owner) · **Logged by:** JEEVES (Kimi TUI) · **Supersedes:** ALIGNMENT_2026-09-09.md where conflicting.

## Owner orders executed today

1. **Mac→3090 evacuation ("move ALL unneeded to RunPod 3090").** Mac disk 552Mi → 41Gi free.
   Archive root: pod `fpowppss5ngtkw` `/workspace/mac-evac-20260912/` (byte-verified before local deletion).
   TUI cutover done: `dsh-tmp/` + `worktrees/` deleted after push/rescue verification.
   - `tui1/health-redirects` pushed to origin (was local-only).
   - Diverged coai-shallow commit rescued to `rescue/coai-shallow-20260912`.
   - TUI relaunch point: pod `/root/tui/coai` (fresh clone @ 8c3ef57e8).
   - Protected untouched: `~/.hermes` (standing order), `.cache/uv`, `~/Pictures`, live hermes gateway.
2. **Eight-TUI Goal Mode brief issued** (full text in session; digest appended to LANE_COORDINATION.md).
   Lane map TUI1..TUI8; merge order 1→(2-6)→7→8; coordination via `docs/hermes/EXECUTION-LEDGER.json`.

## JEEVES repairs found during audit

- **Pod crontab was broken:** 5 daily intel jobs (eurlex, competitive-scan, revenue-snapshot,
  aeo-rank, dashboard) migrated with Mac paths that exist nowhere → silently dead. FIXED:
  repointed to `/workspace/sovos-agent/scripts/`, eurlex `cd` patched, smoke test exit 0.
- **Pod /workspace 97% DISK CRITICAL** (watchdog firing every 2 min). Safe reclaim exhausted —
  remaining big dirs carry unpushed commits / uncommitted WIP from other lanes. OWNER DECISION:
  RunPod volume resize vs Sep-10-wave triage.
- **CI:** `pr-gates` failing on PR homepage-public-records-posts (truth gate: unreviewed historic
  blog claims). Owning lane to fix.

## Verified live facts (runtime, this session)

- Public root: **169 leaves**, merkle `94e99db52a67931a…`, as_of 2026-09-11T12:45:44Z,
  signed under `did:web:csoai.org#board-attestation-1`. (Brief checkpoint `a6f79e25…` superseded.)
- x402: discovery doc live (v2, exact, Base 8453, facilitator+signing configured, mode=live);
  challenge endpoint returns correct 402. Settlement untested (no payment authorization).
- Surfaces: councilof.ai/api/gspc 200 · meok.ai 200 · cobolbridge.ai 200 · csoai.org 308 (verify target).
- Mill: gspc-worker healthy (cycle 210+, 0 failed runs, playlist cycling; GPU duty-cycles normally).

## In flight (JEEVES)

- EXECUTION-LEDGER.json bootstrap PR (TUI-1 infrastructure).
- Three IETF drafts (AUDIT use-case / agent-log tampering / agentproto delegation) — drafting for
  owner review; posting stays owner-gated.
- A100 pod stays EXITED (cost). 3090 KEEP RUNNING.

## Nick gates (unchanged + new)

- Posting IETF drafts / any external comms / any crypto spend / paid compute.
- Pod volume resize OR Sep-10 evac triage decision.
- `sovereign.wiki` DNS, vast.ai box verification (long-standing).
