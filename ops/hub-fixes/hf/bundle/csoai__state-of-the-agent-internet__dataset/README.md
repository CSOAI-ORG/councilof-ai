---
license: cc-by-4.0
pretty_name: "State of the Agent Internet: September 2026 (numbers and sources)"
language:
- en
tags:
- agents
- mcp
- a2a
- x402
- stablecoins
- measurement
- report
- council-of-ai
size_categories:
- n<1K
configs:
- config_name: numbers
  default: true
  data_files:
  - split: train
    path: data/numbers-2026-09.parquet
- config_name: sources
  data_files:
  - split: train
    path: data/sources-2026-09.parquet
# TODO task_categories: Growth proposes question-answering (verify against content)
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# State of the Agent Internet: September 2026 (numbers and sources)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

The machine-readable record behind the report page https://councilof.ai/state/2026-09/: Every number on the page, each with the record it was recomputed from (path and sha256 on the measuring host, board signature state, and a public copy where one exists).

Read from the signed payload (`2026-09/numbers.signed.json` → `payload`): **174 numbers from
28 source records**, as of `2026-09-26T10:34:15Z`, bound to the measurement index root
`85533b833d36f8a4165da34206ee6e39f7434c646c8a2c381d251391ceec366d` (the same root as the capsule index at
https://councilof.ai/measurement-capsules/v0.2/).

Of the 28 source records, 18 carry a board signature that verifies and 18 name a
public copy (column `public_copy` in `data/sources-2026-09.parquet`). A number is quoted only with the
record it was recomputed from; the recompute rule is in each row.

## What this is not

- Not a population total across catalogues (one catalogue was read only in part).
- Not a statement about which of two disagreeing public statements is true.
- Not a statement about reserves, backing, redeemability or ownership of any asset.
- Not a grade, rank or approval of any service, operator, issuer or model.
- Outside findings the page mentions are listed in `external_context_not_ours`; they are other parties'
  work and never enter any number here.

## Files

| file | bytes | sha256 | what |
|---|---:|---|---|
| `2026-09/numbers.json` | 47,952 | `6a9c3f05b54a4cd1a9af051aca4722ee6245ac32a7fdb46e49632b6aec11b595` | every number on the report page with its source record and recompute rule |
| `2026-09/numbers.json.ots` | 910 | `1c9362f80cdfbf6ac98f483f2b815cf2a278297363ae3829321630981880fa42` | OpenTimestamps proof over numbers.json |
| `2026-09/numbers.signed.json` | 1,458 | `e8f64dc67cac6b405f761bd198f6b53101f891213bef57fe32692dae4fdca4a9` | Ed25519 signature over a payload pinning numbers.json by sha256 |

`data/numbers-2026-09.parquet` flattens `numbers` (one row per number, joined to its source);
`data/sources-2026-09.parquet` flattens `sources`. `verify.py` re-derives both.

## Timestamps

- `2026-09/numbers.json.ots` commits to the sha256 of `2026-09/numbers.json`; its state is pending (4 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.

## How to verify

```bash
pip install cryptography pyarrow
python3 verify.py
```

```python
# Signature check in a few lines. did.json refuses the default Python User-Agent, so this names one.
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
req = urllib.request.Request("https://csoai.org/.well-known/did.json",
                             headers={"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/datasets/csoai)"})
did = json.load(urllib.request.urlopen(req, timeout=30))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
key = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
for f in ["2026-09/numbers.signed.json"]:
    s = json.load(open(f))
    c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
    key.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)   # raises if the bytes were altered
    print("VERIFIES", f)
```

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim beyond what the source records' own instruments measured.

## Objections, contact and corrections

Contact, corrections and objections (including a request to re-check or withdraw a specific row):
**nicholas@csoai.org**, or the "Object or opt out" route at https://councilof.ai/census/. A correction
is published as a new, linked version and logged in the signed corrections ledger at
https://councilof.ai/api/corrections; signed files are never edited in place. CSOAI Ltd (company
no. 16939677, England and Wales) is the accountable publisher.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *State of the Agent Internet: September 2026 (numbers and sources)*. 2026. Hugging Face dataset `csoai/state-of-the-agent-internet`. https://huggingface.co/datasets/csoai/state-of-the-agent-internet

```bibtex
@misc{csoai_state_agent_internet_2026_09,
  title        = {State of the Agent Internet: September 2026 (numbers and sources)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/state-of-the-agent-internet},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
