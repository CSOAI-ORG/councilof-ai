# Evaluation and learning review renderer

`learning_review_report.py` renders an existing validated evaluation card and
retained canonical evidence events into the seven report sections: Executive
Summary, Data, Experiments, Results, What you learned, Next steps, AI tools used.

It is an additive derived view. It creates no card schema, case ledger, account,
review appointment, training action, new GSPC measurement or publication. The
existing `scripts/evaluation_card_verify.py`, `event.py` and
`axis_referee_review.py` remain the validators. A card passing those checks is
structurally valid; this renderer does not establish the underlying claim's
truth, authenticate signatures or run its reproduction command.

## Use

From the canonical checkout, with Python 3 and `jsonschema` installed:

```sh
python3 packages/evidence-fabric/render/learning_review_report.py \
  --card /approved/path/evaluation-card.json \
  --events /approved/path/retained-events.jsonl \
  --as-of 2026-11-11T04:00:00Z \
  --format markdown --output /approved/path/new-review.md

python3 -m unittest discover -s packages/evidence-fabric/render \
  -p test_learning_review_report.py -v
```

`--events` is optional and accepts a JSON array or JSONL. No events means no
established calibration. `--ai-tools` accepts a JSON array containing `name`,
`version`, `role` and optional `evidence_event_ids`. These are attributed
declarations; missing declarations do not mean that no AI was used.
`--proposed-decisions` accepts an array of proposed next-step strings and never
records adoption. Output is stdout unless a new file path is supplied; existing
files are not overwritten. Inputs are bounded regular files; no URL is fetched.

Callable API:

```python
from pathlib import Path
import importlib.util

path = Path("packages/evidence-fabric/render/learning_review_report.py")
spec = importlib.util.spec_from_file_location("learning_review_report", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
report = module.build_report(
    Path("evaluation-card.json").read_bytes(),
    Path("retained-events.jsonl").read_bytes(),
    as_of="2026-11-11T04:00:00Z",
    ai_tools=[],
    proposed_decisions=["Review the recorded failures before selecting a change."],
)
print(report["markdown"])
```

Retain repository-relative layout for an isolated notebook: the renderer,
`render/axis_referee_review.py`, `render/__init__.py`, `event.py`, the existing
evaluation-card verifier and both existing public evaluation-card schemas.
The result pins the exact implementation and input bytes. An input digest is a
binding, not an authentication mechanism. The source card's measurement and
publication dates are retained separately from report generation.

## Optional calibration metadata inside existing events

Only an explicit `observed.evaluation_review` object is analysed. This is a
bounded method payload in `csoai.evidence-event/0.1`, not a new canonical event
schema. It must contain exactly:

| Field | Meaning |
|---|---|
| `card_sha256` | Digest of the exact input card bytes |
| `case_id`, `case_sha256` | Stable case identifier and exact case revision |
| `source_group` | Declared source family used to check split overlap |
| `split` | `TRAIN`, `DEV` or `TEST` |
| `rubric_sha256` | Exact scoring rubric digest |
| `candidate_id`, `candidate_revision` | Judge/version being compared |
| `trial_id` | Unique trial identifier within candidate/revision/rubric |
| `reference_label` | `PASS`, `FAIL`, `ABSTAIN`, `UNRESOLVED` or `MISSING` |
| `candidate_label` | `PASS`, `FAIL`, `ABSTAIN`, `INVALID` or `MISSING` |
| `reference_origin` | `SYNTHETIC`, `SUPPLIED_REFERENCE` or `HUMAN_DECLARED` |

The enclosing event must have a valid canonical identity, a dated observation,
and `claim.source_sha256` equal to `case_sha256`. Conflicting reference labels,
duplicate trial identities, reused source families across splits, mismatched
card/source digests and unsupported fields are rejected. Duplicate wrappers and
capture-only repeats do not add trials. Source declarations cannot detect
undisclosed training leakage or semantic near-duplicates.

Groups retain candidate, version, rubric, split and reference origin separately.
`FAIL` is the positive class. Confusion counts describe binary pairs. Failure
detection and correct acceptance retain all known reference-class items in their
denominators, including abstentions, invalid outputs and missing predictions.
Decision coverage shows how many known references received a binary prediction.
Unresolved references are counted separately. No-reference denominators produce
null values, not zero or perfect scores.

Descriptive Wilson 95% intervals are computed only when the metric has one
observation per declared case and source group. Repeated cases or source groups
leave intervals unavailable pending clustered analysis. Distinct declarations
do not authenticate independence. Intervals do not themselves establish a
paired improvement or statistical separation.

`HUMAN_DECLARED`, a signature wrapper, a typed role or correct answers never
establish authenticated human review. This renderer has no trusted identity
verifier and therefore always retains human calibration, competence and
independent acceptance as `NOT_ESTABLISHED`. It accepts no caller option that
can switch those states. Its tests use explicit synthetic labels only.

## Before/after readiness

Optional `observed.learning_assessment` metadata must contain exactly
`card_sha256`, `participant_ref`, `phase`, `case_sha256`, `source_group`,
`rubric_sha256`, `lesson_revision`, `form_id`, `response_label`, and `data_origin`.
Phases are `PRE`, `POST`, `RETENTION`; response labels use the candidate-label
vocabulary above; origins are `SYNTHETIC` or `SUPPLIED_REFERENCE`.

The renderer checks explicit per-handle pairing, missing phases, source/case
bindings, chronology, reused cases, changed rubric/lesson/origin and declared
training-source overlap. It reports structural readiness only. Handles are not
authenticated participants; timing declarations are not proof of a human study.
Human learning gains, retention gains and human participant counts stay null.
Comparable task difficulty, consent, qualified reviewers and causal analysis
remain requirements of an actual study. Participant handles, case text,
arbitrary event observations and claim text are not republished.

## Evidence meaning

The repository's `EXAMPLE-0.1.json` and `EXAMPLE-0.2.json` are explicitly
fictional. Use them for software checks and label them as such. A real retained
source-integrity audit is also distinct from a model capability run or human
study: its rule-answered counts, source revisions and limitations must be
preserved in the existing evaluation card. Keep real audit reports separate
from synthetic calibration demonstrations.
