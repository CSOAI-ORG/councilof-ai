# DRAFT correction: where the live board says more than its own evidence

Status: **DRAFT, HELD. Not published.** This draft changes nothing on councilof.ai, the board, the
corrections ledger or Hugging Face. No code in `functions/api/gspc.ts` is touched, because open PRs
#4453, #4443, #3888, #3558 and #3123 edit that file. Each item below names the evidence and a
proposed ruling. Entry ids are assigned when they land.

Owner ask: rule on items 1–4 one at a time. Items 5–7 are housekeeping.

Every figure here was read on 2026-11-18 between 06:40 and 08:10 UTC: `GET /api/gspc?axis=<id>` for
all 34 axes, and the evidence file named by each row's `evidence_url`.

## 1. Signed card disagrees with the number shown (3 model-comparison axes)

The board's own row notes say this, verbatim in substance:

| Axis | Shown (top observed, per-item rows) | Signed card for that model on this axis |
|---|---|---|
| governance | mistral:7b 0.5865 (139/237) | records accuracy 0.0 |
| care | qwen2.5:0.5b-instruct 0.405 (81/200) | records accuracy 0.0 |
| provenance | llama3.2:3b 0.7188 (23/32) | records accuracy 0.8 |

The board promises that every named figure links to the Ed25519 card behind it. Here a card exists
and says something else.

Proposed ruling: until a card is signed from the same run as the shown number, show the axis as
`MEASURED, no signed per-model figure` (the treatment machinery-conformity, cross-reality and
detector-interop already get) and supersede, not edit, the three cards with a note naming the run
each one does record.

## 2. Ten subject axes: MEASURED on the board, CANDIDATE in their own files

All ten `public/interop/axis-banks/*-20261102.json` files (lab-practice, company-practice,
measurer-integrity, harness-fidelity, interop-conformance, humanoid-deployment,
regulator-transparency, interpretability-reproducibility, serving-fidelity, watchdog-ingest) carry
`admission_state: CANDIDATE_FINDING` and `public_board_slot_state: UNMEASURED`. The board serves
all ten as `status: MEASURED`, "a real run stands behind this row".

Eight of the ten also carry `score_caveat`: "The headline bar was fixed after today's data was seen."

The detector behind them had the defects fixed in draft PR #4484 (raw-HTML corpus, unbounded
alternatives, a negative control that tested sha256 instead of the detector). A benign paragraph met
the 3-of-5 bar on regulator-transparency and watchdog-ingest.

Proposed ruling: serve the ten rows as the files describe them (`CANDIDATE_FINDING`) until a
presence/2.0 run with a pre-registered bar is admitted.

## 3. Claim-maintenance: the board serves a denominator the 30 October review withdrew

`docs/operations/CLAIM-MAINTENANCE-PROMOTION-PROPOSAL-2026-10-28.md` (updated 30 October) says the
28 October wave's `n_valid = 174` "must not be used as the admission denominator". The board row
still reads `MEASURED`, `n: 174`, citing `/interop/claim-maintenance-wave-2026-10-28.json`.

That file's `CHANGED` (110 of 174) compares a digest of the whole page's visible text. On 9 of 36
re-read pages, `CHANGED` and `WITHDRAWN` rows share one re-read digest, so `CHANGED` there means the
page moved while the claim was still present. The v0.2 wave method
(`scripts/measurements/claim-maintenance-wave.mjs`) already records `claim_text_observation`
(`PRESENT_IN_EXTRACTED_TEXT` / `NOT_FOUND_IN_EXTRACTED_TEXT`) per claim. No code change is needed.

Our own four captured claims (CS-1 to CS-4, in two registers) all read `WITHDRAWN` in that file.

Proposed ruling: board row to `CANDIDATE_OBSERVATION` citing the 30 October review; the next wave is
a v0.2 run whose headline is the per-claim text observation, page churn reported beside it; our own
four claims are re-captured or marked withdrawn by us first.

## 4. Freshness

14 of 34 axes are over 90 days old (behavioural rows 2026-08-12 to 08-18). "GSPC Continuous
Measurement" succeeded 10 of 10 scheduled runs in the week to 18 November, yet no axis is newer
than 2026-11-02. Its output does not reach the board.

Proposed ruling: state per row whether a scheduled job refreshes it, or say that none does.

## 5. Scheduled jobs that fail every time (latest 500 scheduled runs since 11 November)

Published-pin liveness 17/17, RunPod GSPC intake 10/10, Claims E2E (live truth check) 5/5,
Membership evidence freshness 5/5; auto-eat-feed 14/17. 97 of 500 runs failed.

## 6. The human-review queue is the PR queue, and it is backed up

The daily watchdog intake opens `watchdog/auto-YYYY-MM-DD` PRs. #3928 (4 Nov) and #4336, #4358,
#4397, #4436 (14–17 Nov) are open and unmerged. In SAFE v1 terms these are findings waiting for
review. Merge, close or batch-review them; an unreviewed queue reads to an outsider as no review.

## 7. Our own stale claims in third-party lists (claim-maintenance on ourselves)

Merged entries we wrote still carry counts the board no longer serves (34 axes, 34 measured today):

- EthicalML/awesome-artificial-intelligence-regulation: "14 of 14", then "22 measured of 22"
- SAILResearch/awesome-ai-leaderboard: "GSPC Governance Leaderboard (14 of 14)". The word
  *leaderboard* also contradicts "never a rank".
- agentrust-io/awesome-ai-governance: "22 axis · 15 measured"

Proposed fix: one update PR per list that removes the count and links `/api/gspc` instead, so the
entry cannot go stale again.

Also seen, not ours to rule on here: GitHub reports 48 Dependabot alerts on `master` (20 high).
