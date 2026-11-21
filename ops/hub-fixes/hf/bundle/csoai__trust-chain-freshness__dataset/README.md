---
license: cc-by-4.0
tags:
- opentimestamps
- bitcoin
- provenance
- attestation
- council-of-ai
configs:
- config_name: run-2026-09-22
  data_files:
  - split: train
    path: runs/run-2026-09-22.jsonl
- config_name: run-2026-09-23
  data_files:
  - split: train
    path: runs/run-2026-09-23.jsonl
- config_name: run-2026-09-24
  data_files:
  - split: train
    path: runs/run-2026-09-24.jsonl
- config_name: run-2026-09-25
  data_files:
  - split: train
    path: runs/run-2026-09-25.jsonl
- config_name: run-2026-09-26
  data_files:
  - split: train
    path: runs/run-2026-09-26.jsonl
- config_name: run-2026-09-27
  data_files:
  - split: train
    path: runs/run-2026-09-27.jsonl
- config_name: run-2026-09-28
  data_files:
  - split: train
    path: runs/run-2026-09-28.jsonl
pretty_name: "trust-chain-freshness"
size_categories:
- 1K<n<10K
# TODO task_categories: Growth proposes question-answering (verify against content)
# TODO language: Growth proposes en (verify)
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Trust-chain freshness

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Two things in the Council of AI estate go out of date on their own, and this dataset is the
receipt that somebody keeps checking them.

## 1. OpenTimestamps proofs

An OpenTimestamps stamp is created instantly and carries only a *pending* calendar attestation.
Hours later the calendar's commitment lands in a Bitcoin block — but the published `.ots` file
only says so once the completed path is fetched back and the file rewritten. Nothing does that on
its own, so proofs sit reading "pending" long after they are attested, and the publisher looks
*weaker* than the evidence it holds.

`runs/run-<date>.jsonl` has one row per published proof: its state before the run, its state
after, and the Bitcoin block heights if it is attested.

- `before_state` / `after_state` — `PENDING`, `BITCOIN`, or `NOT_A_PROOF`
- `after_blocks` — Bitcoin block heights carried by the proof bytes
- `rewritten` — whether this run changed the file

`manifest/manifest-<date>.json` is the site's own manifest, rebuilt by its producer from the bytes
on disk rather than edited to agree with anything. `ots/` is an archive of the proof files
themselves.

**What "BITCOIN" means here, exactly:** the proof bytes carry a `BitcoinBlockHeaderAttestation`,
parsed by python-opentimestamps. It is not a check of that block header against a Bitcoin node —
`ots verify` with a node does that, separately. A pending proof is a submitted request, not
evidence of a time. Neither is called "anchored".

**Upgrading is additive.** It merges the completed path back onto the *same* commitment: the same
message digest, the same operations tree. No subject file and no signed payload is altered. A
proof whose calendar has not completed is not rewritten, and keeps saying pending.

## 2. The corrections ledger signature

`https://councilof.ai/api/corrections` publishes every claim this estate got wrong. Its own
Ed25519 signature is checked on every request against `did:web:csoai.org#board-attestation-1`, and
this loop re-derives that check independently from the served bytes.
`corrections-signature-<date>.json` is that result, including the case where it does not verify.

Measurement, not certification. `UNMEASURED` and `UNCHECKABLE` are first-class states and are
never printed as a pass.

Produced by `scripts/pod-loops/trust-chain.sh` in `CSOAI-ORG/councilof-ai`.
CC-BY-4.0 — Council of AI (CSOAI Ltd, UK Companies House 16939677).

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *Trust-chain freshness*. 2026. Hugging Face dataset `csoai/trust-chain-freshness`. https://huggingface.co/datasets/csoai/trust-chain-freshness

```bibtex
@misc{csoai_trust_chain_freshness,
  title        = {Trust-chain freshness},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/trust-chain-freshness},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
