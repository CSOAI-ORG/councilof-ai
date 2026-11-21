---
language:
- en
license: cc-by-4.0
tags:
- governance
- leaderboard
- measurement
- council-of-ai
- transparency
- ai-governance
pretty_name: GSPC Governance Leaderboard Results
size_categories:
- n<1K
task_categories:
- text-classification
configs:
- config_name: manifest
  data_files:
  - split: train
    path: manifest.jsonl
  default: true
- config_name: results-csv
  data_files:
  - split: train
    path: results.csv
- config_name: results
  data_files:
  - split: train
    path: results.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC Governance Leaderboard Results

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

The results file behind the [csoai/gspc-governance-leaderboard](https://huggingface.co/spaces/csoai/gspc-governance-leaderboard)
Space. `results.jsonl` holds submitted rows — `subject, measured_axes, total_axes, as_of` — and nothing else. It is empty
until a submission is merged, so the dataset viewer is switched off (`viewer: false`) rather than left to error on an
empty file. `results.csv` and `eval.yaml` are the same schema and harness pointer from the August 2026 export, kept as history.

## Submission flow (PR-based)

1. Fork this dataset repository.
2. Add one JSON object per line to `results.jsonl` with the subject's exact name and immutable revision.
3. Open a pull request carrying the signed measurement card the row rests on.
4. A row is merged only when its card verifies at <https://councilof.ai/gspc-verify>. A merged row is still not a board
   cell: the board is `GET https://councilof.ai/api/gspc` and nothing here changes it.

**Lid at 2026-09-06T04:34:06Z:** 22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.

## What is in this repository

| file | bytes | rows | what |
|---|---:|---:|---|
| `README.md` | 1615 |  | card |
| `manifest.jsonl` | 1204 | 5 | derived at 2026-09-06T04:34:06Z |
| `eval.yaml` | 520 |  | file |
| `results.jsonl` | 308 |  | data (one JSON object per line) |
| `results.csv` | 163 |  | data (CSV) |

`manifest.jsonl` is derived from this repository's own file tree at 2026-09-06T04:34:06Z; it lists every file with its
size, its blob hash and a direct URL, so an agent can enumerate the repo without cloning it.

## Citation

```bibtex
@misc{csoai_gspc_gspc_leaderboard_results,
  title        = {gspc-leaderboard-results — Council of AI / GSPC},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face Hub, \url{https://huggingface.co/datasets/csoai/gspc-leaderboard-results}},
  note         = {Live board: https://councilof.ai/api/gspc. Measurement, not certification.}
}
```


<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *GSPC Governance Leaderboard Results*. 2026. Hugging Face dataset `csoai/gspc-leaderboard-results`. https://huggingface.co/datasets/csoai/gspc-leaderboard-results

```bibtex
@misc{csoai_gspc_leaderboard_results,
  title        = {GSPC Governance Leaderboard Results},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/gspc-leaderboard-results},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- council-product-guide:v1 -->
## Reuse and provenance

Download one published file at the recorded revision:

```python
from huggingface_hub import hf_hub_download
path = hf_hub_download(
    repo_id='csoai/gspc-leaderboard-results', repo_type='dataset',
    filename='results.csv',
    revision='e6de4dc17e41db03be4e456a901e8e13096eace3',
)
print(path)
```

Use the file's observation date, scope and licence when reusing it. Repository updates and downloads are not new measurements.

- [Current GSPC board](https://councilof.ai/api/gspc) and [methodology](https://councilof.ai/methodology/).
- [Verify supported signed records](https://councilof.ai/gspc-verify/) and [read corrections](https://councilof.ai/claim-maintenance).
- [Earlier page notes and dated integration announcements](https://huggingface.co/datasets/csoai/gspc-leaderboard-results/blob/e6de4dc17e41db03be4e456a901e8e13096eace3/README.md).

Measurement is not certification. A repository, signed record or passing software test does not by itself establish current board admission, product acceptance or benchmark leadership.
<!-- /council-product-guide:v1 -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `manifest` (default) | `manifest.jsonl` | 5 |
| `results-csv` | `results.csv` | 2 |
| `results` | `results.jsonl` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-leaderboard-results", "manifest", split="train")
```

<!-- csoai-card-fixes:end -->
