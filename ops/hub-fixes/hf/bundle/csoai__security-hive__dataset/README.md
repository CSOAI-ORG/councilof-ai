---
license: cc-by-4.0
language: [en]
pretty_name: Security hive — nightly attack loop, signed
tags: [gspc, council-of-ai, security, serving-fidelity, owasp-asi, signed-evidence]
size_categories: [n<1K]
configs:
- config_name: owasp-asi-asi-gspc-axis-map
  data_files:
  - split: train
    path: owasp-asi/asi-gspc-axis-map.json
  default: true
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Security hive — the nightly attack loop, published

Every night at 04:23 UTC, an attack harness (`hive-attack-loop.mjs`, sha256-pinned in each record)
fires **33 attacks** at the loopback and LAN interfaces of the running MEOK product — then records,
signs (Ed25519), and timestamps the result. **These are those signed records.**

| Field | Meaning |
|---|---|
| `axis` | The GSPC axis this nightly run measures (`serving-fidelity`) |
| `method.attacks` | 33 attacks per run, expectations measured against the running product beforehand |
| `result` | Held / failed per attack — latest runs: **31/31 held** |
| `honesty` / `limitations` | What this run does and does not claim |
| `signature` | Ed25519 under the published DID key set — verify at [gspc-verify](https://councilof.ai/gspc-verify) |

Also included: the **OWASP ASI → GSPC axis map** (the OWASP Agentic AI threats, mapped onto GSPC
measurement slots; measured 10/10 at 0% false positives, 2026-10-27).

**Why this exists:** a security posture that only lives in a private repo is a claim. Signed nightly
records in public are a measurement. Serving-fidelity — the axis this hive measures — is currently a
declared-UNMEASURED board slot elsewhere; this hive is the evidence source for flipping it.

Measurement, not certification. Free verification: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `owasp-asi-asi-gspc-axis-map` (default) | `owasp-asi/asi-gspc-axis-map.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/security-hive", "owasp-asi-asi-gspc-axis-map", split="train")
```

## Citation

```bibtex
@misc{csoai_security_hive_2026,
  title        = {Security hive — nightly attack loop, signed},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/security-hive}},
  url          = {https://huggingface.co/datasets/csoai/security-hive}
}
```

<!-- csoai-card-fixes:end -->
