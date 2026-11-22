---
title: MEOK Hybrid Research Lab
emoji: 🧭
colorFrom: blue
colorTo: green
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: Pinned process inference and reproducible research evidence
---

# MEOK Hybrid Research Lab

**Public user-journey release: 11 November 2026.** This repository hosts small, reproducible research applications. It is not the general-purpose private MEOK chat model, a production approval system, or a GSPC-certified product.

## Consolidated release and owner lineage

[Open the existing 11 November consolidated release](release-20261111/index.html) or read its [REPORT.md](release-20261111/REPORT.md). This quality pass adopts its root stale-result/generation guard and 18-check actual-UI contract suite; it does not replace that work. The reproduction-integrity correction and refreshed receiver acceptance remain in their existing directories. The additional changes here bind dataset identity, improve the quiz/export journeys and add the dated quality register. Historical source pins remain original snapshots; current composition is listed in SOURCE_MANIFEST.json.

## Choose the right journey

| Journey | What you can do | Actual scope |
|---|---|---|
| [Single-model lab](index.html) | Load a retained row, compare outputs, inspect worst error, replay 560 rows and export a receipt | Real inference over one pinned 980-parameter synthetic process predictor; browser CPU |
| [Six-checkpoint research](research-v03/index.html) | Replay 1,200 transitions across six variants, export the result, and complete eight practice questions | 7,200 inference evaluations; published synthetic cases, not new training |
| [Specialist receiver release](integration-specialist-review/presentation-v1/index.html) | Inspect the deployed receiver's source, tests and limits | Public report; the live receiver itself requires authorised access to the existing private Space |
| [Quality and evidence guide](release-quality/index.html) | Inspect the claim register, current test coverage and receipt verification instructions | Dated release assurance, not a guarantee of universal correctness |

The public pages run locally in your browser after loading their research artifacts. They do not call an LLM provider or launch a Hugging Face Job. Historical model training and earlier GPU experiments are separate; this does **not** mean the entire programme has never used paid compute.

## Research results, with their limits

The original constrained model's retained mean error is about 0.2880 percentage points; its worst error is about 74.9908 percentage points. A fitted output-head candidate is retained in v0.3, but it is not automatically promoted. The exact synthetic rules remain better on their own known generator. Read the [methods paper](research-v03/WHITEPAPER.md) and [exact numerical results](research-v03/results.json); do not substitute an average for the failure distribution.

The two banks contain 560 original held-out transitions and 640 later-generated same-generator transitions. After inspection, neither bank is a fresh future blind test. None represents customers, physical dynamics, or general chat capability. There was no new fitting, Cosmos retraining, model weight change or GSPC admission in the 11 November public-quality release.

## Reproduce and verify

With Node 22 or later, from a downloaded checkout:

```sh
node test.mjs
node research-v03/test.mjs
node release-quality/test-quality.mjs
node release-quality/verify-receipt.mjs /path/to/exported-receipt.json
```

The original test scripts regenerate their own local JSON result files. Use a scratch checkout when preserving a downloaded evidence snapshot. The new receipt verifier checks the checksum, declared research flags and expected local model/data pins; it does not verify a signature, producer identity, independent source truth or the numerical result itself. Replaying the model is a separate check. Older receipts without dataset identity may be refused by this verifier rather than silently treated as fully bound.

## Private runtime and historical records

[MCP guide](MCP.md) distinguishes the public research pages from the private runtime and explains authentication boundaries. The dated JSON files under `evidence/`, `research-v03/` and the receiver directory retain earlier acceptance results. They are not live health indicators. Current release checks are listed in the [quality record](release-quality/README.md).

Original model and dataset cards in `model/README.md` and `data/README.md` are retained upstream snapshots. This Space vendors only the inference/test artifacts needed by its pages; use their canonical repositories for complete training code or all data splits.

Canonical model: https://huggingface.co/csoai/meok-process-world-v0 at `90d6aa6c87629b9f4296142ba2019247b51686c4`.
Canonical dataset: https://huggingface.co/datasets/csoai/meok-process-world-transitions-v0 at `4a522537c9eb1522a3aad1432e9626e72e3a2733`.
Model/data ownership: https://github.com/CSOAI-ORG/councilof-ai/pull/4176 . Categorical receiver ownership: https://github.com/CSOAI-ORG/councilof-ai/pull/4180 .

Original LICENSE/NOTICE files remain with their artifacts. No personal conversations, approval authority, credentials or private training data belong in this public repository.

## 11 November: qualified arithmetic and consolidation

[Open the new release](https://csoai-meok-oowm-hybrid-lab.static.hf.space/consolidation-20261111/index.html) for a local exact-calculation demonstration, the existing component map, a retained failed model-to-program experiment, reproducible source/tests and dependency-ordered next steps. No model weights, private memory or public GSPC ranking are changed by this public extension. See the release metadata for post-publication readback.

## Cross-platform execution — 11 November 2026

[Open the actual Cloudflare + Kaggle execution page](platform-execution-20261111/index.html), [read the measured results](platform-execution-20261111/REPORT.md), or [inspect the public Kaggle replay](https://www.kaggle.com/code/nicktempleman/meok-cross-platform-replay-20261111). A pinned 1.5B model produced 72 real Kaggle GPU answers; the current conversation wrapper hurt exact-format science performance in this small paired sample. The unchanged 980-parameter synthetic model was separately replayed and cross-checked against live Cloudflare inference. Neither experiment establishes a top-tier model or a weight-training improvement. The existing private chat and production site remain unchanged.

## Actual Cosmos task-contract follow-up

[Inspect the completed negative result](platform-execution-20261111/cosmos-task-contract/index.html): 72 actual paired generations, no demonstrated gain from task-only prompting, no default-chat or model-weight change. A consent-gated experimental task interface, standalone grader controls and private raw evidence are retained. Format acceptance is not factual correctness.

## Existing EAT fold integrity — 12 November source candidate

[Inspect the repaired EAT fold, qualification and canonical source package](eat-fold-integrity-20261112/index.html). The current [PR #4239](https://github.com/CSOAI-ORG/councilof-ai/pull/4239) head is `14151ea319a6dc433a107698a0a90b1fb59faf59`. It has 54 new regression methods plus existing G2/honesty tests, including actual Python 3.11/3.12 Linux CI. The first full CI failure is retained: historical missing signature/state metadata is now preserve-only, never invented as authority. The exact master snapshot is a no-write replay: 27 owned staged atoms, including 19 preserved legacy records; 11,507 other-writer rows remain explicitly delegated/unverified. The separate eight-surface feed is reconciled only in a copy. This is a review candidate, not a merge, live EAT installation, signature, model training or new measurement.


## New: MEOK partial-observation v1

[Open the interactive browser demo](partial-observation-v1/index.html). The new candidate uses twelve observable inputs, three-model output averaging and explicit post-inference rules. Its fresh held-out test MAE is 0.01885 after those rules, compared with 0.02345 for the best single partial-input network. The original v0 comparator sees three privileged hidden features and is not a like-for-like comparison.

- Model: https://huggingface.co/csoai/meok-process-world-partial-v1
- Dataset: https://huggingface.co/datasets/csoai/meok-process-world-partial-transitions-v1
- Source and reproducibility: https://github.com/CSOAI-ORG/councilof-ai/pull/4285

Synthetic procurement-process research only; not a physical world model or action authority.

<!-- csoai-card-fixes:start -->

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** This Space displays measurements recorded by Council of AI (CSOAI Ltd) under the stated method and date. What it shows is not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act).

## Citation

```bibtex
@misc{csoai_meok_oowm_hybrid_lab_2026,
  title        = {MEOK Hybrid Research Lab},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/spaces/csoai/meok-oowm-hybrid-lab}},
  url          = {https://huggingface.co/spaces/csoai/meok-oowm-hybrid-lab}
}
```

<!-- csoai-card-fixes:end -->
