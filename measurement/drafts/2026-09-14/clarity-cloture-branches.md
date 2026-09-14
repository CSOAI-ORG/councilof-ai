# UNSIGNED DRAFT — owner signs after public result; dead branches deleted

**Subject:** H.R. 3633 (CLARITY Act, 119th Congress) — Senate cloture vote on the motion to proceed
**Surface (on promotion):** `public.notice` · **Engine:** none (record-from-official-source) · **Corpus:** official Senate roll-call record · **Drafted:** 2026-09-14T10:40Z
**Framing:** Measurement, not certification. A record of a procedural vote outcome from the official record. Not a prediction, not a view on the bill, not a view on whether it becomes law.

## Premise check (done before drafting)

| Premise | Primary source | Retrieved (UTC) | State |
|---|---|---|---|
| Cloture motion on the motion to proceed was filed in the Senate | api.congress.gov `v3/bill/119/hr/3633/actions`: *"2026-08-08 — Cloture motion on the motion to proceed to the measure presented in Senate. (CR S4557)"* | 2026-09-14T10:34:51Z | **VERIFIED (primary)** |
| Bill placed on Senate Legislative Calendar | same feed: *"2026-06-01 — Placed on Senate Legislative Calendar under General Orders. Calendar No. 423."* | 2026-09-14T10:34:51Z | **VERIFIED (primary)** |
| Cloture vote is scheduled for **Tue 2026-09-15, 2:15 p.m. ET** | senate.gov floor schedule, democrats.senate.gov/floor, republican.senate.gov and congress.gov all returned **HTTP 403** to this lane; govinfo CREC 2026-08-08 granule search returned 0 results. The date and time are stated only in secondary sources (e.g. troutmanfinancialservices.com 2026-08, coindesk.com 2026-08-08) | 2026-09-14T10:34:51Z | **UNVERIFIED from a primary source.** Do not publish a time until a senate.gov page confirms it. |

No market probability is cited. None is needed to record an outcome.

## What gets recorded (identical for every branch)

- `roll_call`: Senate vote number, session, and the senate.gov roll-call URL
- `question`: the exact question text as the roll-call page shows it
- `yeas` / `nays` / `not_voting`: copied from the roll-call page
- `threshold`: the threshold the roll-call page states (do not assume 60 if the page says otherwise)
- `result`: the result text **verbatim** from the roll-call page
- `retrieved_at`: UTC timestamp; `source_urls`: roll-call page + congress.gov actions
- `unmeasured`: `["passage", "enactment", "final bill text", "any market or price effect"]`

---

## Branch A — cloture invoked on the motion to proceed

```json
{
  "schema": "https://councilof.ai/schema/card-v1.json",
  "surface": "public.notice",
  "subject": "H.R.3633 CLARITY Act — Senate cloture on motion to proceed: INVOKED",
  "as_of": "<roll-call timestamp, UTC>",
  "source_urls": ["<senate.gov roll_call_votes URL>", "https://www.congress.gov/bill/119th-congress/house-bill/3633/all-actions"],
  "payload": {
    "kind": "legislative.procedural-vote/0.1",
    "bill": "H.R.3633 (119th)",
    "chamber": "Senate",
    "question": "<verbatim>",
    "result": "<verbatim, e.g. 'Cloture Motion Agreed to'>",
    "yeas": "<int>", "nays": "<int>", "not_voting": "<int>",
    "threshold": "<verbatim>",
    "roll_call": "<number/session>",
    "branch": "A",
    "not_passage": true
  },
  "unmeasured": ["passage", "enactment", "final bill text", "any market or price effect"],
  "tags": ["UNSIGNED-DRAFT", "procedural-vote", "not-a-prediction"],
  "sha256": null,
  "sig_ed25519": null
}
```

## Branch B — cloture not invoked

Same envelope. `subject` ends `: NOT INVOKED`. `result` verbatim (e.g. "Cloture Motion Rejected"). `branch: "B"`.
The payload records the count only. It does not say "the bill is dead", because that is a forecast, not a record.

## Branch C — no vote held on 2026-09-15 (vitiated, postponed, or rescheduled by unanimous consent)

Same envelope. `subject` ends `: NO VOTE HELD 2026-09-15`. `payload.result` = the verbatim congress.gov / Congressional Record action text that disposes of or reschedules the motion. If no official text exists yet, `result: "UNMEASURED"`. `branch: "C"`.
Do not infer a reason for the delay (lag, not allegation).

---

**Promotion rule:** after the official roll-call page is live, keep exactly one branch and delete the other two. Fill the fields from that page only. Hand the card to the GHA signer path. Do not sign locally, and do not stage this file into `scripts/adapters/staged_leaves` until an owner has kept a branch.
