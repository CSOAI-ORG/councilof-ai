# Claude lane — week plan, 2026-11-02 → 2026-11-08

**Doc ID:** `csoai.claude-lane-week-plan/0.1` · operator: claude (M4) · horizon: DAYS
**Alignment:** re-sequences `CSOAI-WORK-PLAN-YEARS-TO-DAYS-2026-10-28.md` rows still open and
engineering-closable. Nothing here invents priorities; every row names its close test and its
dependency. Doctrine unchanged: measurement-not-certification · states, never zeroes · append,
never edit · the judge is never the subject · a lock is not a grade.

## 0. Standing rules for the week (so unattended runs stay safe)

1. **PR-only.** `master` is protected; every landing is a branch + PR + green gates. No force to
   master, ever.
2. **Commit fast.** The shared M4 checkout runs a sync automation that restores uncommitted
   files to origin HEAD — observed twice on 2 Nov. Anything not committed within minutes can be
   lost. Long edits happen in a throwaway clone (`/tmp`), then land by push.
3. **Stamped bytes are untouchable by hand.** Producer artefacts regenerate via their own
   script + restamp (`surface/stamp_file.py`, `ots_manifest_rebuild.py`, `gen_sbom.py`) — never
   manual edits.
4. **Other lanes' surfaces are read-only** (codex research-evidence cycle, consolidation waves,
   the pod publishers). Conflicts go to `LANE_COORDINATION.md` as appended notices, never as
   byte counter-attacks.
5. **Owner-gated rows are observed, never faked** (B7 HF token, B17 signing bearer, D21 RunPod
   volume). The lane files dated observations on them; it does not simulate progress.

## 1. The week, in parallel tracks

### Track A — evidence truth passes (daily, ~15 min, automation 10:00)

| day | work | close test |
|---|---|---|
| daily | witness drift re-check: if `checked_at` is >6h stale or status ≠ MATCH, re-run `witness_public_root.py --recheck` and PR the pointer | pointer dated ≥ current root, status MATCH |
| daily | ledger controls + UNVERIFIABLE reread refresh as the hunt's ledger grows | `ledger_controls.py --verify` passes; reread regenerated when row counts move |
| daily | capsule-index staleness observation (W2 remains Oracle-gated) | dated observation file in `docs/operations/`, exit honest |
| daily | producer truth passes when gates hold: OTS manifest, SBOM, reviewed-stream | the three producer gates green on the lane's PRs |

### Track B — open engineering rows (2–4 each day, PR each)

| day | work | close test |
|---|---|---|
| Mon | **W9 survey** — inventory every published artefact and its 60-second stranger path; write `docs/operations/COLD-START-STRANGER-PATHS.md` with a table: artefact → command a stranger runs → PASS/FAIL/UNCHECKABLE | the survey exists with ≥20 artefacts measured, failures named |
| Tue | **W9 fixes batch 1** — the top FAIL rows from Monday's survey, each is a one-line README/pointer repair | re-run survey: those rows PASS |
| Wed | **D17 watch + keep** — fin-attestation gate stays green; if the signer lane lands run-artefact signatures, flip the gate's expectation to require them | gate 8/8; zero drift events |
| Thu | **W4/W5 refresh PR** — regenerate both artefacts from the grown ledger; supersession table updated | counts match the served ledger of that day |
| Fri | **week close-out** — re-run the whole local suite (`npm test` + guards), triage anything red into fixed-or-filed, append the week's coordination report | suite green; coordination entry posted |

### Track C — estate alignment (the owner's ask: all agents off the local disk)

| day | work | dependency |
|---|---|---|
| Mon | **RunPod-first proposal posted** to LANE_COORDINATION: lanes keep working trees on RunPod pod workspaces (`/workspace/lanes-<lane>/`), the M4 shrinks to orchestrator + credentials | **D21 must close first** — the pod network volume loses writes (owner console act). Until then RunPod working trees are NOT safe and this lane says so |
| Mon–Tue | **compute alignment**: measurement/eval batches target HF CPU (free tier) and Kaggle GPU/CPU sessions per the estate's existing mirror lanes; batch jobs carry their own receipts | B7 (HF_TOKEN secret) still blocks mirror re-spray — observed, not worked around |
| Wed | **local disk hygiene PR**: `git gc` + prune merged branches + worktree prune on the M4 checkout (525 MB today); report the 6.8 GiB-free state to the owner queue — the shortfall is NOT in this checkout, so the reclaim target is elsewhere (owner rows B14/B15) | — |
| Thu | **Desktop Commander wiring** — the DC MCP endpoint (mcp.desktopcommander.app) is confirmed with three devices online since 2026-10-07; wiring remains blocked on the owner's one-time Authorize click. This lane remains ready; the block is owner-gated and re-observed in the Friday report | owner act |

### Not worked this week (stated, so absence is honest)

- **W2 rebuild** — Oracle-cron-gated; daily staleness observation only (Track A).
- **W6 Busabase off-pod copy + restore drill** — needs the pod store over SSH and D21 still open.
- **W7/W8, M-rows** — owner-gated or larger than the DAYS horizon.

## 2. Unattended operation ("goal mode")

Two scheduled runs in the operator's ZCode session drive Track A + PR/CI watch daily at 10:00
and 18:00, using exactly these rules. The owner is putting up fence; the lane must not need him.
Anything that would need an owner act gets filed as a dated observation, never as silent drift.

## 3. What this document is not

Not a certification of coverage; not a claim the estate converges without the owner rows
(B7/B17/D21) closing; not authority to touch other lanes' surfaces or DNS.
