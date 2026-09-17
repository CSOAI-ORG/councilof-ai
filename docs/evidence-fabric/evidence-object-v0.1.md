# The evidence object, v0.1

**One object. Every producer emits it, every surface reads it. It is not a new surface —
it is a vocabulary.** The reader that proves it (`scripts/express_as_evidence.py`) adds no
endpoint, no route and no server.

## Why

Every defect found in this estate on 17 September 2026 was the same defect wearing different
clothes: **one concept with more than one spelling.**

| the concept | the spellings | what it cost |
|---|---|---|
| "cards" | 3 corpora, 3 counts, 1 word | numbers quoted against each other for weeks |
| an axis id | `governance` / `gspc-governance` / `gov` | 8 MEASURED axes read as missing cards |
| the admitted count | `n` (body) and `n` (top level) in one file; `graded_n` on the pod path, nothing on the hub path | a count that meant different things by route |
| "measured" | `n >= 30` and nothing else | a card discarding 75.4% of attempts published MEASURED |
| the root | re-derived each publish, called a root | inclusion proofs that name leaves the next root drops |

A schema does not fix a producer. What it does is make a producer's silence **visible** instead of
letting it read as a value.

## The ten bindings

| binding | carries | if the producer has none |
|---|---|---|
| `subject` | what was observed — axis, model, subject id | REFUSE: without it there is no claim |
| `instrument` | what did the observing, with digests | ABSENT + reason |
| `run` | the run id | ABSENT + reason |
| `observation` | the values, `n_admitted`, `n_attempted`, exclusions | ABSENT + reason |
| `admission` | the decision, **the rule**, **the rule's source**, and the inputs it was decided from | ABSENT + reason |
| `signature` | alg, key, and **`authority_state`** | ABSENT + reason |
| `corpus_inclusion` | which corpus, and **against WHICH root** | ABSENT + reason |
| `witness` | the witness state | ABSENT today, always |
| `publication` | where the bytes are | ABSENT + reason |
| `time` | four separate times (below) | each ABSENT + reason individually |

### Four kinds of time, never collapsed

- **`observed_at`** — when the run happened.
- **`published_at`** — when the bytes appeared on a surface.
- **`read_at`** — when this object was built. The only one the reader knows first-hand.
- **`witnessed_at`** — when an independent party cosigned. **ABSENT for every artifact in this
  estate**, and it will stay ABSENT until the public root is appended rather than re-derived,
  because there is nothing yet for a witness to be consistent with.

## The two rules that make it honest

**1. Absence is recorded, never filled.** A producer that emits no run id gets
`{"state": "ABSENT", "reason": "…"}`. Never `null`, `""`, `0`, or `"unknown"` in a value slot.
Zero-filling is how `graded_n` came to mean nothing on one of its two paths.

**2. An uncheckable admission is REFUSED, not recorded.** If an artifact asserts `MEASURED` but
omits the quantity that decision is made from, the object is refused. Recording it would launder an
unverifiable claim into a clean schema — worse than having no schema, because the schema lends it
credibility.

Rule 2 is the one that makes this more than a diagram, and it is the control in the proving command.

## What it makes visible immediately

Expressing the worst mill card puts these two side by side in one object, where no surface
currently shows them together:

```json
"observation": { "n_admitted": 49, "n_attempted": 199,
                 "excluded": {"parse_errors": 150}, "discarded_fraction": 0.7538 },
"admission":   { "decision": "MEASURED", "rule": "n >= 30",
                 "rule_source": "scripts/sign_mill_cards.py:192 — the ONLY predicate; the
                                 exclusion ratio is never consulted",
                 "rule_does_not_consider": ["exclusion ratio", "n_attempted", "parse errors"] }
```

Three quarters of the attempts were discarded and the card is published MEASURED. Nothing is
alleged about intent; the rule simply never looks. The object does not fix that — it makes it
unmissable, and it names the file and line where the rule lives.

It also catches, mechanically, that `n` is spelled twice in the same file
(`one_concept_two_spellings`), which is the lane's whole thesis in one field.

## Expressed without inventing anything

Four producers, four vocabularies, one object:

| producer | bindings ABSENT | the interesting absence |
|---|---|---|
| mill card | 1 of 10 | no observation timestamp; the run id embeds one but the card does not publish it as a time |
| chain card | 4 of 10 | no instrument, no run, **no `n` at all** — and a signed `public_framing` the live board supersedes |
| root card (financial fact) | 3 of 10 | no admission — root.json says leaves are coverage harvest, not grades |
| board axis | 3 of 10 | **no corpus inclusion** — a board row is not a card and is in no corpus |

That last row is a finding, not a formatting note. The board asserts MEASURED for 22 axes while 9
of them have no card in either corpus.

## Proving command

```bash
python3 scripts/express_as_evidence.py --self-test   # 5/5 controls, including the refusal
python3 scripts/express_as_evidence.py --samples     # express all four live artifacts
```

The controls prove the refusal is real and conditional: a mill card with `n` removed is refused; the
same card unmutated still expresses. A schema that accepts everything proves nothing.

## What this is NOT

- Not a re-measurement. It restates what a producer published.
- Not a verifier. It records `authority_state` as **claimed**; it does not check signatures.
- Not a new surface. No endpoint, route or server was added, and none may be.
- Not a repair. Producers keep their defects until the producers change; this makes them legible.
