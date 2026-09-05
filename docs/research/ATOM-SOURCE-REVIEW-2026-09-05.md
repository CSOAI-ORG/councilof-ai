# Atom source review — the Phase 02 backlog, classified

5 September 2026. `scripts/badger/atom-root-sources.json` is default-deny with **one** admitted
source and the instruction *"add sources only after semantic review and the evidence-integrity
gate; never bulk-admit the queue."* This is that review. It **proposes** classifications; it
admits nothing. Admission stays with the gate and the owner.

## The backlog is not 2,042 decisions

    queue files       2,070        atoms   129,265
      admitted            1                      1
      excluded           27                    213
      UNREVIEWED      2,042                129,051

Sampled by family and classified on what the records actually contain:

| family | files | atoms | what a record is | proposed |
|---|---:|---:|---|---|
| `learn/` | 7 | **62,100** | `prompt`/`response` pairs | **EXCLUDE** |
| `per-issuer/` | 59 | 11,870 | measurement-card, UNMEASURED, carries evidence | admit |
| `badge-*` | 5 | 20,550 | measurement-card, UNMEASURED enrollment | admit as DISCOVERED-class only |
| `per-item/` | 55 | 7,810 | measurement-card, MEASURED, confusion matrix | admit |
| `bank-pack/` | 46 | 5,590 | measurement-card, `bank-issuer` subject | admit |
| `bank-complete/` | 6 | 4,680 | measurement-card, DISCOVERED + evidence | admit |
| `t2/` | 551 | 4,702 | measurement-card, UNMEASURED | admit as DISCOVERED-class only |
| `regulatory/`, `corrections-diff/`, `public-data/`, `top-models/`, `mineral-4/` | 515 | 6,829 | measurement-card, DISCOVERED + evidence | admit |

## The one that must not go in

**`learn/` is 62,100 atoms — 48% of the entire backlog — and it is not records at all.** A row is:

    prompt   "CSOAI: did you measure unknown (agent) on the a2a-capability-honesty axis..."
    response "Status: DISCOVERED. Evidence: {} Source: unknown..."

These are **training pairs generated from the board**, with `subj_source: unknown` and an empty
evidence object rendered into prose. They are derived artifacts of the retired learn-loop —
the same family as the `2026-09-04-learn-loop-placeholders` quarantine, which recorded that a
root committing 240 learn-loop leaves was inadmissible.

Anchoring a training pair asserts nothing. It is not a measurement, not an observation, and its
"evidence" is the literal string `{}`. Excluding this one family removes **48% of the backlog**
and is the single highest-value decision in the review.

## A flag I raised and then withdrew

`per-item/` first read as *"MEASURED with no evidence block"*, which would be the exact defect
this estate exists to catch. It is not. The measurement is under `grade`, not `evidence`:

    status MEASURED   n 71   grade "TP=17 FP=1 FN=21 TN=32"   detected true

The confusion matrix sums to `n`, and **275 of the 7,810 atoms honestly report UNCHECKABLE**
rather than rounding to a verdict. That is a real measurement in a non-standard shape, not an
empty claim. The schema inconsistency is worth normalising; the records are worth keeping.

Recording the withdrawal because a review that only reports what it finds damning is not a
review.

## What this does and does not unblock

Excluding `learn/` and admitting the measurement-card families would put roughly **67,000 atoms**
in scope for a new root — all of them cards with an issuer, an `as_of`, a subject and a status.

It does **not** clear Phase 02 on its own. Still required, per the policy's own terms:

1. the evidence-integrity gate run over the admitted set, not just this classification
2. `atom-root.py` emitting without raising — it is fail-closed and no longer submits a timestamp
3. the reviewed publication/signing/OTS ceremony
4. a Bitcoin block, which arrives on its own schedule

**Coverage is not admissibility.** The 4 September root had a proof that covered its own bytes
exactly, and was still correctly quarantined for what those bytes committed to. This review is
about the leaves; the coverage fix was about the binding. Both are necessary and neither
substitutes for the other.
