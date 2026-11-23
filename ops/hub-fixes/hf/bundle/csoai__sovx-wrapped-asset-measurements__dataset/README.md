---
license: cc-by-4.0
pretty_name: SovX wrapped-asset measurements (Council of AI)
language:
- en
tags:
- wrapped-assets
- bridged-tokens
- caip-19
- on-chain-data
- measurement
- council-of-ai
size_categories:
- n<1K
configs:
- config_name: default
  data_files: sovx_wrapper_pairs.csv
# TODO task_categories: Growth proposes question-answering (verify against content)
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# SovX wrapped-asset measurements (Council of AI)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

This dataset reports measurements only. It makes no claim about reserves, solvency or suitability.

SovX is the Council of AI (CSOAI) record of wrapped and bridged token pairs. Each record is a point-in-time read of a wrapped token's on-chain supply and, where one exists, the origin-chain escrow balance that backs it. This dataset republishes records that are already served publicly on councilof.ai, byte for byte, with the SHA-256 of each file. Nothing in it is new: no state, pair or issuer has been added or re-judged for this release.

## What is measured

Supply parity at pinned finalized blocks. For each wrapped/origin pair the reader called `totalSupply()` on the wrapped token and `balanceOf(escrow)` on the origin-chain token, at a block pinned per chain by the RPC `finalized` tag. Each raw return value is kept with its own SHA-256, and `escrow_over_wrapped` is the ratio of the two decimal-normalised values.

Operators. The published ledger in this release (as_of 2026-09-14T10:51:51Z) records one public RPC endpoint per chain for each read, and its finality label is `RPC_FINALIZED_TAG_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL`. The two-operator method, where a second RPC operator must return the same block hash, is used by the live preview endpoint listed below and by a newer ledger that has not been published yet. It is not claimed for the rows in this release.

## What is NOT measured

- No reserve adequacy. A ratio of two on-chain numbers says nothing about off-chain reserves.
- No solvency, no redemption, no custody controls.
- No attestation of any issuer's claims; no audit.
- Not financial advice, not a rating, not a ranking and not a recommendation. A state is not a grade.
- Blocks on two chains are never simultaneous; each read is at its own pinned block.
- No light client: block headers are not checked against validator signatures.

## States (as served; vocabulary of the 2026-09-14 ledger)

| state | rows | meaning |
|---|---|---|
| `ESCROW_PARITY_READ` | 8 | both reads returned a value at the pinned blocks; a read, not a grade |
| `UNCHECKABLE_NATIVE_ISSUANCE` | 6 | issued natively on this chain, so no escrow exists to read; supply read, no ratio claimed |
| `INDEXED_CUSTODIAL` | 8 | reserve held by a custodian off this chain; supply read, no reserve readable here, no ratio claimed |
| `UNMEASURED` | 2 | a read returned no value; the error is recorded and nothing is inferred |

UNMEASURED is a first-class result. It is never filled in or estimated.

## Files

| path | what it is |
|---|---|
| `sovx_wrapper_pairs.csv` / `.parquet` | flat view, one row per wrapper pair (24 rows) |
| `records/wrapped-asset-parity-2026-09-14.json` | the published ledger, verbatim |
| `records/wrapped-asset-parity-2026-09-14.json.ots` | its OpenTimestamps proof, verbatim |
| `records/evidence/*.json` | the per-pair evidence record served at `https://councilof.ai/w/<id>`, verbatim |
| `records/measured-wrappers.tokenlist.json` | the token list served at `https://councilof.ai/wallet/measured-wrappers.tokenlist.json`, verbatim |
| `records/cross-ledger-xl-2026-09-29.json` | the cross-ledger supply record served at `https://councilof.ai/api/xl` on 2026-09-29, verbatim; a separate method with its own states, see its `what_this_is` field |
| `SHA256SUMS` | SHA-256 of every file above |
| `croissant.json` | Croissant 1.0 metadata |

### Columns of the flat view

`record_id`, `caip19` (CAIP-19 asset id of the wrapped token), `chain`, `chain_id`, `symbol`, `state`, `as_of`, `block` (pinned block on the wrapped chain), `block_hash`, `canonical_chain`, `canonical_block` (pinned block on the origin chain), `backing_model`, `escrow_over_wrapped`, `wrapped_total_supply`, `escrow_balance`, `evidence_url`, `ledger_url`, `record_sha256` (SHA-256 of the ledger record object serialised as JSON with sorted keys and no whitespace), `evidence_sha256` (SHA-256 of the evidence file bytes as served).

## Verify

1. `sha256sum -c SHA256SUMS`
2. Compare `records/wrapped-asset-parity-2026-09-14.json` with `https://councilof.ai/interop/wrapped-asset-parity-2026-09-14.json`; the bytes should be identical.
3. `ots verify records/wrapped-asset-parity-2026-09-14.json.ots` checks the Bitcoin timestamp over the ledger bytes.
4. Re-read any pair yourself: every record names its contract, escrow, block number and block hash, and keeps the raw `eth_call` return value.

The ledger records carry an OpenTimestamps proof, not an Ed25519 signature. For Council of AI signed cards the verify door is `https://councilof.ai/api/verify` (rule: `https://councilof.ai/signed/HOW-TO-VERIFY.md`). Verification is free.

Live, per-asset preview (fresh two-operator reads, not part of this snapshot): `https://councilof.ai/api/wrapper/caip19/<caip19>`.

## Corrections

Report an error at `https://councilof.ai/api/corrections`. Corrections are published there; this dataset is re-versioned, never edited silently.

## Licence

CC-BY-4.0. Attribution: Council of AI, CSOAI Ltd (company 16939677), councilof.ai.

## How to cite

```bibtex
@misc{csoai_sovx_2026,
  title        = {SovX wrapped-asset measurements (Council of AI)},
  author       = {{Council of AI (CSOAI Ltd)}},
  year         = {2026},
  note         = {Ledger as\_of 2026-09-14T10:51:51Z; released 2026-09-29},
  howpublished = {\url{https://councilof.ai/interop/wrapped-asset-parity-2026-09-14.json}},
  license      = {CC-BY-4.0}
}
```

Plain text: Council of AI (CSOAI Ltd). *SovX wrapped-asset measurements*, ledger as_of 2026-09-14T10:51:51Z, released 2026-09-29. CC-BY-4.0. https://councilof.ai/interop/wrapped-asset-parity-2026-09-14.json

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *SovX wrapped-asset measurements (Council of AI)*. 2026. Hugging Face dataset `csoai/sovx-wrapped-asset-measurements`. https://huggingface.co/datasets/csoai/sovx-wrapped-asset-measurements

```bibtex
@misc{csoai_sovx_wrapped_asset_measurements,
  title        = {SovX wrapped-asset measurements (Council of AI)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/sovx-wrapped-asset-measurements},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
