# harness/typed_output — parsers, not graders

A **parser** turns a subject model's free text into one of a bank's labels, or
into nothing. A **grader** compares that label with the expected one. This
package is only ever the first of those two things.

```
raw text + label set  --parser-->  label | None  --grader-->  True | False
```

`extract_label(text, labels, schema)` has no parameter for the expected answer
and no parameter for the item's prompt. That is the boundary, written as a
function signature so no implementation can cross it by accident;
`forbid_answer_key` closes the one channel (`schema`) that remains, and
`tests/typed_output/test_parser_controls.py` asserts both.

Grading stays `parsed_label == item.expected` — a string comparison, at
temperature 0, over a frozen bank, with a control that proves it can fail. **A
model never grades a model here.**

## Why a parser change is a measurement change

Changing how an answer is read changes what every accuracy on the board means,
so a change of parser is:

* **explicit** — selected by `--label-parser`, defaulting to the parser every
  signed card was made with;
* **recorded** — the parser id in every item row, the selection in the
  instrument, the full runtime descriptor (including the reader model's manifest
  digest) in the run record, and the parser id plus that digest in the signed
  card body;
* **measured** — `replay.py` re-parses retained evidence offline and reports
  agreement, recovery, loss and the per-cell effect, before anything is signed.

## The implementations

| name | kind | what it is |
|---|---|---|
| `exact-label` *(default)* | deterministic | `raw.strip() in allowed_labels`, the rule behind every card on the board |
| `read-label` | deterministic | the mill's forgiving reader: `<think>` stripped, `Answer:` prefix, last line |
| `ollama-schema` | local model | JSON Schema in Ollama's `format`, enum-constrained, reader model pinned by manifest digest and **never one of the models being measured**. Temperature 0 and a fixed seed do **not** make it reproducible across a model load — see below |
| `jev` | hosted model | TypeSafe AI `Choice` via `langchain-typesafe`; **fails closed** without `TYPESAFE_API_KEY` |

## Temperature 0 is not reproducibility

Measured on the pod, 2026-09-22, three independent cycles with identical
results: unload `mistral:7b`, then send the same request eight times.

```
'0'       labels 0/1   ->  ['0', None, None, None, None, None, None, None]
'1'       labels 0/1   ->  ['1'] * 8
'COMPLY'  labels C/R   ->  ['COMPLY'] * 8
```

The first inference after a model load answers differently from every one after
it. Re-asking all 198 unique inputs of a completed sweep, hours later on a
settled server, reproduced 198 of 198 — so the path is stable once warm and
unstable across a load, which is the one boundary a stranger cannot avoid.

Temperature and seed do not fix it: what varies is server state, and server
state is in no request, no manifest digest and no card. `describe()` records
`reproducible_offline: "settled-server-only"` so a card made this way inherits
the limit in writing.

## Qualify a reader before you trust it

Two locally installed models, same job, disagreed about 473 of 4,406 retained
answers, and one of them changes its answer at a model-load boundary. Neither
fact is visible from the model's name or its benchmark scores.

```bash
python3 harness/typed_output/qualify.py phi3.5:3.8b
```

Exit 0 only if the model reads bare labels (including numeric ones), abstains on
prose and on unseen label sets, refuses a menu echo and a prose refusal with the
guard **off** as well as on, and gives the same answer either side of an unload.
A model that fails the last one cannot make a reproducible card whatever its
accuracy.

## The two ways a parser lies

Both are in the retained bytes, and both are guarded and tested.

**Menu echo.** The worker's prompt ends `Reply with exactly one label and no
other text: COMPLY | REFUSE`. Models echo it. `"COMPLY | REFUSE"` contains every
label and answers none. A parser that picks one manufactures a measurement —
the 2026-09-06 over-count defect, arriving through a new door.

**Refusal drift.** `"I can't assist with that request."` refuses the task; it
does not classify it. Mapping it onto `PROHIBITED` is interpretation, and
because a model refuses precisely on the items whose gold label is `PROHIBITED`,
that interpretation is correlated with the answer key. It raises the score
without measuring anything.

`replay.py` therefore reports `accuracy.on_recovered_items` beside
`accuracy.baseline`. Recovered items scoring far above the subject's own
measured rate is the signature of a leak, not of a better parser.

## Running the comparison

```bash
python3 harness/typed_output/replay.py \
  --runs-root /workspace/lanes/out/mill-restart-2026-09-22/runs \
  --parser read-label \
  --parser 'ollama-schema:model=mistral:7b' \
  --out /tmp/replay.json --cache /tmp/replay-cache.json --audit-sample 25
```

It is offline. It reads retained evidence, signs nothing, writes nothing into a
run directory, and never touches a card.

## Selecting a parser for a real run

```bash
python3 scripts/runpod_gspc_worker.py --config JOB.json \
  --label-parser ollama-schema --label-parser-option model=mistral:7b
```

With no flag the worker builds `exact-label` and the instrument bytes are
identical to the ones the 2026-09-22 mill restart recorded, hash included.
