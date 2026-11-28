---
license: cc-by-4.0
language: en
configs:
- config_name: daily-report-index
  default: true
  data_files:
  - split: train
    path: viewer/*.jsonl
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC daily reports

The table indexes each axis in the reports published by this version of the daily workflow. Each row points to the exact source report by URL and SHA-256. A held row points to its correction. This table is a discovery aid and contains no scores.

Read [the dated archive](https://huggingface.co/datasets/csoai/gspc-daily-reports/tree/main/reports) for full historical coverage. In each dated directory, the JSON contains the report, the Markdown is the readable version and the signature file contains the signed pointer. The public [corrections ledger](https://councilof.ai/corrections/) explains holds. The [GSPC board](https://councilof.ai/board/) shows the dated measurement context.

[Free verification](https://councilof.ai/gspc-verify/) · [Public catalogue](https://councilof.ai/catalogue) · [MCP tools](https://councilof.ai/mcp)
