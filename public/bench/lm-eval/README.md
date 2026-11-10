# Run a GSPC axis with lm-eval

The canonical 12-axis pack replaces the earlier six-task Hub bridge. Each task carries the
published bank bytes, checks their SHA256 before loading, and records the exact Hub revision.
No account or network is required to load the bank. Model access depends on your chosen backend.

```bash
pip install 'lm_eval[hf]==0.4.13'
git clone https://huggingface.co/datasets/csoai/gspc-lm-eval-tasks
cd gspc-lm-eval-tasks
lm_eval --model hf \
  --model_args pretrained=YOUR_MODEL \
  --tasks gspc_provenance --include_path ./lm-eval --log_samples --output_path ./results
```

## Task and grader contract

- `gspc_affect`: 41 eligible items
- `gspc_art5_safeguard`: 36 eligible items
- `gspc_care`: 200 eligible items
- `gspc_conformance`: 35 eligible items
- `gspc_continuity`: 33 eligible items
- `gspc_cross_reality`: 32 eligible items
- `gspc_detector_interop`: 33 eligible items
- `gspc_governance`: 237 eligible items
- `gspc_machinery_conformity`: 33 eligible items
- `gspc_openness`: 32 eligible items
- `gspc_provenance`: 32 eligible items
- `gspc_safety`: 36 eligible items

The grader is copied verbatim from `harness/gspc-top100/mill_hub_queue.py::read_label`.
`scripts/surface/test_lm_eval_parity.py` checks canonical label and row-selection parity.
`scripts/surface/test_lm_eval_framework.py` verifies bank integrity and the actual Dataset contract, loads all tasks through
lm-eval and exercises its evaluator with fixed fake responses, without a model call.

`exact_match` is accuracy **conditional on a parseable label**. `parse_rate`, `n_graded` and
`n_attempted` expose the denominator. An unparsed response leaves the accuracy denominator.
If every response is unparsed, accuracy is unavailable, not zero. Read coverage alongside accuracy.
The last-line/punctuation rules are exactly the canonical grader's; arbitrary label substrings do
not count. The task prompt matches the canonical axis template and does not include the gold answer.

## Migration from the six-task bridge

Use `--include_path ./lm-eval` and the canonical names. The Hub's old `tasks/` entry points remain
aliases for compatibility: `gspc_mcp` → `gspc_conformance`, `gspc_oss` → `gspc_openness`,
`gspc_prv` → `gspc_provenance`, `gspc_asi` → `gspc_continuity`,
`gspc_det` → `gspc_detector_interop`, `gspc_art5` → `gspc_art5_safeguard`.
Historical six-task results are not upgraded or admitted by replacing the task files.
The separate legacy garak probe is unchanged and is not covered by this qualification.

## Rebuild and verify

From the Council of AI monorepo, run `node scripts/surface/build-lm-eval-tasks.mjs --check`
and the two Python tests above. `--check` is offline. `--refresh` resolves current Hub revisions
but refuses any bank whose bytes differ from the declared hash in `public/bench/axes.json`.
The same producer freezes the five existing Auto-Measure banks and copies the canonical grader.

## Limits

This pack measures a run with a particular prompt, bank and grader. It does not establish a rank,
certification, safety, or independent GSPC admission. Fewer than 30 graded items remain unquotable
under the existing policy. No model measurements were made by the framework smoke test.

Excluded axes: `jail` (one-option menu refused: 1 distinct exact label(s) ["CONFINED"]; a prompt that cannot be answered wrongly measures nothing); `swarm` (one-option menu refused: KEYWORD_MATCH is a grading mode, not an answer label (1 distinct expected value(s) in the bank)).
