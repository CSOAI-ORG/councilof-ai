# `gen_ai.evaluation.result` → `EvaluationResult/v1` crosswalk — Measure — 25 Oct 2026

**Status:** crosswalk + two proposed additions. **Not** a standard, **not** a conformance claim.
**Trigger:** [open-telemetry/semantic-conventions-genai#590](https://github.com/open-telemetry/semantic-conventions-genai/issues/590) ("Evaluation result: score direction, result level, rating scale and tags"), and our [comment on it](https://github.com/open-telemetry/semantic-conventions-genai/issues/590#issuecomment-6394047594).
**Surfaces:** `otel.span` (evidence input), `public.notice` (staged atoms), `eval.delta` (CI delta cards).
**Locks:** Never grade from a score. Never MEASURED from a score. Never certify. A crosswalk is a mapping, not an approval. Nothing here changes the ONE root.

---

## Thesis

The four attributes requested in #590 are not four of a kind. Two are **envelope** concerns — how a
result is routed, grouped and displayed — and two are **measurement semantics** — what the number
means. The current seam puts all four in one flat namespace, and that seam is where the meaning is
lost.

```
  envelope  ── level · tag.<key>            → where the result travels, how it is grouped
                                            → belongs to the span / trace context
  predicate ── score.direction · rating_scale → what the number means
                                            → belongs in the thing that gets signed
```

The consequence is practical. A consumer that receives only a signed result has no way to learn
whether a larger number is better, because the direction travelled in the envelope and the
signature covered the payload. A consumer that receives only a span has no way to learn what was
pinned, because the pins travelled in the predicate.

Neither half is optional. The honest fix is not "add four attributes"; it is "each half carries what
is its own, and the two are joinable by a key".

---

## 1. The four requested attributes

As asked in #590, verbatim in intent:

| # | Attribute | Type | Asked for |
|---|---|---|---|
| 1 | `gen_ai.evaluation.score.direction` | `maximize` \| `minimize` | so a consumer knows whether higher is better |
| 2 | `gen_ai.evaluation.level` | `session` \| `trace` \| `span` | says what was evaluated, not just where it was recorded |
| 3 | `gen_ai.evaluation.score.rating_scale` | `numerical` \| `categorical` | so a consumer charts a histogram or counts labels |
| 4 | `gen_ai.evaluation.tag.<key>` | string | customer-defined grouping keys |

The issue also notes that score range is tracked in #39 and evaluator type in #359. Those two are
adjacent and the crosswalk below does not duplicate them.

---

## 2. The crosswalk

`EvaluationResult/v1` is the predicate at
[`packages/gspc-card-verifier/spec/EVALUATION-RESULT.md`](../packages/gspc-card-verifier/spec/EVALUATION-RESULT.md),
schema [`evaluation-result.schema.json`](../packages/gspc-card-verifier/schema/evaluation-result.schema.json),
predicateType `https://councilof.ai/attestations/evaluation-result/v1`.

| #590 attribute | `EvaluationResult/v1` | Home | Rule |
|---|---|---|---|
| `score.direction` | **no field** | predicate | **GAP.** See §3. |
| `level` | **no field** | envelope | Map to the span's own scope. Do not put it in the predicate. See §4. |
| `score.rating_scale` | `result.value` + `result.aggregation` | predicate | **PARTIAL.** `aggregation` enumerates `mean`, `nanmean`, `median`, `sum`, `exact_match_rate` — all numeric. A categorical result has no representation. See §5. |
| `tag.<key>` | **no field** | envelope | Map to the span / trace context. See §4. |

Two of the four are not gaps in the predicate; they are gaps in the *namespace*. Two are gaps in the
predicate, and one of them (#1) is a gap in **our own** predicate, which we disclose rather than let
a reader discover.

---

## 3. Disclosure: our predicate has the same missing `direction`

`EvaluationResult/v1` records `result.metric`, `result.aggregation`, `result.value`, `result.grading`
and `result.interval`. It does **not** record whether a larger value is better.

This is the same defect #590 is asking OTel to fix, in our own vocabulary, and it is worse in a
signed artefact than in a span: a span's consumer can see the surrounding context, but a signed
result's consumer holds exactly what was signed. If the direction is not inside the signature, it is
not evidence.

The predicate's existing convention is the right precedent. `items.heldOut` **absent means unknown,
not false** — silence is not read as the convenient answer. The same rule has to apply to direction:
**absent means unknown, not `maximize`.**

### Proposed addition to the predicate

```jsonc
"result": {
  "metric": "exact_match",
  "aggregation": "mean",
  "value": 0.612,
  "direction": "maximize",        // NEW. "maximize" | "minimize"
  "grading": "deterministic",
  "interval": { "kind": "wilson", "low": 0.568, "high": 0.654, "confidence": 0.95 }
}
```

Rules we would ask for, and would accept:

- **Absent means unknown.** Not `maximize` by default. A signed artefact that guesses is worse than
  one that says nothing.
- **Enum only `maximize` | `minimize`.** A third value ("higher is better above 0.5") is a metric
  definition, not a direction; it belongs in `metric`, which is already a free string.
- **The direction is per metric, not per result.** Two runs of the same metric with different
  directions are contradictory; the direction belongs to the metric definition, so a consumer can
  check the metric for consistency across results.

### Proposed addition to OTel

`gen_ai.evaluation.score.direction` as asked, with the same absent-is-unknown rule. Our mapping,
when both are present, is by value: `direction` in the predicate and `score.direction` in the span
must agree, and a disagreement is a consumer-visible conflict rather than a silent preference.

---

## 4. `level` and `tag.<key>` are envelope attributes

`level` says what was **evaluated**; `tag.<key>` says how a result is **grouped**. Neither changes
what a number means, and neither belongs in a signed measurement of that number.

This is not a dismissal — it is a placement. #590 itself separates the axes: `level` is "the
target's granularity, not single output vs full run", and it notes the `scope` attribute dropped in
#359 was a different axis again. Every prior art cited in the issue treats tags as routing, not as
semantics: Braintrust `tags`, Langfuse `metadata`, LangSmith `extra`. Those are all envelope.

The join key between the two halves is `items.digest` plus `harness.commit`. A span carrying the
predicate's pins can be matched to a signed result; a span carrying only a score cannot.

**Recommendation:** `level` and `tag.<key>` stay as they are proposed, in the span. They do not need
a predicate field, and adding one would push envelope state into a signed artefact — where it
becomes a thing that can be stale.

---

## 5. `rating_scale` is a real predicate gap, and a narrow one

`result.value` in v1 is a number. `result.aggregation` enumerates numeric aggregations only. So
`rating_scale: categorical` — a score that is a label rather than a number, which #590 calls out
including "categorical results that carry numeric codes" — has no representation in the predicate.

Proposed addition, following the same "absent means unknown" rule:

```jsonc
"result": {
  "rating_scale": "numerical",     // NEW. "numerical" | "categorical"
  "value": 0.612,
  "value_label": null,             // NEW, present only when rating_scale is "categorical"
  "aggregation": "mean"
}
```

Rules:

- **Absent means unknown**, not `numerical`. Same precedent as `heldOut` and `direction`.
- **A categorical result has no `interval`.** An interval over labels is not an interval. The
  existing gate that `wilson` is admissible only for a 0/1 proportion under `mean`/`nanmean` is the
  right shape; a categorical result has no admissible interval and must not carry one.
- **Numeric codes are still labels.** A categorical score of `3` is a label whose value happens to
  be `3`. It is not a proportion and gets no `wilson` interval.

---

## 6. What a score alone does not carry

This is the part worth stating plainly, because a score is what most consumers actually hold. Six
fields travel with the result and not with the number:

| Field | What it carries | What a bare score cannot recover |
|---|---|---|
| `harness.commit` | the 40-hex commit of the code that produced the result | which harness version ran; a version string is not a pin, and a truncated prefix cannot be re-run by a stranger |
| `items.digest` | sha256 over the item set actually scored | which items; a benchmark name plus a version does not tell you two runs scored the same things, because datasets are revised in place |
| `items.heldOut` | whether the items were sequestered | whether the score is a measurement or a memorised score; absent means unknown, not false |
| `result.grading` | `deterministic` \| `model_judge` \| `human` \| `mixed` | whether a reader is looking at a reproducible grader or an opinion with a rubric |
| `result.interval` | the uncertainty around the number | how many items it took to get that number; `0.612` and `0.612 ± 0.09` are different claims |
| `establishes` | what the result claims | the limits of the claim; a result that declares nothing about its own limits is the shape that most reliably misleads |

Each of these is a field the predicate already requires or explicitly gates. None is a field a span
carries, and none can be reconstructed from the score.

---

## 7. What we publish, free

The crosswalk above is only useful if a producer can actually emit the predicate side. So we publish
the conversion artefacts, free, and they are the reference implementation rather than a description
of one:

- **The evaluation-result corpus** — third-party published results converted into
  `EvaluationResult/v1`, each carrying `harness.commit`, `items.digest`, `heldOut`, `grading`,
  `interval` and `establishes`, with the source URL and the sha256 of the bytes it was converted
  from. A producer can use it as a worked corpus, or convert its own results against it.
- **The conformance vectors** — `packages/gspc-card-verifier/test/vectors/`, a frozen corpus with
  an expected verdict for every case, including the `UNCHECKABLE` ones a two-state verifier gets
  wrong.
- **The verifier** — `packages/gspc-card-verifier/`, which returns `VALID`, `INVALID` or
  `UNCHECKABLE`. `UNCHECKABLE` is decided before anything else runs: "I could not check this" and
  "this is forged" are different facts about the world.

Verification is free and always will be: <https://councilof.ai/verify>.

We measure; we do not certify. Nothing in this document approves a convention, certifies a producer
or states that any implementation is conformant.

---

## 8. A worked example

A span from a producer, and the signed result it refers to.

```json
{
  "name": "gen_ai.evaluation.result",
  "attributes": {
    "gen_ai.evaluation.name": "harmfulness",
    "gen_ai.evaluation.score.name": "exact_match",
    "gen_ai.evaluation.score.value": 0.612,
    "gen_ai.evaluation.score.direction": "maximize",
    "gen_ai.evaluation.score.rating_scale": "numerical",
    "gen_ai.evaluation.level": "trace",
    "gen_ai.evaluation.tag.team": "safety",
    "gen_ai.evaluation.predicate.digest": "sha256:<digest of the signed predicate>"
  }
}
```

maps to a predicate whose `result.direction` is `maximize` and whose `result.rating_scale` is
`numerical`, joined on the predicate digest. `level` and `tag.team` stay in the envelope and are not
signed. The consumer can then say what was measured, over what, with what uncertainty, and what it
does not establish — none of which is recoverable from `0.612`.

---

## 9. Limits of this crosswalk

- It is a **mapping**, not a specification. We are not the OTel maintainers and this document
  changes nothing in the semantic conventions.
- It covers the four attributes of #590 and the two adjacent issues (#39 score range, #359 evaluator
  type) only by reference. A full crosswalk of `gen_ai.evaluation.*` is not attempted here.
- It describes `EvaluationResult/v1` as it stands. The two proposed additions (`direction`,
  `rating_scale`) **are not in the schema yet**; until they are, the predicate carries the same gap
  the OTel issue is asking to close, and we say so rather than shipping around it.
- Our conformance corpus covers MCP server conformance, not evaluation-result conformance. The two
  are separate measurements and are never merged into one number.
