---
license: cc-by-4.0
language:
- en
pretty_name: GSPC — Hugging Face model census (5 September 2026 sample)
tags:
- ai-governance
- measurement
- benchmark
- model-census
- gspc
- transparency
- council-of-ai
task_categories:
- other
size_categories:
- 10K<n<100K
configs:
- config_name: default
  data_files:
  - split: train
    path: models.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC — Hugging Face model census (5 September 2026 sample)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

> **Correction, 25 September 2026:** This is a frozen sample of 20,000 Hub model IDs observed at `2026-09-05T05:34:58Z`, not a census of every model on Hugging Face. All 20,000 saved rows say `UNMEASURED`, `measured_axes: 0` and `unmeasured_axes: 22` with 22 saved axis slugs. That describes this dated file, not each model's current measurement state. The [public GSPC board](https://councilof.ai/api/gspc) returned 23 axes and 23 axes with runs on 25 September; its response is the authority for current board scope. The stored rows were **not** rebuilt or promoted to 23-axis measurements by this card correction.

## Why version 0.2 changed the denominator

The older 0.1 sample used 14 `unmeasured_axes` per row. Version 0.2 read 22 axis slugs from the board at its 5 September build and saved 20,000 rows using that dated scope. Reading the board at build time prevents a hard-coded mismatch during that build; it does **not** keep the published rows synchronized when the board later changes.

The saved 22 axis slugs are:

`governance` · `safety` · `provenance` · `continuity` · `conformance` · `openness` ·
`machinery-conformity` · `care` · `cross-reality` · `detector-interop` · `art5-safeguard` ·
`swarm` · `affect` · `jail` · `provenance-controls` · `reserve-attestation` ·
`regulatory-framework` · `distribution-integrity` · `custody-disclosure` ·
`ai-adoption-components` · `labour-components` · `humanoid-labour-index`

## What this file is not

It is **not a ranking, not a score, and not a judgement of any model listed**. Presence in this
census says only that the model ID was observed in the 5 September Hub sample and recorded
`UNMEASURED` in this file at that time. Check the live board for any later measurement. Absence
says only that it fell outside the enumeration window (most-downloaded first).

No row here is signed as a measurement card, because no measurement was made. Signed cards live
on the board and verify under `did:web:csoai.org#card-attestation-1`.

## Fields

| field | meaning |
|---|---|
| `model_id` | Hub id, e.g. `sentence-transformers/all-MiniLM-L6-v2` |
| `status` | always `UNMEASURED` in this release |
| `unmeasured_axes` / `measured_axes` | `22` / `0` |
| `axes` | the 22 saved axis slugs read from the board on 5 September; not the current board scope |
| `as_of` | build time, UTC |
| `verify` | https://councilof.ai/gspc-verify |
| `board` | https://councilof.ai/api/gspc — the canonical live view |

Measurement, not certification. Empty stays empty.

## What is in this repository

| file | bytes | rows | what |
|---|---:|---:|---|
| `models.jsonl` | 14787327 | 20000 | data (one JSON object per line) |
| `build_census.py` | 4258 |  | file |
| `README.md` | — |  | corrected card; historical manifest does not cover later edits |
| `manifest.jsonl` | 838 | 4 | derived at 2026-09-05T12:52:39Z |

`manifest.jsonl` inventories the repository tree **as it stood on 5 September 2026**. Its old README hash and size do not describe this corrected card; use the current repository tree for present files.

## Citation

```bibtex
@misc{csoai_gspc_gspc_hf_model_census,
  title        = {gspc-hf-model-census — Council of AI / GSPC},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face Hub, \url{https://huggingface.co/datasets/csoai/gspc-hf-model-census}},
  note         = {Live board: https://councilof.ai/api/gspc. Measurement, not certification.}
}
```


<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *GSPC — Hugging Face model census (5 September 2026 sample)*. 2026. Hugging Face dataset `csoai/gspc-hf-model-census`. https://huggingface.co/datasets/csoai/gspc-hf-model-census

```bibtex
@misc{csoai_gspc_hf_model_census,
  title        = {GSPC — Hugging Face model census (5 September 2026 sample)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/gspc-hf-model-census},
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
    repo_id='csoai/gspc-hf-model-census', repo_type='dataset',
    filename='models.jsonl',
    revision='449e38a3241819dd0df98efd1eb402f1c2d6d40d',
)
print(path)
```

Use the file's observation date, scope and licence when reusing it. Repository updates and downloads are not new measurements.

- [Current GSPC board](https://councilof.ai/api/gspc) and [methodology](https://councilof.ai/methodology/).
- [Verify supported signed records](https://councilof.ai/gspc-verify/) and [read corrections](https://councilof.ai/claim-maintenance).
- [Earlier page notes and dated integration announcements](https://huggingface.co/datasets/csoai/gspc-hf-model-census/blob/449e38a3241819dd0df98efd1eb402f1c2d6d40d/README.md).

Measurement is not certification. A repository, signed record or passing software test does not by itself establish current board admission, product acceptance or benchmark leadership.
<!-- /council-product-guide:v1 -->
