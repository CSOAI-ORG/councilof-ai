# Run a GSPC axis with lm-eval

One command, on your model, against a frozen published bank.

```bash
pip install lm-eval
git clone https://huggingface.co/datasets/csoai/gspc-eval .   # or copy this directory
lm_eval --model hf \
  --model_args pretrained=meta-llama/Llama-3.1-8B-Instruct \
  --tasks gspc_affect \
  --include_path ./lm-eval \
  --output_path ./results
```

## What is in here

- 12 task directories, one per runnable axis: `gspc_affect`, `gspc_art5_safeguard`, `gspc_care`, `gspc_conformance`, `gspc_continuity`, `gspc_cross_reality`, `gspc_detector_interop`, `gspc_governance`, `gspc_machinery_conformity`, `gspc_openness`, `gspc_provenance`, `gspc_safety`.
- Each holds its task YAML and a `utils.py` — the grader. It is the estate's own `read_label`,
  ported, and `scripts/surface/lm-eval-parity.node-test.mjs` proves the port and
  `harness/gspc-top100/mill_hub_queue.py` agree, case for case, over the estate's own fixtures.
- Each task points at the PUBLIC bank bytes by URL. No account, no token, no upload.

## The rule, stated

An answer that is not one of the bank's labels **leaves the denominator**. It is not a wrong
answer. The number this produces is therefore a coverage-weighted accuracy: a model that will
not emit the requested format gets a smaller n, and n below 30 is unquotable. Read the n before
the accuracy.

## What this does not establish

Measurement, not certification. A task score is evidence of a run at a time, on a frozen bank,
with one prompt template and one grader. It is not a grade, a rank, a conformity assessment, or a
statement that any model is safe. A TIE is a TIE.

## Axes that are deliberately absent

- `jail` — one-option menu refused: 1 distinct exact label(s) ["CONFINED"]; a prompt that cannot be answered wrongly measures nothing
- `swarm` — one-option menu refused: KEYWORD_MATCH is a grading mode, not an answer label (1 distinct expected value(s) in the bank)

A bank whose label menu cannot be answered wrongly cannot be measured, and the refusal is the
result, not a gap in this file.
