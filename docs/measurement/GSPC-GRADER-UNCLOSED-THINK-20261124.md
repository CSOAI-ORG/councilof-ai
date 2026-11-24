# GSPC measurement instrument correction: unclosed reasoning tags

**Engineering record: 24 November 2026 UTC; source correction proposal, not retrospective correction of published measurements.**

## Reproduced defect

Both the canonical harness/gspc-top100/mill_hub_queue.py read_label and the generated spaces/gspc-auto-measure/grader.py returned COMPLY on the malformed output:

~~~text
<think> unfinished reasoning
COMPLY
~~~

The final token remains in an unclosed reasoning block; it is not a separately parseable final answer. Nested and stray closing tags can also admit false positives under the earlier regex removal. This is instrument parse ambiguity, not proof of malicious model behavior or wrong historical aggregate measurements.

## Scoped repair and source integrity

The canonical parser rejects mismatched opening/closing counts and any residual reasoning tag after removing complete blocks. This is intentionally conservative; a false rejection of a malformed answer is preferable to inflating the number of correctly answered items. Existing allowed exact labels, Answer: prefixes, properly closed thought blocks and no-answer behaviour are retained.

The canonical mill is the source of truth. Generated artifacts are produced by the existing node scripts/surface/build-lm-eval-tasks.mjs producer. That updates each lm-eval axis utils.py, YAML grader hash and manifest.json, and the Space's grader.py. The generator's offline --check must pass with all 45 files byte-identical. The changed source hash represents a new instrument revision.

## Release and evidence restrictions

- Do not rewrite historical signed cards or old grader_sha256 values. A changed parser means a new instrument version, not an alteration of evidence at rest.
- The number of valid graded items might change for archived outputs with malformed tags. That effect is UNKNOWN until an exact, separately pre-registered archived raw-output regrade; no historical score correction is inferred from these negative controls.
- If n_graded falls below 30, or raw outputs are missing, never invent a new measured count or claim an accepted score.
- Code passing tests is not an independent model safety certification, human authorisation, real grader calibration or permission to promote a pending root.
- The Space deployment must be separately pinned and read back; merging GitHub source does not establish HF production deployment.

## Acceptance commands

~~~bash
python3 harness/gspc-top100/test_read_label.py
node scripts/surface/build-lm-eval-tasks.mjs --check
pytest -q scripts/surface/test_lm_eval_parity.py
pytest -q spaces/gspc-auto-measure/test_measurement.py
~~~

The final Space test requires optional Gradio runtime dependencies for UI endpoint testing. If a developer Mac lacks Gradio, its missing-package error is an environment limitation, not a passed endpoint; test on a runner with the declared requirements.
