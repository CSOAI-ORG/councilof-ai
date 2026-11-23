---
language:
- en
license: mit
task_categories:
- tabular-regression
size_categories:
- 1K<n<10K
tags:
- synthetic
- process-model
- experimental
- council-of-ai
configs:
- config_name: default
  data_files:
  - split: train
    path: train.jsonl
  - split: validation
    path: validation.jsonl
  - split: test
    path: test.jsonl
pretty_name: MEOK synthetic process transitions v0
---
# MEOK synthetic process transitions v0

2,560 transition rows from 320 synthetic episodes of the existing deterministic procurement-rehearsal engine. The data does not represent customers, humans, real procurement behaviour or physical dynamics.

Source engine: `CSOAI-ORG/councilof-ai` at `4070aa6d3140ba10226677840f4873fbedd2467e`. Generator source: https://github.com/CSOAI-ORG/councilof-ai/blob/1571ac990bb954f37a8e21d7677c11d33172d73b/harness/meok-process-lab/train_world.py .

Episode-disjoint splits: train episodes 0–199 (1,600 rows); validation 200–249 (400 rows); test 250–319 (560 rows). Features are previous aggregate state, full synthetic profile proportions, evidence-revocation state, remaining permit ticks, policy mode and tick. Targets are the next aggregate A/B/C/undecided proportions. The full simulator profile counts are privileged observables; performance with partial observation has not been established.

Model: https://huggingface.co/csoai/meok-process-world-v0 . No third-party model outputs or personal data were used. The deterministic fixture is not a validated behavioural forecast. Preserve all splits: tuning against the public test set requires a new untouched evaluation bank. This dataset is not a canonical GSPC benchmark, authority record or signed measurement.

<!-- csoai-card-fixes:start -->

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_meok_process_world_transitions_v0_2026,
  title        = {MEOK synthetic process transitions v0},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/meok-process-world-transitions-v0}},
  url          = {https://huggingface.co/datasets/csoai/meok-process-world-transitions-v0}
}
```

<!-- csoai-card-fixes:end -->
