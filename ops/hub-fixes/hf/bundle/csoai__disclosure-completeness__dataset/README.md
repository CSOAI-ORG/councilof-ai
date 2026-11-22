---
license: cc-by-4.0
pretty_name: Disclosure completeness of public AI benchmark artifacts
tags:
- measurement
- benchmarks
- disclosure
- provenance
- council-of-ai
size_categories:
- n<1K
language:
- en
configs:
- config_name: disclosure-completeness-epoch-date-and-n-record
  data_files:
  - split: train
    path: disclosure-completeness-*/epoch-date-and-n/record.json
  default: true
- config_name: disclosure-completeness-epoch-date-and-n-record-signed
  data_files:
  - split: train
    path: disclosure-completeness-*/epoch-date-and-n/record.signed.json
- config_name: disclosure-completeness-lmarena-publish-lag-record
  data_files:
  - split: train
    path: disclosure-completeness-*/lmarena-publish-lag/record.json
- config_name: disclosure-completeness-lmarena-publish-lag-record-signed
  data_files:
  - split: train
    path: disclosure-completeness-*/lmarena-publish-lag/record.signed.json
- config_name: disclosure-completeness-openrouter-hf-declared-fields-record
  data_files:
  - split: train
    path: disclosure-completeness-*/openrouter-hf-declared-fields/record.json
- config_name: disclosure-completeness-openrouter-hf-declared-fields-record-json
  data_files:
  - split: train
    path: disclosure-completeness-*/openrouter-hf-declared-fields/record.signed.json
- config_name: disclosure-completeness-swebench-logs-pointer-record
  data_files:
  - split: train
    path: disclosure-completeness-*/swebench-logs-pointer/record.json
- config_name: disclosure-completeness-swebench-logs-pointer-record-signed
  data_files:
  - split: train
    path: disclosure-completeness-*/swebench-logs-pointer/record.signed.json
- config_name: ots-upgraded-ots-upgrade
  data_files:
  - split: train
    path: ots-upgraded/*/OTS-UPGRADE.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Disclosure completeness of public AI benchmark artifacts

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Signed, dated records of what four public AI benchmark artifacts state about themselves. Published by
Council of AI (CSOAI Ltd, England and Wales, no. 16939677). Human page:
https://councilof.ai/measurements/disclosure-completeness

**These records count what each artifact states. They do not rank, grade or compare any model or platform, and they are
not certifications.** Where something was not measured, the record says UNMEASURED and gives no number.

## Set 2026-09-30

| Record | What it measures | Result |
|---|---|---|
| `swebench-logs-pointer` | SWE-bench `leaderboards.json`: entries that state a logs pointer | 287 of 323. Whether the pointers resolve: UNMEASURED (none requested) |
| `epoch-date-and-n` | Epoch AI `benchmark_data.zip`: result rows that state a result date and a sample size | 11,112 rows in 87 files: 6,189 state a date, 330 state n, 33 both |
| `lmarena-publish-lag` | LMArena HF dataset: lag from the stated as-of date to each config's latest push; rows stating n | 22 configs; 29,394 of 29,394 rows state n; lag 3.03 to 27.10 h (the as-of is a date, so a 24 h band) |
| `openrouter-hf-declared-fields` | OpenRouter `context_length` vs the named Hugging Face repo's `config.json` | 178 models: 105 agree, 56 differ (both values named), 17 UNMEASURED. Licence agreement UNMEASURED on all 178 (OpenRouter declares no licence field) |

The figures above are copied from `set.json`; the records are the authority.

## Files

`disclosure-completeness-2026-09-30/` is byte-identical to https://councilof.ai/interop/disclosure-completeness-2026-09-30/:
`set.json`, `verify.py`, `method/adapters.py` (the measurement code, pinned by sha256 in every record), and per record
`record.json`, `record.signed.json` (Ed25519, `did:web:csoai.org#board-attestation-1`) and `record.json.ots`
(OpenTimestamps, pending Bitcoin commitment at publication).

## Verify

```
cd disclosure-completeness-2026-09-30
python3 verify.py                      # bytes + signatures, key from https://csoai.org/.well-known/did.json
python3 verify.py --recompute BLOBDIR  # re-run each measurement from its input bytes (named by sha256)
```

Input bytes are not republished here because their licences differ; each record names its source URLs and pins each
input by sha256.

## Sources and licences

- Epoch AI, "Capabilities & benchmarking". Published online at epoch.ai. Retrieved from https://epoch.ai/benchmarks (CC BY 4.0).
- LMArena, Hugging Face dataset `lmarena-ai/leaderboard-dataset` (CC BY 4.0). Ratings and ranks are not read into the record.
- SWE-bench, `leaderboards.json` (swe-bench.github.io). A catalogue states CC BY-NC 4.0; the GitHub licence field reads NOASSERTION. Only our counts and the upstream's own entry identifiers are published.
- OpenRouter `/api/v1/models` (API terms, not a data licence) and each named Hugging Face repository. Only declared context-length numbers and repository ids are published.

Our records: CC BY 4.0, attribute "Council of AI, CSOAI Ltd, councilof.ai". Corrections: https://councilof.ai/corrections


## Citation

```bibtex
@misc{csoai_disclosure_completeness,
  title  = {csoai/disclosure-completeness},
  author = {{CSOAI Ltd}},
  year   = {2026},
  howpublished = {\url{https://huggingface.co/datasets/csoai/disclosure-completeness}},
  note   = {Measurement, not certification. Licence: cc-by-4.0}
}
```

<!-- DATA-ACCESS:START -->
## Read this product

This is a structured evidence archive, not a training table. The automatic table viewer is disabled because the repository contains documents with different schemas, signatures or timestamp proofs. All original evidence files remain available.

```python
import json
from huggingface_hub import hf_hub_download
path = hf_hub_download("csoai/disclosure-completeness", "disclosure-completeness-2026-09-30/set.json", repo_type="dataset")
with open(path, encoding="utf-8") as source:
    document = json.load(source)
records = document["records"]
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `disclosure-completeness-epoch-date-and-n-record` (default) | `disclosure-completeness-*/epoch-date-and-n/record.json` | 1 |
| `disclosure-completeness-epoch-date-and-n-record-signed` | `disclosure-completeness-*/epoch-date-and-n/record.signed.json` | 1 |
| `disclosure-completeness-lmarena-publish-lag-record` | `disclosure-completeness-*/lmarena-publish-lag/record.json` | 1 |
| `disclosure-completeness-lmarena-publish-lag-record-signed` | `disclosure-completeness-*/lmarena-publish-lag/record.signed.json` | 1 |
| `disclosure-completeness-openrouter-hf-declared-fields-record` | `disclosure-completeness-*/openrouter-hf-declared-fields/record.json` | 1 |
| `disclosure-completeness-openrouter-hf-declared-fields-record-json` | `disclosure-completeness-*/openrouter-hf-declared-fields/record.signed.json` | 1 |
| `disclosure-completeness-swebench-logs-pointer-record` | `disclosure-completeness-*/swebench-logs-pointer/record.json` | 1 |
| `disclosure-completeness-swebench-logs-pointer-record-signed` | `disclosure-completeness-*/swebench-logs-pointer/record.signed.json` | 1 |
| `ots-upgraded-ots-upgrade` | `ots-upgraded/*/OTS-UPGRADE.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/disclosure-completeness", "disclosure-completeness-epoch-date-and-n-record", split="train")
```

<!-- csoai-card-fixes:end -->
