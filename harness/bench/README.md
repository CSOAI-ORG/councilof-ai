# Run and inspect a GSPC evaluation

This runner evaluates one model's replies against one published GSPC bank using the canonical mill grader and prompt builder. It writes a complete item ledger. It does not submit results, admit a model to the board or establish a ranking.

Python 3 and the repository checkout are sufficient for the runner. Run from the repository root. Listing or loading public banks requires network access; scoring existing answers makes no model calls.

```bash
python3 harness/bench/run_bench.py --list
python3 harness/bench/run_bench.py --axis governance --model your-model \
  --answers answers.jsonl --out result.json
```

The answers file is JSONL: one object per reply, with a unique zero-based integer `index` and the exact reply in the string `answer`. Keep original model output, including explanations and malformed responses. Do not replace replies with the expected label. Missing items remain visible as unparsed rows. Duplicate, invalid or out-of-range indices are refused.

For a live evaluation, see `python3 harness/bench/run_bench.py --help`. Configure your own endpoint and budget before using it. `--limit` is a development smoke check, not a complete-bank comparison.

## Read the result

| Field | Meaning |
| --- | --- |
| `bank_sha256`, `grader_source_sha256` | Digests of the instrument bytes used. |
| `bank_items_total`, `items_total`, `evaluation_scope` | Full bank size, evaluated size and full/partial scope. |
| `accuracy`, `wilson95` | Accuracy and interval among parsed replies under the canonical rule. |
| `accuracy_over_all_items`, `wilson95_over_all_items` | Correct replies divided by every evaluated item, including unparsed replies. |
| `items_unparsed` | Missing or unparseable replies; inspect these alongside accuracy. |
| `rows` | Every item: original reply and digest, expected/observed label, correctness and prompt digest. |

Exit `0` means every reply was graded. Exit `3` means a result was written with some unparsed replies. Exit `2` means the run could not produce an honest graded result; inspect stderr and any output rather than treating it as a zero score.

## Compare complete runs

```bash
python3 harness/bench/paired_comparison.py \
  --frontier baseline.json --meok candidate.json --out comparison.json
```

The tool refuses different banks or graders, changed prompts or gold labels, duplicate indices and incomplete-bank coverage. It reports both denominators and a paired test on items where both replies parsed. No parsed pairs produces `UNTESTED`.

The paired test alone does not validate equal compute budgets, uncontaminated test data, system identity, route independence or general superiority. Declare those conditions separately. Inspect differences in response coverage before interpreting a complete-case p-value. Account for multiple testing when selecting among many axes or candidates.

Older result files without grader hashes or full-bank coverage evidence remain historical records. Do not fill those fields by guessing. Re-evaluate retained original replies with the appropriate frozen source and bank, preserving the old artifact and documenting the derivation.

## Validate the software

```bash
python3 -m pytest -q harness/bench/test_comparison_integrity.py \
  harness/bench/test_paired_comparison.py harness/bench/test_run_bench.py
```

These are software checks, not new model measurements. To run the separate live public-bank loading check, use `python3 harness/bench/test_run_bench.py`; it reports unavailable banks as failures.

See [the product and benchmark qualification guide](../../docs/measurement/GSPC-MEOK-PRODUCT-QUALIFICATION-2026-10-30.md) for holdouts, external benchmark tracks and product acceptance.
