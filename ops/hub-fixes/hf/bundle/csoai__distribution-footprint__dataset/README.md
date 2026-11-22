---
license: cc-by-4.0
pretty_name: PyPI distribution footprint (daily)
language:
- en
tags:
- pypi
- downloads
- distribution
- measurement
- council-of-ai
configs:
- config_name: default
  data_files:
  - split: latest
    path: latest-packages.jsonl
size_categories:
- n<1K
# TODO task_categories: Growth proposes question-answering (verify against content)
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# PyPI distribution footprint, daily

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

One JSON record a day: how many times the packages published from our PyPI account were downloaded,
as counted by [pepy.tech](https://pepy.tech). Published by Council of AI (CSOAI Ltd, UK Companies House
16939677). `GET https://councilof.ai/api/momentum` reads `latest.json` from this dataset.

## Files

- `latest.json`: the newest record (totals, windows, entity shares, package list source, every package).
- `latest-packages.jsonl`: the same day's packages as flat rows, one per package, for the dataset viewer.
- `daily/pypi-footprint-YYYY-MM-DD.json`: every record, one per UTC day, never rewritten.

## How the record is made

1. **Which packages.** Read fresh every run from PyPI's own role table: XML-RPC `user_packages(account)`
   on `https://pypi.org/pypi` lists every project on which the account holds the Owner or Maintainer role.
   `package_list` names the method and the time it was read. If the role table does not answer, the run
   uses the committed list at `https://councilof.ai/interop/footprint-packages.json` and says so.
2. **Who published each one.** CSOAI Ltd and MEOK AI Labs publish from the same PyPI account. Every row
   carries an `entity` label and every row is counted. `by_entity` prints each share beside the total.
3. **The count.** `https://pepy.tech/api/v2/projects/<name>`, one request a second. `all_time` is pepy's
   `total_downloads`. `last_30d`, `last_7d` and `prev_7d` are summed from pepy's per-day map over complete
   UTC days, and each window is named in the record.

## Limits

- These are registry download events, including mirrors, CI and automated traffic. They are not people,
  installs, users or customers.
- All-time, 30-day and 7-day figures are separate windows. They are never added to each other.
- If any package's counter does not answer, the record says `PARTIAL`. Every sum is then a lower bound
  over `n_counted` packages, not a total over `n_packages`, and the packages that did not answer are listed
  in `failed`. A missing value is `null`, never 0.

## Producer

`scripts/pypi-footprint/pypi_footprint.py` in the councilof-ai repository, run daily on a small
always-on host. It measures and publishes a count. It does not post, register or sign anything.

## Corrections and objections

If a figure here is wrong, or you want to dispute or object to anything we publish, email
contact@csoai.org or use https://councilof.ai/dispute/. Corrections are dated in the public ledger at
https://councilof.ai/corrections/.

## How to cite

```bibtex
@misc{csoai_pypi_footprint,
  author       = {{Council of AI (CSOAI Ltd)}},
  title        = {PyPI distribution footprint (daily)},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/distribution-footprint}}
}
```

Licence: CC-BY-4.0. Attribute: Council of AI, CSOAI Ltd, councilof.ai.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *PyPI distribution footprint (daily)*. 2026. Hugging Face dataset `csoai/distribution-footprint`. https://huggingface.co/datasets/csoai/distribution-footprint

```bibtex
@misc{csoai_distribution_footprint,
  title        = {PyPI distribution footprint (daily)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/distribution-footprint},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->
