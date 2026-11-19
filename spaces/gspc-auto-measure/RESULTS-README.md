---
license: cc-by-4.0
pretty_name: GSPC Auto-Measure Space results (append-only run log)
tags: [gspc, council-of-ai, measurement, zerogpu, auto-measure]
size_categories: [n<1K]
configs:
  - config_name: default
    data_files:
      - split: train
        path: results.jsonl
---

# GSPC Auto-Measure results

This dataset retains the append-only diagnostic run log from the
[GSPC Auto-Measure Space](https://huggingface.co/spaces/csoai/gspc-auto-measure).
One line in `results.jsonl` represents one model and one bank. Existing historical
rows remain available with their original fields and values.

## Read the schema before comparing results

Rows without a `schema` field are legacy observations. Their original prompt,
first-item window, output truncation and label-matching behavior differ from the
current implementation. The migration preserves these rows; it does not regrade
them or turn their reported accuracy into a current-protocol measurement.

Rows with `schema: csoai.gspc-auto-measure/2` bind the frozen bank bytes and revision,
model and tokenizer revision, source commit, canonical grader hash, prompt and
generation protocol, item indices, complete returned outputs, token evidence and
observed stop reason. Item windows rotate deterministically by the durable sequence.

For v2 rows, `accuracy` uses the `n_graded` denominator. `parse_rate`, `n_attempted`
and `n_unparsed` expose output coverage; `accuracy_all_attempted` retains the other
denominator explicitly. A run with no parseable labels has a null conditional
accuracy. Failed or truncated output remains available for diagnosis.

## Archive and resume

The canonical [one-shot operator instructions](https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/surface/README-auto-measure-driver.md)
describe the read-only plan, one explicit Space request, and archive-only recovery.
The operator uses existing workstation authentication and the existing Space
allocation. The Space holds no archive token, and its local files are ephemeral.

The operator verifies a complete receipt against frozen expected labels, then uses
one exact-parent Hub commit to append `results.jsonl` and create
`receipts/<hash-prefix>/<sequence>-<receipt-hash>.json`. Both files are read back
and hashed. Identical complete archives replay without writes. A missing unique
receipt file can be repaired without duplicating the JSONL row; conflicting bytes
fail closed. `SOURCE_REVISION.json` identifies the canonical source of this card.

The repository does not establish that a recurring host schedule is active.
Operators must verify any host scheduler separately. A quota refusal or transport
failure that returns no receipt cannot become an archived measurement.

## Interpretation

These records are unsigned diagnostics with `measurement_state: UNMEASURED` and
`writes_board: false`. They do not establish independent GSPC admission. A 20-item
acceptance run remains below the existing 30-graded-item quotation threshold.
Successful transport and archival do not demonstrate a model-quality improvement.
Measurement, not certification.

Free verification: https://councilof.ai/gspc-verify

All five journeys (verify, research, buy, agent and diligence):
[GSPC start here](https://huggingface.co/datasets/csoai/gspc-start-here).
