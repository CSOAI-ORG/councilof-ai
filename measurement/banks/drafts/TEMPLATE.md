# Bank draft: <axis id>

Every section is REQUIRED before this draft can be frozen. `n/a` is not an answer;
if a section cannot be filled, the draft is not ready.

## 1 · The question

One sentence, answerable per-subject with no model fleet and no judge opinion:
"does <subject> disclose <specific artifact>, verifiably, as of <date window>?"

## 2 · Subjects

The enumerated subject set (companies, models, agencies — whoever the axis asks
about), each with the identifier a stranger can resolve. Minimum 30 subjects;
fewer cannot clear the n>=30 gate and the draft must say so plainly.

## 3 · Item grid

For every subject, the named public artifacts the grading reads (URL + access
method + read date). Sources a stranger can fetch without credentials. A source
behind a login is not a source; it is a dead row.

## 4 · Grading rule

Deterministic, written before any grading happens: each item's pass/fail/absent
rule, the aggregation to the axis's three-state, and the exact JSON shape of a
graded row. If two strangers applying this rule can disagree, the rule is not done.

## 5 · Referee

The named independent referee for the close test ("statistically consistent with
an independent implementation"). Not the estate, not a model in any set.

## 6 · Freeze format

The sha-pinned JSON shape of the frozen bank: `{"schema": "...", "frozen_at": "...",
"items": [...], "sha256": "..."}` + the `.ots` stamp. Bytes first, then measures.

## 7 · Compute estimate

The grading run's cost and duration on the estate's compute (RunPod CPU pod /
HF Jobs / Kaggle batch), with the lane that executes it.

## 8 · What flips

Exactly which surface updates when the run completes (the axis row, the /axis
page, the published census), and that UNMEASURED → MEASURED is the only allowed
transition (a slot never skips to a leader).
