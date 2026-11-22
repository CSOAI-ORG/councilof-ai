---
license: cc-by-4.0
pretty_name: tool-parity — the open-source estate behind every industry MEOK touches
size_categories:
- n<1K
configs:
- config_name: manifest
  data_files:
  - split: train
    path: MANIFEST.json
  default: true
- config_name: parity-card-signed
  data_files:
  - split: train
    path: parity.card.signed.json
- config_name: parity-snapshot
  data_files:
  - split: train
    path: parity_snapshot.json
tags:
- council-of-ai
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# tool-parity — the open-source estate behind every industry MEOK touches

**Measurement, not certification.** This dataset measures repositories. It never certifies a tool.

## What this is

A reproducible measurement of the open-source software estate behind the industries MEOK works in,
taken from public repository state — read directly from the GitHub API and raw endpoints, not from
what any project says about itself.

- **axis:** `tool-parity`
- **card kind:** `gspc.measurement-card`
- **card id (sha256 of the canonical body):** `1332ad3c1da0947439b3d812ca40597ce3585117248d07f0db824859b44f290e`
- **signing key:** `did:web:csoai.org#estate-chain-1` (published in `did:web:csoai.org`, pinned in the Council of AI verifier)
- **measured at:** `2026-10-25T05:18:48.356713+00:00`
- **repositories measured:** 100
- **fetch failures:** 0
- **estate repositories:** 68
- **headline apps:** 15
- **dormant (>400 days since last push):** 32
- **licence states:** permissive 46
  · stated with obligations 8
  · licence-unstated 46

Every repository carries exactly one licence state, and the three counts sum to the number measured.
A repository with no stated licence is recorded as **licence-unstated** — never quietly counted as
permissively licensed, and never counted as forbidden. "Unstated" is a null, and the null is published.

## Files

| file | what it is |
|---|---|
| `parity.card.signed.json` | the GSPC measurement card — the signed receipt |
| `parity_snapshot.json` | the raw measurement, per repository |
| `MANIFEST.json` | digests and the preimage rule |

## Verify it yourself

```bash
# the Council's own published verifier
curl -O https://councilof.ai/signed/verify-card.mjs
node verify-card.mjs parity.card.signed.json
```

The card's preimage rule is `json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')` and its id is the sha256 of those bytes.

The card binds this snapshot's **content** digest — `c03c6fb10c7ab736501ab7a30f2a30b3cd1a59eadd39f49246584fe38330c08c` — computed as
`sha256(json.dumps(snapshot_body_without_content_sha256, sort_keys=True, separators=(',',':')).encode('utf-8'))`.
It is formatting-independent: reformatting the file cannot change it. `MANIFEST.json` records that
content digest alongside the file-byte digest of the exact published bytes.

## Reproduce it

```bash
python3 measure_parity.py --out parity_snapshot.json
```

An unchanged estate reproduces the same snapshot digest; a changed estate produces a changed digest
and a diff — not a claim. The card states the digest it was signed over, so any re-run either matches
the card or tells you the world moved.

Measurement, never certification. Verification is free, forever, for anyone.

<!-- DATA-ACCESS:START -->
## Read this product

This is a structured evidence archive, not a training table. The automatic table viewer is disabled because the repository contains documents with different schemas, signatures or timestamp proofs. All original evidence files remain available.

```python
import json
from huggingface_hub import hf_hub_download
path = hf_hub_download("csoai/tool-parity", "parity_snapshot.json", repo_type="dataset")
with open(path, encoding="utf-8") as source:
    document = json.load(source)
records = document["measurements"]
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `manifest` (default) | `MANIFEST.json` | 1 |
| `parity-card-signed` | `parity.card.signed.json` | 1 |
| `parity-snapshot` | `parity_snapshot.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/tool-parity", "manifest", split="train")
```

## Citation

```bibtex
@misc{csoai_tool_parity_2026,
  title        = {tool-parity — the open-source estate behind every industry MEOK touches},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/tool-parity}},
  url          = {https://huggingface.co/datasets/csoai/tool-parity}
}
```

<!-- csoai-card-fixes:end -->
