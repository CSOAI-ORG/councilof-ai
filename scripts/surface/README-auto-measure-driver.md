# Archive one Auto-Measure run

This operator CLI uses the workstation's existing Hugging Face authentication to call the
existing Space once and archive its complete response. It adds no Space secret, hardware,
model service, or recurring schedule. Run it from a canonical Council of AI checkout whose
Space receipt/grader/bank files match the deployed source manifest.

## Read-only plan

```bash
python -m pip install 'huggingface_hub==1.19.0' 'gradio_client==2.7.2'
python scripts/surface/run-auto-measure-once.py
```

The plan names the exact Space source, model revision, bank revision/hash, item indices, next
durable sequence, results-parent commit and existing 120-second GPU allocation. It performs no
inference and makes no writes. Keep authentication in the existing Hub credential store; do not
put tokens in command lines or copy them into the Space.

## One explicit run and archive

```bash
python scripts/surface/run-auto-measure-once.py --run \
  --expected-space-revision SPACE_SHA_FROM_PLAN \
  --expected-results-parent RESULTS_SHA_FROM_PLAN \
  --out-dir /absolute/path/to/retained-receipts
```

The CLI submits exactly one `/measure_at` request. A client timeout requests cancellation and
performs no inference retry. The existing Space allocation remains capped at 120 seconds; the
client timeout defaults to 240 seconds to allow for queue/transport overhead.
If the existing ZeroGPU quota refuses the request, the attempt marker remains local
and there is no returned receipt to archive. A later operator invocation requires
available quota; the CLI does not retry, upgrade hardware, or create a schedule.

Before writing, the CLI reconstructs the complete receipt using the frozen bank's actual expected
labels, the canonical grader, received full outputs, declared protocol and hashes. Partial windows,
missing evidence, wrong labels/counts, changed source/model revisions or conflicting history fail.
It records no inferred gold labels. The full response is saved locally before validation or archive.

Archive is one exact-parent Hub commit containing an append to the existing `results.jsonl` and
an immutable `receipts/<hash-prefix>/<sequence>-<receipt-hash>.json`. Historical JSONL bytes remain
a prefix, and all existing row keys remain available to readers. Both changed files are read back
at the new commit and hashed. A repeated identical receipt with both archive files is a no-write
replay. An existing JSONL record whose unique file is missing gets an exact-parent repair of only
that file; changed unique-file bytes fail closed. A different body
at an already owned sequence fails even when its request identity matches.

## Recover an archive failure without another model call

A race or ambiguous transport failure retains the complete local bundle. Re-read the plan and
archive that bundle using a fresh, reviewed results-parent commit:

```bash
python scripts/surface/run-auto-measure-once.py \
  --archive /absolute/path/to/retained-receipts/sequence-....json \
  --expected-results-parent FRESH_RESULTS_SHA \
  --out-dir /absolute/path/to/retained-receipts
```

This mode never calls inference. It verifies the historical pinned Space manifest and the full
receipt, then either confirms an identical existing record or appends at the exact current parent.
It does not silently select between conflicting receipts or overwrite a different immutable file.
A response that was never received cannot be reconstructed from an attempt marker.

## Interpretation and qualification

These are unsigned diagnostic records with `measurement_state: UNMEASURED` and `writes_board: false`.
A 20-item acceptance run remains below the existing 30-graded-item quotation threshold. Successful
transport/archive is not a model-quality improvement or independent GSPC admission. An archived run
with no parseable labels remains an incomplete native-inference acceptance and exits unsuccessfully.

The offline controls run with:

```bash
python -m pytest -q scripts/surface/test_auto_measure_archive.py
```

They cover partial evidence, frozen-gold regrading, internal hash mismatches, changed planned
revisions, preservation of historical bytes, duplicate receipts, same-identity conflicts, concurrent
parents, ambiguous commit failures, orphan receipt completion, immutable filenames and readback
corruption. Fixture outputs are never published as measurements.

The results dataset card is maintained in `spaces/gspc-auto-measure/RESULTS-README.md`.
After the normal source review and gates, the existing guarded publisher can mirror
that card and its source manifest without modifying any measurement rows:

```bash
python scripts/surface/publish-hf-evaluation.py --target results-card
python scripts/surface/publish-hf-evaluation.py --target results-card --apply \
  --expected-head FRESH_RESULTS_SHA --receipt /absolute/path/to/card-publication.json
```
