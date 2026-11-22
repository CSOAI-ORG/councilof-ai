---
license: cc-by-4.0
pretty_name: mill jobs staging
size_categories:
- 10K<n<100K
configs:
- config_name: safety-skip
  data_files:
  - split: train
    path: safety/*/skip.jsonl
  default: true
- config_name: detector-interop-skip
  data_files:
  - split: train
    path: detector-interop/*/skip.jsonl
- config_name: cross-reality-skip
  data_files:
  - split: train
    path: cross-reality/*/skip.jsonl
- config_name: conformance-skip
  data_files:
  - split: train
    path: conformance/*/skip.jsonl
- config_name: jail-skip
  data_files:
  - split: train
    path: jail/*/skip.jsonl
- config_name: care-skip
  data_files:
  - split: train
    path: care/*/skip.jsonl
- config_name: dead-care
  data_files:
  - split: train
    path: dead/care/*.jsonl
- config_name: care-dead-slugs
  data_files:
  - split: train
    path: care/*/dead_slugs.jsonl
- config_name: dead-governance
  data_files:
  - split: train
    path: dead/governance/*.jsonl
- config_name: dead-safety
  data_files:
  - split: train
    path: dead/safety/*.jsonl
- config_name: dead-swarm
  data_files:
  - split: train
    path: dead/swarm/*.jsonl
- config_name: dead-detector-interop
  data_files:
  - split: train
    path: dead/detector-interop/*.jsonl
- config_name: jail-dead-slugs
  data_files:
  - split: train
    path: jail/*/dead_slugs.jsonl
- config_name: governance
  data_files:
  - split: train
    path: governance/*/*.jsonl
- config_name: safety
  data_files:
  - split: train
    path: safety/*/*.jsonl
- config_name: conformance-dead-slugs
  data_files:
  - split: train
    path: conformance/*/dead_slugs.jsonl
- config_name: governance-dead-slugs
  data_files:
  - split: train
    path: governance/*/dead_slugs.jsonl
- config_name: safety-dead-slugs
  data_files:
  - split: train
    path: safety/*/dead_slugs.jsonl
- config_name: detector-interop-dead-slugs
  data_files:
  - split: train
    path: detector-interop/*/dead_slugs.jsonl
- config_name: cross-reality-dead-slugs
  data_files:
  - split: train
    path: cross-reality/*/dead_slugs.jsonl
- config_name: detector-interop-sample
  data_files:
  - split: train
    path:
    - detector-interop/shard-0-of-2/items-detector-1af34639f9a4.jsonl
    - detector-interop/shard-0-of-2/items-detector-27e4325e7165.jsonl
    - detector-interop/shard-0-of-2/items-detector-2ca7c806021e.jsonl
    - detector-interop/shard-0-of-2/items-detector-604bb518b7d5.jsonl
    - detector-interop/shard-0-of-2/items-detector-7ea26f292bc1.jsonl
    - detector-interop/shard-0-of-2/items-detector-8d644c81ddcc.jsonl
    - detector-interop/shard-0-of-2/items-detector-9656ebd35cbb.jsonl
    - detector-interop/shard-0-of-2/items-detector-ae480c8afdc2.jsonl
    - detector-interop/shard-0-of-2/items-detector-b8d01c80b0fb.jsonl
    - detector-interop/shard-0-of-2/items-detector-c89e352c21b0.jsonl
    - detector-interop/shard-0-of-2/items-detector-d68d01be4959.jsonl
    - detector-interop/shard-0-of-2/items-detector-e5b5476f2ed8.jsonl
    - detector-interop/shard-0-of-2/items-detector-ec22ca353fb0.jsonl
    - detector-interop/shard-0-of-2/items-detector-f8a76e634de2.jsonl
    - detector-interop/shard-0-of-2/items-detector-fdf93eae4bf6.jsonl
    - detector-interop/shard-1-of-2/items-detector-14877d8dcab8.jsonl
    - detector-interop/shard-1-of-2/items-detector-1a580724ff49.jsonl
    - detector-interop/shard-1-of-2/items-detector-2d7bdbd569f6.jsonl
    - detector-interop/shard-1-of-2/items-detector-399a4111d002.jsonl
    - detector-interop/shard-1-of-2/items-detector-6554298054c3.jsonl
    - detector-interop/shard-1-of-2/items-detector-6c4f74f03a03.jsonl
    - detector-interop/shard-1-of-2/items-detector-a17772c48ff2.jsonl
    - detector-interop/shard-1-of-2/items-detector-a2cb7566811f.jsonl
    - detector-interop/shard-1-of-2/items-detector-a36b8d8516ee.jsonl
    - detector-interop/shard-1-of-2/items-detector-a9fe9142192b.jsonl
    - detector-interop/shard-1-of-2/items-detector-ad0fc63d2db2.jsonl
    - detector-interop/shard-1-of-2/items-detector-b04b9ae5feca.jsonl
    - detector-interop/shard-1-of-2/items-detector-bf342ef47483.jsonl
    - detector-interop/shard-1-of-2/items-detector-bf6db6484b8c.jsonl
    - detector-interop/shard-1-of-2/items-detector-c2fa6faac59c.jsonl
    - detector-interop/shard-1-of-2/items-detector-d290740f278f.jsonl
    - detector-interop/shard-1-of-2/items-detector-d760d1515fc5.jsonl
    - detector-interop/shard-1-of-2/items-detector-dd669ab42ad8.jsonl
- config_name: cross-reality-sample
  data_files:
  - split: train
    path:
    - cross-reality/shard-0-of-2/items-cross-re-537a0b772035.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-7176e3bdfeea.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-73a8bf0a4f81.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-8b5e038e0556.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-96006388d8a3.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-cb9d4ad44c48.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-cc9718ccf99f.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-d514bac6a58e.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-d8760d352a56.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-e0433a614a90.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-e647a54ecf1e.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-fb5b80928a1c.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-0d295057d28f.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-1ddf3ad40902.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-338d669d9d19.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-4279321c00b0.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-446f58ee52d5.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-506e2955d145.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-587f7b4506da.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-5b952f126809.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-964dedec824d.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-9792970cb086.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-c7e307480675.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-c82733bb1bca.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-cbdeff6eb0bf.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-ccb43ef8295b.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-f0db0d2f661a.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-f6c9ea806fc7.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-fba9eb415365.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-ff66619ca987.jsonl
- config_name: root-json-sample
  data_files:
  - split: train
    path:
    - art5-safeguard/shard-0-of-2/items-art5-saf-062eea7b6f47.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-10137f2fe563.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-2aebf403c28e.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-2c2caa11740e.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-301b42bf0c50.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-35bcee0604da.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-5e100e2ecbfb.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-604d31898e4e.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-6fb5cc441238.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-715804e7fec4.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-8afc893e13c0.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-a764e6e48584.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-c66d5d220b97.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-caa182440566.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-caf5d9058da7.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-e5d8866c9578.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-f0070c2700d1.jsonl
    - art5-safeguard/shard-0-of-2/items-art5-saf-f8b421f699e1.jsonl
- config_name: affect-sample
  data_files:
  - split: train
    path:
    - affect/shard-1-of-2/items-affect-031c23a8cad2.jsonl
    - affect/shard-1-of-2/items-affect-286a050bb590.jsonl
    - affect/shard-1-of-2/items-affect-33de50d1946e.jsonl
    - affect/shard-1-of-2/items-affect-3447074290fb.jsonl
    - affect/shard-1-of-2/items-affect-39a19b355ad4.jsonl
    - affect/shard-1-of-2/items-affect-414154fa5981.jsonl
    - affect/shard-1-of-2/items-affect-41842fbd4861.jsonl
    - affect/shard-1-of-2/items-affect-5a71ba78c289.jsonl
    - affect/shard-1-of-2/items-affect-6c9b92f9d3aa.jsonl
    - affect/shard-1-of-2/items-affect-8759a021ae8c.jsonl
    - affect/shard-1-of-2/items-affect-8e362f16533f.jsonl
    - affect/shard-1-of-2/items-affect-9c0e38d46ce3.jsonl
    - affect/shard-1-of-2/items-affect-9cd9515ace98.jsonl
    - affect/shard-1-of-2/items-affect-a3413c75d5dd.jsonl
    - affect/shard-1-of-2/items-affect-bd2e446f5c64.jsonl
    - affect/shard-1-of-2/items-affect-c728f6df88e5.jsonl
    - affect/shard-1-of-2/items-affect-cb4c43436c54.jsonl
    - affect/shard-1-of-2/items-affect-d2f0a31d25db.jsonl
- config_name: cross-reality-v2-sample
  data_files:
  - split: train
    path:
    - cross-reality/shard-0-of-2/items-cross-re-7af088c7ac5b.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-98db79bc9fda.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-af3646904df5.jsonl
    - cross-reality/shard-0-of-2/items-cross-re-d8fbbee2dcfd.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-03dfe2403352.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-2c6863963f45.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-58261db04d62.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-bd5db5a84153.jsonl
    - cross-reality/shard-1-of-2/items-cross-re-cd60c3812b8d.jsonl
tags:
- council-of-ai
language:
- en
---
<!-- csoai-card-fixes:start -->

# mill jobs staging

TODO(owner): one-paragraph description of what this repository holds, who produced it and the observation date.

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `safety-skip` (default) | `safety/*/skip.jsonl` | 2844 |
| `detector-interop-skip` | `detector-interop/*/skip.jsonl` | 1957 |
| `cross-reality-skip` | `cross-reality/*/skip.jsonl` | 1953 |
| `conformance-skip` | `conformance/*/skip.jsonl` | 888 |
| `jail-skip` | `jail/*/skip.jsonl` | 869 |
| `care-skip` | `care/*/skip.jsonl` | 837 |
| `dead-care` | `dead/care/*.jsonl` | 468 |
| `care-dead-slugs` | `care/*/dead_slugs.jsonl` | 453 |
| `dead-governance` | `dead/governance/*.jsonl` | 308 |
| `dead-safety` | `dead/safety/*.jsonl` | 308 |
| `dead-swarm` | `dead/swarm/*.jsonl` | 280 |
| `dead-detector-interop` | `dead/detector-interop/*.jsonl` | 280 |
| `jail-dead-slugs` | `jail/*/dead_slugs.jsonl` | 274 |
| `governance` | `governance/*/*.jsonl` | ≥100 (streamed sample) |
| `safety` | `safety/*/*.jsonl` | ≥100 (streamed sample) |
| `conformance-dead-slugs` | `conformance/*/dead_slugs.jsonl` | 39 |
| `governance-dead-slugs` | `governance/*/dead_slugs.jsonl` | 32 |
| `safety-dead-slugs` | `safety/*/dead_slugs.jsonl` | 32 |
| `detector-interop-dead-slugs` | `detector-interop/*/dead_slugs.jsonl` | 4 |
| `cross-reality-dead-slugs` | `cross-reality/*/dead_slugs.jsonl` | 4 |
| `detector-interop-sample` | `detector-interop/shard-0-of-2/items-detector-1af34639f9a4.jsonl`, `detector-interop/shard-0-of-2/items-detector-27e4325e7165.jsonl`, `detector-interop/shard-0-of-2/items-detector-2ca7c806021e.jsonl` … (+30) | 990 |
| `cross-reality-sample` | `cross-reality/shard-0-of-2/items-cross-re-537a0b772035.jsonl`, `cross-reality/shard-0-of-2/items-cross-re-7176e3bdfeea.jsonl`, `cross-reality/shard-0-of-2/items-cross-re-73a8bf0a4f81.jsonl` … (+27) | 900 |
| `root-json-sample` | `art5-safeguard/shard-0-of-2/items-art5-saf-062eea7b6f47.jsonl`, `art5-safeguard/shard-0-of-2/items-art5-saf-10137f2fe563.jsonl`, `art5-safeguard/shard-0-of-2/items-art5-saf-2aebf403c28e.jsonl` … (+15) | 540 |
| `affect-sample` | `affect/shard-1-of-2/items-affect-031c23a8cad2.jsonl`, `affect/shard-1-of-2/items-affect-286a050bb590.jsonl`, `affect/shard-1-of-2/items-affect-33de50d1946e.jsonl` … (+15) | 540 |
| `cross-reality-v2-sample` | `cross-reality/shard-0-of-2/items-cross-re-7af088c7ac5b.jsonl`, `cross-reality/shard-0-of-2/items-cross-re-98db79bc9fda.jsonl`, `cross-reality/shard-0-of-2/items-cross-re-af3646904df5.jsonl` … (+6) | 270 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/mill-jobs-staging", "safety-skip", split="train")
```

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_mill_jobs_staging_2026,
  title        = {mill jobs staging},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/mill-jobs-staging}},
  url          = {https://huggingface.co/datasets/csoai/mill-jobs-staging}
}
```

<!-- csoai-card-fixes:end -->
