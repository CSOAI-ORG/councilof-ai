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
| `scripts/evaluation_card_verify.py` | the invariants a JSON Schema cannot check, plus its selftest |
| `EXAMPLE-0.1.json` | a worked example. It is an EXAMPLE: it describes no real evaluation and establishes nothing |

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

## Use

```sh
python3 scripts/evaluation_card_verify.py --selftest          # the 9 invariants
python3 scripts/evaluation_card_verify.py path/to/card.json   # VALID | INVALID | UNCHECKABLE
```

Exit 0 VALID · 1 INVALID (with the faults) · 2 UNCHECKABLE (no schema engine — never VALID).

Measurement, not certification.
