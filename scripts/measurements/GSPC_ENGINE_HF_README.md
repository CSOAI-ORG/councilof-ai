---
license: cc-by-4.0
language:
- en
tags:
- ai-safety
- evaluation
- provenance
- dataset-integrity
- reproducibility
pretty_name: CSOAI GSPC Source-Qualified Evidence Engine Index
---

# GSPC evidence engine index — qualified read-model, not a score

This index connects three separate, reviewable GSPC research products **only when their source digests and denominators agree**:

1. The canonical board-to-fact-table coverage read-model (34 board axes, heterogeneous methodologies).
2. The source-reconciled **per-observation** repeated-observation integrity audit (observations are NOT statistically independent questions).
3. The explicitly synthetic 1/5/25/150-document byte-integrity experiment (no model inference/training, no evidence of semantic poisoning).

**Nothing here is a new signed, independently replicated or admitted GSPC measurement, a compliance grade, a model safety certificate, or authority for an agent to act.** The current publication is an unsigned aggregate built from CI artifacts. The joined source digests identify the bytes being compared but are not an external trust anchor.

The source-qualification rules reject a mismatched physical-source digest, a model-axis-item denominator mismatch, a reattributed axis count, a missing grading denominator, or an attempt to present the synthetic experiment as trained model evidence.

## Reproduce

- Build: https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/measurements/gspc-evidence-engine-index.mjs
- Negative controls: https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/measurements/gspc-evidence-engine-index.node-test.mjs
- Parent workflows: gspc-evidence-coverage-feed, gspc-repeat-integrity, gspc-dataset-mutation-sensitivity.

```sh
node --test scripts/measurements/gspc-evidence-engine-index.node-test.mjs
node scripts/measurements/gspc-evidence-engine-index.mjs \
  --coverage path/to/coverage.json \
  --repeat path/to/repeat-report.json \
  --mutation path/to/synthetic-mutation-report.json \
  --out engine-index.json
```

The CI workflow reads the latest successful **protected-master** artifacts for each input, verifies source agreement and emits a single unsigned research index. If an upstream producer is missing, it records SOURCE_DEPENDENCY_NOT_READY and does not publish a partial success. Trusted master jobs can mirror this public aggregate to Hugging Face; no pull-request workflow gets the HF token.

For current usage, see source-run URLs and exact artifact hashes in engine-index.json. Absence of these artifacts means the index is unavailable, never that the model or instrument is safe.


## Current-checkout freshness gate

The automatic publication path also hashes every canonical raw source cell in
the protected checkout, verifies physical row and file counts, independently
reconstructs the source digest, compares today's actual manifest SHA-256
against the downloaded Actions artifacts, and verifies the synthetic baseline
against the version-controlled reference. Three historic but internally
consistent green CI artifacts are not sufficient if master has changed
underlying source bytes. This is proof of source agreement in the checkout,
not an independently witnessed external signature or new model measurement.

The repeat producer must declare `csoai.gspc-repeat-integrity/2` and a bijective raw-row join. Cells mixing provider routes cannot be grouped under only the first observation's route. The index rejects older pre-fix repeat artifacts.

The master freshness gate regenerates the live 34-axis board snapshot from current checkout source, hashes that board, and rejects stale historical coverage artifacts even when raw cell and manifest bytes remain unchanged.


## GitHub workflow input trust

The index refuses pull-request artifacts, even when a fork calls its branch `master`. The publisher fetches the newest trusted push, schedule or manually dispatched event, checks the full GitHub Action API run's owning repository and source repository, expected workflow identity, successful completion, exact run ID, and GitHub compare ancestry from the producer's commit to current protected master. The latest failed or incomplete trusted producer run blocks publication; a historical green result cannot silently replace it. This is a **same-repository run-origin constraint**, not a third-party signature or institutional accreditation.
