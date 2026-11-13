# Submit a GSPC run

A GSPC benchmark earns its place by being run by people who are not us. This is how a run gets
in front of the board.

## 1. Run it

```
git clone https://github.com/CSOAI-ORG/councilof-ai
cd councilof-ai
python3 harness/bench/run_bench.py --axis affect --model YOUR_MODEL \
    --base-url YOUR_ENDPOINT --out result.json
```

No account, no key, and no permission from us are needed. The runner fetches the frozen bank, hashes it,
builds the prompt from the bank's own label menu, grades every answer with the published rule, and
writes a receipt.

## 2. What a receipt must contain

The runner writes this for you. A submission is a **`result.json`** whose:

| field | why it is required |
|---|---|
| `bank_sha256` | proves which bytes were graded |
| `bank_repo` / `bank_url` | proves which bank, from where |
| `items_total`, `items_graded`, `items_unparsed` | the denominator, and how many answers were not answers |
| `hits`, `accuracy`, `wilson95` | the result, with its interval |
| `grader` | which rule graded it — `gspc-top100.mill_hub_queue.read_label` |
| `rows[].prompt_sha256` | per-item: the exact prompt, hashed |
| `rows[].raw answer` | per-item: what the model actually said |

## 3. What we will check before publishing anything

1. The receipt's `bank_sha256` matches the bank's sha256 **now** — a receipt against bytes that have
   moved is a receipt against something else.
2. Re-running the receipt's own rows through the grader reproduces its `hits`, `accuracy` and
   `wilson95` exactly.
3. `items_graded >= 30`. Below that the axis is unquotable by the board's own rule, and the result is
   reported as UNMEASURED, not as a low score.
4. The model id is resolvable and its revision is pinned, so the row names a model and not a moving target.
5. The canary row was excluded. It is a contamination tripwire, never a task.

If any of these fails, the submission is not published and the failure is reported to you. A run that
cannot be reproduced is not a slower result — it is not a result.

## 4. Where it goes

Open a pull request against `CSOAI-ORG/councilof-ai` adding your `result.json` under
`submissions/`. Do not edit any board file by hand: the board is generated from signed cards, and a
hand-edited row would be overwritten by the next build — and would be wrong until then.

## 5. What a submission never becomes

A submission is a **measurement**, not a grade, not a certification, and not a rank. If your model ties
with another on an axis, the board says TIE, because a tie that is not a win is the honest answer. If
your model wins, the board separates it only when the board's own fixed test does — and our own models
are excluded from leader attribution, so nobody can publish a number that advantages us.

The board: <https://councilof.ai/api/gspc> · the method: <https://councilof.ai/methodology/>

## Banks available to run

- `affect` — `gspc-affect`, 42 items — DISCLOSE | NULL | PERMITTED | PROHIBITED
- `art5-safeguard` — `gspc-art5`, 36 items — PERMITTED | PROHIBITED
- `care` — `gspc-care`, 200 items — 0 | 1
- `conformance` — `gspc-mcp`, 35 items — CONFORMS | VIOLATES
- `continuity` — `gspc-asi`, 33 items — NOT_APPLICABLE | QUANTUM_SAFE | QUANTUM_VULNERABLE
- `cross-reality` — `gspc-xr`, 32 items — CONFIRM | PROCEED | REFUSE
- `detector-interop` — `gspc-det`, 33 items — DIVERGENT | INTEROPERABLE
- `governance` — `gspc-gov`, 237 items — HIGH_RISK | LIMITED_RISK | MINIMAL_RISK | PROHIBITED
- `machinery-conformity` — `gspc-mach`, 33 items — NOT_SAFETY_FUNCTION | OUT_OF_SCOPE | PART_A
- `openness` — `gspc-oss`, 32 items — PERMITTED | RESTRICTED
- `provenance` — `gspc-prv`, 32 items — DESTROYED | SURVIVES
- `safety` — `gspc-agi`, 36 items — COMPLY | REFUSE
