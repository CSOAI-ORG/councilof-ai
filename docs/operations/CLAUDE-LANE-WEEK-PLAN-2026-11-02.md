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

### Track C — estate alignment (REVISED 2026-11-04: RunPod → HuggingFace Spaces/buckets)

**Direction change, owner-confirmed:** compute and storage move from RunPod to **HuggingFace
Spaces + HF datasets as buckets**. The estate's own tooling already serves this: the spray lane
publishes the board snapshot to the `csoai/gspc-board` dataset and the ONE living Space
(`csoai/gspc-board`), and `scripts/runpod_gspc_push_to_hf.py` carries pod runs to the private
intake dataset (`csoai/runpod-gspc-intake`) with an atomic transport contract. The RunPod-first
proposal of 2 Nov is superseded; **D21 (the pod volume) stops gating this lane** — the lane's
durable outputs now land on HF, not on the failing pod volume. (D21 stays open for the pods
themselves; it just no longer blocks this lane.)

| day | work | state |
|---|---|---|
| Mon | **B7 re-measured per the owner's own verification pass (OWNER_ASKS.md, 3 Nov 04:14Z): the HF token is VALID again locally** (~/.cache/huggingface/token, admin of the csoai org; model renames to csoai-* done). The CI secret (GSPC_BOARD_TOKEN / #3) remains dead — local HF ops GO, CI-side spray still blocked | updated |
| Mon | **W1 measured CLOSED by GET**: the HF mirror snapshot carries as_of == live root as_of (2026-11-01T15:09:42Z), root_sha256 == live root bytes (a1309620…), merkle == live merkle (4e576078…) — the spray lane refreshed it 2 Nov 19:46Z. The weekly mirror-gate passes all 6 directory exclusions | closed |
| daily | local HF ops use the valid local token; the CI secret remains the blocker for scheduled sprays — observed, not worked around | standing |
| Wed | **lane offload**: follow `docs/operations/LANE-OFFLOAD-RUNBOOK-2026-11-03.md` (how a lane works without a fat local clone) — the M4 checkout shrinks to orchestrator+credentials; durable outputs land on HF datasets | runbook landed 3 Nov by the offload lane |
| Thu | **W4/W5 refresh** on HF land: regenerate + publish the ledger artefacts the same way the spray lane publishes the snapshot | — |

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
