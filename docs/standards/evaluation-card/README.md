# Evaluation Cards — `csoai.evaluation-card/0.1`

An **Evaluation Card** describes one evaluation so that a stranger can either reproduce it or find
the exact reason they cannot. It is free, it is not a certification, and it is not a leaderboard
entry.

## Why the arm split is required

A card reports one score. A score is only comparable to another score if the two were produced the
same way, so a card MUST say how the items were partitioned across the ways of answering that
actually ran — a model, a deterministic rule cascade, a human, a baseline.

This is not a stylistic preference. On 2026-10-26 the estate measured a signed, schema-known,
NaN-free record with verdict PASS that reported 30/30 for the product against 26/30 for the best
frontier model — a **+13.33pp** lead — and **20 of its 30 items were answered by a deterministic
rule cascade rather than by a model**, as the record's own per-item ledger showed. Every estate gate
checks provenance and structure; not one checked that a number inside a record means what the
summary above it says. Restricted to the model-answered items there was no separation at all.

So a card that reports one score without the arm split cannot be compared to anything, and the
verifier refuses it.

## What is here

| Artefact | What it is |
|---|---|
| `public/schemas/csoai-evaluation-card-0.1.schema.json` | the published shape (`csoai.evaluation-card/0.1`) |
| `public/schemas/csoai-evaluation-card-0.2.schema.json` | `csoai.evaluation-card/0.2` — adds the artifact-identity binding, the limitation taxonomy and the safety-case sections |
| `scripts/evaluation_card_verify.py` | the invariants a JSON Schema cannot check, plus its selftest |
| `EXAMPLE-0.1.json`, `EXAMPLE-0.2.json` | worked examples. They are EXAMPLES: they describe no real evaluation and establish nothing |

## Version 0.2 — what a score does not tell you

A score does not identify the thing that produced it. The same model name can be served from different
weights; two runs of the same weights under different harness versions are not comparable without
saying so. So 0.2 adds three things.

**The artifact-identity binding.** `artifact_identity` states whether the measured bytes came from
weights the card identifies by digest, and binds `weights_sha256` and `harness_version` when they do.
When they do not, the card says so *and says why* — a service, a rule cascade, a human. A **model**
subject must either bind its weights or explain why it cannot; a card cannot answer a score without
naming the artefact.

**The limitation taxonomy.** A closed vocabulary — simulation-awareness, sample-size, lower-bound,
non-comparability, external-validity, construct-validity, population-coverage, temporal-drift,
contamination, measurement-error. Every class is marked present or not, and **every class carries a
justification either way**, so that "no limitations" is a stated and checkable position rather than a
shrug. A card cannot claim none asserted while marking a class present.

**The safety-case sections.** Alignment, isolation, monitoring and incident, each either ASSESSED with
notes or NOT_APPLICABLE / NOT_MEASURED with a reason. A section is never silently missing.

The v0.1 shape still verifies: the verifier reads the version from the card's own `$schema` and applies
that version's invariants.

## The invariants the schema cannot carry

A JSON Schema cannot compare two fields, so the verifier carries these:

1. the arms count exactly `suite.items_total`
2. an arm never claims more answered items than it holds
3. a model arm answered all of its items
4. a claim of separation needs two arms **and** a per-arm breakdown
5. a card that cannot be reproduced says why
6. an Every-Eval-Ever field that is null carries a reason
7. `not_established` is non-empty
8. neither `not_established` nor the claim boundary makes a certification or endorsement claim

The ninth rule is the one that is easy to get wrong: "not a certification" and "certified" contain
the same word, and a card's `not_established` list is full of the first kind. The rule is therefore
scoped **per sentence** — a sentence that denies something may name the thing it denies; a sentence
that does not deny anything may not name it. A character-window version of this rule was measured
and found wrong: it let one list item's negation suppress a genuine claim in another.

## The 0.2 invariants

Ten more, on top of the nine above:

1. bound weights carry a digest
2. unbound weights carry no digest
3. a model subject either binds its weights or says why it cannot
4. the artifact identity carries a reason
5. the taxonomy names at least one class
6. every limitation class carries a justification
7. a taxonomy cannot claim none asserted while a class is present (or present while none is)
8. every safety-case section is an object with a valid status
9. every safety-case section carries notes
10. the version dispatch refuses an unknown schema version

## Use

```sh
python3 scripts/evaluation_card_verify.py --selftest          # the 9 invariants
python3 scripts/evaluation_card_verify.py path/to/card.json   # VALID | INVALID | UNCHECKABLE
```

Exit 0 VALID · 1 INVALID (with the faults) · 2 UNCHECKABLE (no schema engine — never VALID).

Measurement, not certification.
