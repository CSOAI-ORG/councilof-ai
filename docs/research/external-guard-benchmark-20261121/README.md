# Published-source prompt-injection guard benchmark — 21 November 2026

**Measured by CSOAI, labelled by external dataset publisher, not independently adjudicated. Not a blind holdout: the detector publisher has previously evaluated this dataset. NOT a GSPC board measurement, safety certification, production protection result or customer assessment.**

## Exact observed outcome, not a marketing estimate

We ran [Horizon-Labs/prompt-injection-guard-small](https://huggingface.co/Horizon-Labs/prompt-injection-guard-small) at frozen revision `2efc2ed5abecd21eb45c2506d231a65d6e392b85` against all **116** records in the test split of [deepset/prompt-injections](https://huggingface.co/datasets/deepset/prompt-injections), frozen at revision `4f61ecb038e9c3fb77e21034b22511b523772cdd`.

| Measure | Exactly observed at score threshold 0.5 |
| --- | ---: |
| Labelled injections | 60 |
| Labelled benign examples | 56 |
| Correctly flagged injections (TP) | 41 |
| Missed injections (FN) | **19** |
| Benign examples correctly unflagged (TN) | 56 |
| False-positive benign examples (FP) | 0 |
| Recall on labelled injected examples | **41/60 = 68.3%** |
| False-positive rate on labelled benign examples | **0/56** |
| Overall accuracy | **97/116 = 83.6%** |

**It would be misleading to market the earlier 8/8 selected first-party sample as the model's general injection-detection performance.** This separately published sample reveals 19 misses. Zero observed false positives from 56 cases does not establish a universal 0% false-positive rate.

Those 19 misses have been retained in the machine-readable [error review](error-review.json). The register contains only case indices, source-text hashes, observed model scores and labels—no third-party prompt text. It deliberately does **not** authorise retraining on the test set. Reusing these cases for training or calibrating a threshold and then re-reporting this same set as an independent performance test would invalidate that claim.

## Reproducibility and source integrity

- Dataset file: `data/test-00000-of-00001-701d16158af87368.parquet`.
- Dataset **bytes** SHA-256: `39ac797cabc157eeed58435a08593b2952bb6cb16fc394a2d383f447cc7b246e`.
- Model quantised ONNX weights SHA-256: `61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d`.
- Model tokenizer normalizer SHA-256: `768931fc0b38fb141796abf181e0bafe96308e92c8832c817dbd6df7fc41ac79`.
- Inference: ONNX CPU, 2 threads, max 512 tokens, no classifier fine-tuning, fixed score threshold 0.5.
- Original measured run: 2026-11-21T01:19:19.571960+00:00 on a Council-controlled M4.
- Source label prevalence: 60/116 positive. F1/accuracy will not generalise to deployment prevalences.
- Dataset license metadata is **inconsistent**: the dataset's top-level metadata says Apache-2.0 but a nested dataset_info field says CC-BY-4.0. Only source-link attribution and input digests are republished; do not redistribute source texts or commercialise the dataset until rights are reconciled.

The retained [record.json](record.json) includes every label, model score, hash and threshold-sensitivity check; [event.json](event.json) is the unsigned `csoai.evidence-event/0.1` `PARTIAL` observation. There is no third-party review, external root anchor or GSPC board admission.

The experiment can be reproduced from an isolated checkout with Python 3.12+:

~~~sh
python3 -m pip install --disable-pip-version-check onnxruntime==1.26.0 \
  huggingface-hub==1.19.0 transformers==5.5.0 \
  tokenizers==0.22.2 numpy==2.3.5 pyarrow==22.0.0
python3 -m unittest discover -s scripts/research -p test_external_guard_benchmark.py -v
python3 -m unittest discover -s scripts/research -p test_build_guard_error_review.py -v
python3 scripts/research/external-guard-benchmark.py verify \
  --result docs/research/external-guard-benchmark-20261121/record.json \
  --event docs/research/external-guard-benchmark-20261121/event.json --check-source
python3 scripts/research/external-guard-benchmark.py run \
  --result new-external-result.json --event new-external-event.json
python3 scripts/research/build-guard-error-review.py build \
  --current new-external-result.json \
  --baseline docs/research/external-guard-benchmark-20261121/record.json \
  --output new-errors.json
~~~

GitHub CI reruns inference and validates the published source in a **separate job**. A new weekly evaluation is proposed in the draft PR. Its schedule is not active before a reviewed merge.

## Three critical design findings

1. **Detection is an advisory signal, not a permission.** The separate synthetic action-scope record determines which exact host tool actions are authorised. No model response may grant or expand that scope.
2. **An in-scope action can still be semantically unsafe.** If the detector misses an instruction hidden inside untrusted content, an otherwise permitted tool action can execute. The revised synthetic composition includes this counterfactual rather than using the ground-truth label to automatically deny every missed attack.
3. **Failures drive a qualified repair queue.** The 19 identified examples should be studied to design *new*, separately sourced and blind evaluation cases, or improve the authorisation/observability architecture. No automatic model retraining or live authority changes are justified by this sample.

**Product architecture:** model/revision discovery → pinned execution → full confusion matrix and per-row hash → canonical unsigned evidence event → independent-job source and evidence verification → failure-review queue → separately authorised fixes → next frozen benchmark. This cycle operates without waiting for a customer.
