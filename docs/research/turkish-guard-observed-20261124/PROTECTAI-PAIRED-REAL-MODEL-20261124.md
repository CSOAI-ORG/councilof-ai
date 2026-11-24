# A real same-case model comparison: Protect AI vs Horizon Labs — 24 November 2026

**Actually executed on Apple M4 CPU, no prompts fabricated. Self-run and unsigned, not blind, not provider-endorsed, not a GSPC board measurement, not a real agent effect and not a frontier GPT/Claude/Gemini comparison.**

## Before seeing the result

Frozen source: [deepset/prompt-injections](https://huggingface.co/datasets/deepset/prompt-injections) 116-row test split, repo revision `4f61ecb038e9c3fb77e21034b22511b523772cdd`, exact Parquet file digest `39ac797cabc157eeed58435a08593b2952bb6cb16fc394a2d383f447cc7b246e`. Source labels: **60 injection**, **56 benign**. Existing prior Horizon run from 21 November is retained independently and checked against every original input digest. No new label authoring or regrading. One frozen score threshold 0.5 on both models, with the original model's exact weights/probabilities.

New model: [protectai/deberta-v3-base-prompt-injection-v2](https://huggingface.co/ProtectAI/deberta-v3-base-prompt-injection-v2), Apache-2.0 model metadata, repo revision `90c9989b1a342275dd0d1a95aad283c04e075671`, source ONNX weights SHA-256 `f0ea7f239f765aedbde7c9e163a7cb38a79c5b8853d3f76db5152172047b228c` (738,563,188 actual bytes). Previously measured model: [Horizon-Labs/prompt-injection-guard-small](https://huggingface.co/Horizon-Labs/prompt-injection-guard-small) at revision `2efc2ed5abecd21eb45c2506d231a65d6e392b85`, ONNX weight digest `61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d`.

## Actual same-input result

| Measure | Horizon Labs, original observed 21 Nov | Protect AI, new observed 24 Nov |
| --- | ---: | ---: |
| Attacks detected | **41/60 (68.3%)** | **22/60 (36.7%)** |
| Attacks missed | 19 | **38** |
| Benign accepted | 56/56 | 56/56 |
| Benign incorrectly flagged | 0/56 | 0/56 |
| Accuracy in this specific labelled source | 97/116 (83.6%) | 78/116 (67.2%) |

Because all 116 original case hashes were matched, this supports a real **paired** comparison on exactly the same source bank. **20 cases were correct under Horizon and wrong under Protect AI, versus one correct under Protect AI and wrong under Horizon.** An exact two-sided McNemar test for the discordant cases returned `p=0.00002098`. The new Protect AI CPU inference pass took **3.118 seconds after model/session loading**, not an end-to-end production service latency. The actual Protect AI model was executed; this is not a read of its marketing model card.

**Do not extrapolate:** the 116 examples are a small, previously published, third-party-labelled and potentially training-contaminated sample. The original Horizon publisher has evaluated this bank before. Two specialist detectors cannot be used to declare the best frontier model, to infer how real GPT/Claude/Gemini agents behave, or to claim prevention. Both observed zero benign false alarms in only 56 benign examples; the true deployment false-alarm rate is not proven zero. The source dataset licence metadata is internally inconsistent (top-level Apache-2.0 vs nested CC-BY-4.0), therefore **no raw source prompt text** appears in this report or machine record.

## Immutable original method and measurements

- Exact preregistered new comparison method: `scripts/research/paired_protectai_english.py`, SHA-256 `ae5e28c9b3ce483f9146ab53d746df963b2417984c1c163e89edcb4b3693c347` (before observed model inference).
- Original observed new model output: [protectai-paired-english-observation.json](protectai-paired-english-observation.json), SHA-256 `7dc2a6eb7fde579ae5c83e37a42973015fe06bae686b9d784dd3d222cdb3419d`, including 116 matched case hashes, non-text classification scores and original-case correctness comparisons.
- The prior Horizon baseline remains in [the 21 November source-preserving benchmark](../external-guard-benchmark-20261121/README.md), not rewritten or silently pooled with a new test bank.

## Runnable reproducibility

Obtain authorized copies of the exact pinned public Parquet, prior original record and Protect AI ONNX model snapshot; do **not** train on the sample or retrieve private agent logs. Execute:

```sh
python3 scripts/research/paired_protectai_english.py --data /PATH/TO/pinned-test.parquet --baseline docs/research/external-guard-benchmark-20261121/record.json --model-dir /PATH/TO/pinned-protectai-model-root --output independent-paired-result.json
python3 -m unittest discover -s scripts/research -p test_paired_protectai_english.py -v
```

Method refuses mismatched original input text SHA, different source/model identity, changed old labels or threshold, altered denominator, unexpected ONNX signature and missing model bytes. A full **second-process model rerun by a different real institution is not yet evidenced**; GitHub source tests alone do not reproduce inference. No signed human approval, MEOK action or external buyer acceptance exists.

## Possible product benefit

The observed model difference, the Turkish benign-task false-alarm concentration and the separate NotInject hard-negatives provide the first three **real test populations** of an independent model measurement service. The proposed USP is verifiable, rights-aware *quality and authority evidence across different vendors*, not claiming that Council owns, trained or automatically improves the underlying providers' models. Any production product must measure downstream actual agent effects separately and keep the human/receiving-party authorisation chain explicit.
