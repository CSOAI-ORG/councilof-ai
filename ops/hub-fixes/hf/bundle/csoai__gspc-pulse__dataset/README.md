---
license: cc-by-4.0
language:
- en
task_categories:
- time-series-forecasting
- text-retrieval
pretty_name: GSPC Live Pulse
configs:
- config_name: pulse-jsonl
  data_files:
  - split: train
    path: pulse.jsonl
- config_name: pulse-timeseries
  data_files:
  - split: train
    path: timeseries.csv
size_categories:
- n<1K
tags:
- council-of-ai
---
# GSPC Live Pulse — public measurement evidence

An append-only series of public-surface observations from the Council of AI's
GSPC lane. It is **measurement, not endorsement, certification or a safety
verdict**. Missing source data is not silently converted to zero.

## Dataset Viewer

- **`pulse-jsonl`** — nested, per-pulse observations with source timestamps,
  runner identity and ecosystem evidence.
- **`pulse-timeseries`** — flat numeric/string counters suitable for pandas,
  R, spreadsheets and time-series analysis.

Both configurations are explicit so the Hub viewer can build rows rather than
showing an empty dataset. `pulse.jsonl` and `timeseries.csv` must have the same
number of observations; `feed.json` and `latest.json` bind to the same final row.

## Provenance and verification

`pulse-freeze-manifest.json`, `pulse-leaves.json` and
`pulse-freeze-manifest.sig` commit to exactly the first `n_rows` records in
`pulse.jsonl`. Those rows form the **Ed25519-signed prefix**. The hourly public
GitHub Actions watcher has no private signing key; later observations may be
appended as an **unsigned tail**. The tail is not covered by the signature and
must not be described as verified. `DIGEST.md` and `mirror-receipt.json` state
the current signed-prefix and unsigned-tail counts.

Verify the signed prefix using the source repository's `pulse_freeze.py`:

```bash
python3 -m pip install cryptography
python3 pulse_freeze.py verify
python3 pulse_freeze.py prove --ts 2026-11-07T12:06:40Z
```

`verify` reports any unsigned tail. `verify --require-full` exits non-zero
unless every row is signed. `prove --ts` accepts only timestamps in the signed
prefix. A successful prefix verification does **not** authenticate later rows.
The manifest is signature-frozen, not ledger-frozen; OTS/Rekor/XRPL anchoring
remains owner-gated.

## Sources and method

The pulse samples the public GSPC board, measurement-capsule index, public root,
signed-card index, Hugging Face model ecosystem, CISA KEV, and public MCP/x402
surfaces. Each observation carries its own source timestamps and runner. The
public watcher is independent HTTP reproduction, not an authoritative GSPC
measurement or a model inference run.

- Source code and public history: https://github.com/CSOAI-ORG/gspc-pulse
- Automated mirror publisher: `CSOAI-ORG/councilof-ai` workflow `gspc-pulse-hf-mirror.yml` (hourly, idempotent, using the Council repository's existing HF credential; no token is stored in this source repository)
- GSPC verification: https://councilof.ai/gspc-verify
- Live board: https://councilof.ai/api/gspc
- Measurement capsules: https://councilof.ai/measurement-capsules/latest.json

**License:** CC BY 4.0. The source lane also offers CC0-1.0 as described in
`LICENSE-EVIDENCE.md`; attribute the source as *GSPC live pulse — CSOAI / Council
of AI (councilof.ai)*.

<!-- csoai-card-fixes:start -->

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_gspc_pulse_2026,
  title        = {GSPC Live Pulse},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-pulse}},
  url          = {https://huggingface.co/datasets/csoai/gspc-pulse}
}
```

<!-- csoai-card-fixes:end -->
