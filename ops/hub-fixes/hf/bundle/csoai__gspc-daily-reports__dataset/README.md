---
license: cc-by-4.0
language: en
pretty_name: gspc-daily-reports
size_categories:
- n<1K
configs:
- config_name: watch-hf-watch-latest
  data_files:
  - split: train
    path: watch/hf-watch-latest.jsonl
  default: true
- config_name: reports-sample
  data_files:
  - split: train
    path:
    - reports/2026-11-08/daily-report-2026-11-08.json
    - reports/2026-11-09/daily-report-2026-11-09.json
    - reports/2026-11-10/daily-report-2026-11-10.json
    - reports/2026-11-11/daily-report-2026-11-11.json
    - reports/2026-11-13/daily-report-2026-11-13.json
    - reports/2026-11-14/daily-report-2026-11-14.json
    - reports/2026-11-15/daily-report-2026-11-15.json
    - reports/2026-11-16/daily-report-2026-11-16.json
    - reports/2026-11-17/daily-report-2026-11-17.json
    - reports/2026-11-18/daily-report-2026-11-18.json
    - reports/2026-11-19/daily-report-2026-11-19.json
tags:
- council-of-ai
---


<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>


# gspc-daily-reports

Part of the **Council for the Safety of Artificial Intelligence (CSOAI)** — measurement and
attestation infrastructure for AI systems. Measurement, not certification: UNMEASURED is
reported, never hidden.

- Site: [csoai.org](https://csoai.org) · Verify: [councilof.ai/gspc-verify](https://councilof.ai/gspc-verify/) · Catalog: [councilof.ai/catalog](https://councilof.ai/catalog)
- Free verification (no account): MCP tool `verify_card` at [councilof.ai/mcp](https://councilof.ai/mcp)

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `watch-hf-watch-latest` (default) | `watch/hf-watch-latest.jsonl` | 11 |
| `reports-sample` | `reports/2026-11-08/daily-report-2026-11-08.json`, `reports/2026-11-09/daily-report-2026-11-09.json`, `reports/2026-11-10/daily-report-2026-11-10.json` … (+8) | 11 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-daily-reports", "watch-hf-watch-latest", split="train")
```

## Citation

```bibtex
@misc{csoai_gspc_daily_reports_2026,
  title        = {gspc-daily-reports},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-daily-reports}},
  url          = {https://huggingface.co/datasets/csoai/gspc-daily-reports}
}
```

<!-- csoai-card-fixes:end -->
