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

## Frozen archive retrospective replay — newly completed 24 November 2026

**Source discovery beyond the published fact table:** `csoai/gspc-fact-table@d0605c2495bddae7956fec5c18403d8a49fd81ac` publishes 20,517 joined measurement rows, **without** the raw model-response text. But its frozen `gspc_cells.jsonl` carries exact file and SHA-256 references to the original `public/interop/mill-evidence/items-*.jsonl` cells. A read-only replay using the source files available on M4 established:

| What was independently checked against pinned source descriptors | Reproduced result |
| --- | ---: |
| Frozen `gspc_cells.jsonl` SHA-256 | `68dfb5b07b01c2cd1929aa506d667b77eb00e600f0df42b3463860c1e6a85f47` |
| Source cells matched to declared SHA-256 | **677 / 677** |
| Historical rows accounted for | **20,517 / 20,517** |
| Raw model-response strings with matching individual SHA-256 | **19,227 / 19,227 available** |
| Archived rows without original raw-response text | **1,290 / 20,517** |
| Available raw responses containing the relevant `<think>`-family tag marker | **0 / 19,227** |

**Qualification:** The discovered parser defect **has no identified trigger in the 19,227 source-verifiable raw outputs** belonging to this frozen October fact table. That substantially limits the likely effect on *this particular corpus* from the new `<think>` check. It does not establish the absence of other parser bugs, correctness of original grades, model safety, independent calibration, or zero incidence in other source corpora or in the 1,290 rows without raw output. Do not backdate cards or alter historical measurements.

**Executable reproduction:** `scripts/measurements/audit_frozen_raw_think.py` fails closed if any descriptor, cell source file or raw response hash differs or if required counts are absent. Twelve synthetic/adversarial tests are in `scripts/measurements/test_audit_frozen_raw_think.py`. It returns only source counts and candidate-incidence metadata—**no raw prompts, model responses, keys or private values**. It is not a grader and cannot reissue signed scores.

To reproduce the exact frozen comparison after obtaining its pinned public descriptor (never substitute the current master descriptor, which may change), provide the original source-cell directory:

```bash
python3 scripts/measurements/test_audit_frozen_raw_think.py
python3 scripts/measurements/audit_frozen_raw_think.py \
  --descriptors /path/to/gspc-fact-table-at-d0605c/gspc_cells.jsonl \
  --source-root public/interop/mill-evidence \
  --output /tmp/csoai-frozen-think-audit.json
```

Verify the descriptor SHA is the pinned value above before treating a result as archived-fact evidence.

## Acceptance commands

~~~bash
python3 harness/gspc-top100/test_read_label.py
node scripts/surface/build-lm-eval-tasks.mjs --check
pytest -q scripts/surface/test_lm_eval_parity.py
pytest -q spaces/gspc-auto-measure/test_measurement.py
~~~

The final Space test requires optional Gradio runtime dependencies for UI endpoint testing. If a developer Mac lacks Gradio, its missing-package error is an environment limitation, not a passed endpoint; test on a runner with the declared requirements.
