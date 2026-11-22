---
license: cc-by-4.0
pretty_name: x402 settlement activity on Base (daily, from 2026-09-25)
language:
- en
tags:
- x402
- payments
- agents
- usdc
- base
- onchain
- measurement
- council-of-ai
size_categories:
- 10K<n<100K
configs:
- config_name: settlements
  default: true
  data_files:
  - split: train
    path: 2026-09-25/x402-activity-2026-09-25.rows.jsonl.gz
- config_name: payees
  data_files:
  - split: train
    path: 2026-09-25/x402-activity-2026-09-25.payees.jsonl.gz
# TODO task_categories: Growth proposes question-answering (verify against content)
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# x402 settlement activity on Base (daily, from 2026-09-25)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Of the USDC payments on Base mainnet (chain id 8453) that reached payees listed in the public x402 Bazaars on one UTC
day, how many came from distinct outside wallets, and how many from the payee itself, a sibling payee,
another listed payee, a wallet CSOAI declares its own, or an amount below the smallest amount any
listing asks of that payee? (The record's own wording is its `question` field.)

This dataset holds the signed daily record CSOAI publishes at
https://councilof.ai/measurements/x402-activity/, byte for byte, with the settlement rows and the
payee list it was computed from. It measures who paid listed x402 payees on one UTC day on
Base mainnet (chain id 8453); it does not rank or name any seller, payer or index, and a class says nothing about
why anyone paid.

Headline for 2026-09-25, read from the signed payload (`2026-09-25/x402-activity-2026-09-25.signed.json` → `payload.headline`):

| | |
|---|---:|
| settlements to listed payees | 28,122 |
| USDC moved, atomic units (6 decimals) | 713,617,378 |
| distinct payers | 1,073 |
| distinct payees paid | 453 |
| settlements in class `EXTERNAL` | 27,809 |
| USDC in class `EXTERNAL`, atomic units | 711,133,451 |
| distinct payers with at least one `EXTERNAL` settlement | 1,047 |
| distinct payees with an `EXTERNAL` settlement | 439 |
| `EXTERNAL` share of settlements | 0.98887 |
| `EXTERNAL` share of USDC | 0.996519 |

As of: record `2026-09-26T15:22:43Z` (window 2026-09-25 UTC, blocks 51,752,527–51,795,726).
Population: 1,757 payee addresses listed for Base USDC by
2,481 hosts, read from both public Bazaars
(24,556 resources, read complete: True).

## What is measured, and the states

Unit: one USDC Transfer log to a listed payee, in a transaction that also carries a USDC AuthorizationUsed log whose authorizer is the transfer's sender (EIP-3009 transferWithAuthorization).

Every settlement gets exactly one class, first match wins. Counts per class are the record's
`by_class` for 2026-09-25:

| class | rule | settlements | USDC, atomic units | distinct payers | distinct payees |
|---|---|---:|---:|---:|---:|
| `SELF_SAME_ADDRESS` | payer == payee | 63 | 1,116,000 | 7 | 7 |
| `SELF_SAME_LISTING` | payer is another payee listed by a host that also lists this payee | 18 | 39,000 | 4 | 5 |
| `ESTATE_SELF` | payer or payee is a wallet CSOAI declares its own (estate_wallets) | 0 | 0 | 0 | 0 |
| `PAYER_IS_LISTED_PAYEE` | payer is itself a listed payee anywhere in either Bazaar | 42 | 257,864 | 9 | 9 |
| `ZERO_VALUE` | value == 0 | 0 | 0 | 0 | 0 |
| `BELOW_SMALLEST_PRICE` | 0 < value < the smallest amount any Bazaar listing asks of this payee | 190 | 1,071,063 | 19 | 16 |
| `EXTERNAL` | none of the above | 27,809 | 711,133,451 | 1,047 | 439 |

Row flags: `repeat_pair` (the payer paid this payee at least twice in the window) and
`high_frequency_pair` (at least 100 times). Accepts-entries on other networks, assets or schemes are
counted in the record under `population.accepts_entries_not_measured` and are **not measured** here.

## What this is not

- Not a ranking, grade or approval of any seller, payer, facilitator or index. No address is named
  in the README; addresses in the rows are public on-chain facts.
- Not revenue for CSOAI. CSOAI's own wallets are declared in the record
  (`method.estate_wallets`) and carry their own class, `ESTATE_SELF`.
- Not a statement of intent. A class is a structural fact about addresses and amounts.
- `context.json` quotes other parties' findings about x402 activity verbatim. They use different
  methods, networks and windows; they are never added to, compared with or used to adjust this record.

## Files

| file | bytes | sha256 | what |
|---|---:|---|---|
| `2026-09-25/x402-activity-2026-09-25.json` | 10,251 | `b8faf56f5634fe7d1ee29985ac0a9346fc5c2ebb54bb951508ff8b745e57da81` | the record: question, window, population, method, counts by class, headline, limitations |
| `2026-09-25/x402-activity-2026-09-25.json.ots` | 635 | `17510b291d043a7035026ac29f2f299b8ead04891efaec400536edca99f7c62b` | OpenTimestamps proof over the record |
| `2026-09-25/x402-activity-2026-09-25.ots.json` | 1,060 | `7042202b9b00b7bbe2ff9fbee5efe56c130ba6609bf1e6b4f52629c249192cdb` | the proof's state sidecar, as published |
| `2026-09-25/x402-activity-2026-09-25.payees.jsonl.gz` | 76,037 | `951d0026e14af408da138b8c4be65f4ec9212934a7a6a77e3fd27dcef168fba1` | one row per listed payee (viewer config `payees`) |
| `2026-09-25/x402-activity-2026-09-25.rows.jsonl.gz` | 1,555,425 | `6a1771ef57a7d543cee8e19b47e987d0d4e0da908f77f58525217b1cc2e1d875` | one row per settlement (viewer config `settlements`) |
| `2026-09-25/x402-activity-2026-09-25.signed.json` | 2,307 | `fbfe711bfb82062da4b348085efb64f729967148183ba2def7131705cafe1493` | Ed25519 signature over a payload that pins the record, the row file and the payee file by sha256 |
| `context.json` | 5,862 | `393eaf525f03cf6eb6c3a001b23f6579e4a27965079b9a194f8024da40844caa` | other parties' published findings about x402 activity, quoted verbatim with the sha256 of the bytes read; never combined with this record |
| `context.json.ots` | 670 | `368345db5d67e36726392b5be63eeeaa0cc6d9d0ad41e66427a743ec62493178` | OpenTimestamps proof over context.json |
| `context.signed.json` | 1,947 | `f370b9e3d0e5a2929ce8e46f2fb22edb528be7c80b1484cdc5ac0b8d3903c208` | Ed25519 signature over a payload that pins context.json |

`rows_sha256` in the signed payload pins the row file's file bytes; `payees_sha256` pins the payee
file's file bytes. The row file has 28,122 rows and the payee file 1,757.

## Timestamps

- `2026-09-25/x402-activity-2026-09-25.json.ots` commits to the sha256 of `2026-09-25/x402-activity-2026-09-25.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `context.json.ots` commits to the sha256 of `context.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.

Check with `ots verify <file>.ots` once a block attests it (the OpenTimestamps client reads the
calendars and Bitcoin itself).

## How to verify

```bash
pip install cryptography
python3 verify.py      # signatures, artifact and row-file hashes, tamper controls, manifest
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
for f in ["2026-09-25/x402-activity-2026-09-25.signed.json", "context.signed.json"]:
    s = json.load(open(f))
    c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
    key.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)   # raises if the bytes were altered
    print("VERIFIES", f)
```

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim inside beyond what the record's own instruments measured.

## Objections, contact and corrections

Contact, corrections and objections (including a request to re-check or withdraw a specific row):
**nicholas@csoai.org**, or the "Object or opt out" route at https://councilof.ai/census/. A correction
is published as a new, linked version and logged in the signed corrections ledger at
https://councilof.ai/api/corrections; signed files are never edited in place. CSOAI Ltd (company
no. 16939677, England and Wales) is the accountable publisher.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *x402 settlement activity on Base (daily, from 2026-09-25)*. 2026. Hugging Face dataset `csoai/x402-activity`. https://huggingface.co/datasets/csoai/x402-activity

```bibtex
@misc{csoai_x402_activity,
  title        = {x402 settlement activity on Base (daily, from 2026-09-25)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/x402-activity},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
