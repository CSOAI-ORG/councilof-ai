---
license: cc0-1.0
language:
- en
pretty_name: GSPC — governance bank (GovBench)
task_categories:
- question-answering
- text-generation
size_categories:
- n<1K
tags:
- gspc
- council-of-ai
- ai-governance
- eu-ai-act
- ai-safety
- measurement
- attestation
- signed-evidence
- responsible-ai
- evaluation
- benchmark
- transparency
- governance
- family-gspc
- govbench
- llm-evaluation
- frozen-bank
- model-comparison
configs:
- config_name: default
  data_files:
  - split: train
    path: items.jsonl
- config_name: axis_live
  data_files:
  - split: train
    path: axis-live.jsonl
- config_name: manifest
  data_files:
  - split: train
    path: manifest.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC — governance bank (GovBench)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

<!-- csoai-funnel-2026-09-27 -->

**In one line:** The frozen EU AI Act risk-tier classification bank (GovBench) behind the board's `governance` axis. For evaluators who want to test a model on the same items.

### Use it

```python
from datasets import load_dataset
ds = load_dataset("csoai/gspc-gov", split="train")
print(ds[0])
```

- **Verify a signed card in your browser, free, no account:** <https://councilof.ai/gspc-verify/?ref=hf-gspc-gov>
- **For agents:** MCP endpoint `POST https://councilof.ai/mcp` (free read tools; call `tools/list`).
- **A row about you is wrong, or you want an endpoint left out?** Ask for a re-check or object: <https://councilof.ai/census/?ref=hf-gspc-gov>

### Fresh data

This Hub copy is a dated snapshot. If it disagrees with the live source, the live source wins.

- `GET https://councilof.ai/api/gspc?axis=governance` (free, live, this dataset's row of the board)
- Signed transparency root (Merkle, board key `did:web:csoai.org#board-attestation-1`): https://councilof.ai/root.json
- Daily signed index of every measurement capsule: [https://councilof.ai/measurement-capsules/](https://councilof.ai/measurement-capsules/?ref=hf-gspc-gov) (also published on the Hub as [csoai/evidence-index](https://huggingface.co/datasets/csoai/evidence-index))
- **Pay per call for a fresh, signed capsule:** `GET https://councilof.ai/api/request-attestation?subject=<model-id>` returns an x402 payment challenge for a signed, content-addressed commission receipt for one named model.
- Payment terms are published only in <https://councilof.ai/.well-known/x402.json>; this card quotes no price. Payment buys delivery and freshness, never a result, and verifying anything stays free.

### Cite

```bibtex
@misc{csoai_gspc_gov,
  title        = {GSPC — governance bank (GovBench)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  url          = {https://huggingface.co/datasets/csoai/gspc-gov},
  note         = {Methodology: https://councilof.ai/methodology/. Measurement, not certification.}
}
```

Measurement, not certification. This card adds no score or ranking of any company. A row marked UNMEASURED has not been measured; it is not a pass.

<!-- /csoai-funnel-2026-09-27 -->


**Bank (governance).** Frozen split. Live `n` is the `governance` row on `GET https://councilof.ai/api/gspc`, not a Hub leaderboard score. **Not a certificate.**

Art 50 dates (EUR-Lex): 2 August 2026 live; marking grace 2 December 2026.

Council of AI measurement bank. Measurement, not certification.

<!-- csoai-live-row -->
**Live measurement.** This bank stands behind the `governance` row of the live GSPC board: `GET https://councilof.ai/api/gspc?axis=governance` (family, kind, status and n are on that row, never typed here; the whole board is `GET https://councilof.ai/api/gspc`). Measurement, not certification.
<!-- /csoai-live-row -->

## What is in this repository

| file | bytes | rows | what |
|---|---:|---:|---|
| `items.jsonl` | 106824 | 238 | data (one JSON object per line) |
| `README.md` | 2041 |  | card |
| `gov.json` | 1456 |  | JSON document |
| `results_2026-08-11.json` | 683 |  | JSON document |
| `eval.yaml` | 504 |  | config |
| `NOTICE` | 401 |  | file |
| `manifest.jsonl` | | 7 | derived at 2026-09-04T04:33:29Z |
| `axis-live.jsonl` | | 1 | derived at 2026-09-04T04:33:29Z |

`manifest.jsonl` is derived from this repository's own file tree at 2026-09-04T04:33:29Z; it lists every file with its
size, its blob hash and a direct URL, so an agent can enumerate the repo without cloning it.
`axis-live.jsonl` is a one-row snapshot of this axis as the live board returned it at that moment. It is a snapshot, not the authority.

## Citation

```bibtex
@misc{csoai_gspc_gspc_gov,
  title        = {GSPC — governance bank (GovBench)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face Hub, \url{https://huggingface.co/datasets/csoai/gspc-gov}},
  note         = {Live board: https://councilof.ai/api/gspc. Measurement, not certification.}
}
```


<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *GSPC — governance bank (GovBench)*. 2026. Hugging Face dataset `csoai/gspc-gov`. https://huggingface.co/datasets/csoai/gspc-gov

```bibtex
@misc{csoai_gspc_gov,
  title        = {GSPC — governance bank (GovBench)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/gspc-gov},
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
    repo_id='csoai/gspc-gov', repo_type='dataset',
    filename='items.jsonl',
    revision='fe1a5ca3019956bf28aef0e2a4e77cdcc0d51ae4',
)
print(path)
```

Use the file's observation date, scope and licence when reusing it. Repository updates and downloads are not new measurements.

- [Current GSPC board](https://councilof.ai/api/gspc) and [methodology](https://councilof.ai/methodology/).
- [Verify supported signed records](https://councilof.ai/gspc-verify/) and [read corrections](https://councilof.ai/claim-maintenance).
- [Earlier page notes and dated integration announcements](https://huggingface.co/datasets/csoai/gspc-gov/blob/fe1a5ca3019956bf28aef0e2a4e77cdcc0d51ae4/README.md).

Measurement is not certification. A repository, signed record or passing software test does not by itself establish current board admission, product acceptance or benchmark leadership.
<!-- /council-product-guide:v1 -->


## Verify this dataset (60 seconds, no account needed)

Every row in `items.jsonl` is a published measurement with its own provenance. First run:

```python
import json, urllib.request

url = "https://huggingface.co/datasets/csoai/gspc-gov/resolve/main/items.jsonl"
rows = [json.loads(l) for l in urllib.request.urlopen(url) if l.strip()]
print(len(rows), "items ·", sum(1 for r in rows if r.get("status") == "MEASURED"), "MEASURED")
```

Then verify any figure on the living board against its source, free, no account:
**https://councilof.ai** — board: `GET https://councilof.ai/api/gspc` · corrections:
`GET https://councilof.ai/api/corrections` · every signed card verifies at
`https://councilof.ai/gspc-verify`.

Measurement, not certification. UNMEASURED is declared, never zero. TIE is TIE.
