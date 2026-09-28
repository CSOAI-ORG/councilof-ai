---
license: cc-by-4.0
task_categories: []
configs:
- config_name: defillama-protocols
  data_files:
  - split: train
    path: records/defillama-protocols/*.jsonl
- config_name: defillama-chains
  data_files:
  - split: train
    path: records/defillama-chains/*.jsonl
- config_name: defillama-stablecoins
  data_files:
  - split: train
    path: records/defillama-stablecoins/*.jsonl
- config_name: defillama-yields
  data_files:
  - split: train
    path: records/defillama-yields/*.jsonl
- config_name: defillama-hacks
  data_files:
  - split: train
    path: records/defillama-hacks/*.jsonl
- config_name: openrouter-models
  data_files:
  - split: train
    path: records/openrouter-models/*.jsonl
- config_name: mcp-registry
  data_files:
  - split: train
    path: records/mcp-registry/*.jsonl
- config_name: 402index-services
  data_files:
  - split: train
    path: records/402index-services/*.jsonl
- config_name: a2a-registry
  data_files:
  - split: train
    path: records/a2a-registry/*.jsonl
---

# Claim-capture census

A daily capture of the claims that public, authless catalogues serve about themselves and about
the things they list. Produced by `census-capture.py` on CSOAI infrastructure.

**A capture is CLAIM_CAPTURED. It is not a measurement, not a grade, and not a certification.**
The only thing a capture proves is that these records existed in this exact form at this time as
served by that source. Every artifact carries that boundary in `claim_boundary`.

## What is here

| path | what |
|---|---|
| `records/<source>/<date>.jsonl` | one canonical JSON object per line, sorted by record_id |
| `artifacts/<source>/<source>-<date>.json` | the `csoai.pop-snapshot/1.0` artifact: coverage, window, freshness, RFC 9162 root, identity model, self-test, claim boundary |
| `artifacts/<source>/<source>-<date>.signed.json` | detached Ed25519 signature over a payload pinning the artifact's sha256 (`did:web:csoai.org#board-attestation-1`). Absent = the artifact is unsigned. |
| `artifacts/<source>/<source>-<date>.root.txt[.ots]` | the RFC 9162 root, and its OpenTimestamps submission receipt |
| `changes/<source>/<source>-<date>.json` | observed changes requiring review, each citing both byte-sources |
| `index/<date>.json` | cross-catalogue overlap — so that nobody can total these populations by summing them |
| `runs/<date>.json` | the run receipt: bounds hit, requests made, seconds, bytes |

## Reading the numbers honestly

* A `record_count` counts **rows in a declared window**. Several sources are captured through a
  bounded pagination window; the artifact says so in `coverage.window`. A window is never a
  population total.
* `record_id` is not `subject` is not `endpoint`. An MCP registry row is a server *version*; the
  server is the subject; a deployment endpoint is a third thing again. An x402 *listing* is not
  the service endpoint it points at and is not the provider that operates it.
* **These populations are never added together.** `index/<date>.json` reports where two
  catalogues point at the same endpoint host, precisely so that a total cannot be manufactured.
* A difference between two captures is an **observed change requiring review** — not a
  correction, not an allegation. A change and a change back between two daily ticks is invisible
  to this cadence, and the artifacts say so.
* The Merkle root is **RFC 9162** (0x00 leaf / 0x01 node, recursive largest-power-of-two split,
  no odd-leaf duplication). CSOAI's separate public root at councilof.ai uses a different tree
  that duplicates an odd final node. The two are not interchangeable; the difference is recorded
  in every artifact and nothing about the public root is changed by this dataset.
* OpenTimestamps status is **submitted to the calendars, pending**. That is not a Bitcoin anchor.
  `ots upgrade` and `ots verify` must both succeed before the word "anchored" is allowed.

## Cost

No paid API calls, no authentication against any source, and no newly provisioned compute: this
runs on infrastructure that already exists and is already paid for. That is not the same thing as
free. Where a source turns out to need a key or a payment, it is logged as such and dropped — it
is never worked around.

_Last run in this README's generation: 2026-09-23._

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *Claim-capture census*. 2026. Hugging Face dataset `csoai/claim-capture-census`. https://huggingface.co/datasets/csoai/claim-capture-census

```bibtex
@misc{csoai_claim_capture_census,
  title        = {Claim-capture census},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/claim-capture-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
