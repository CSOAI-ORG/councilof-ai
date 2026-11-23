---
license: cc-by-4.0
language:
- en
pretty_name: SAFE findings proposal (CSOAI records mapped to the SAFE RFC text)
tags:
- ai-safety
- disclosure
- measurement
- reverification
- json-schema
- transparency
- council-of-ai
size_categories:
- n<1K
configs:
- config_name: out-corrections-ledger-integrity-safe-rv
  data_files:
  - split: train
    path: out/corrections-ledger.integrity.safe-rv.json
  default: true
- config_name: out-corrections-ledger-timing-safe-rv
  data_files:
  - split: train
    path: out/corrections-ledger.timing.safe-rv.json
- config_name: out-disclosure-lag-activity-stopped-safe-rv
  data_files:
  - split: train
    path: out/disclosure-lag.activity-stopped.safe-rv.json
- config_name: out-disclosure-lag-incident-to-notification-safe-rv
  data_files:
  - split: train
    path: out/disclosure-lag.incident-to-notification.safe-rv.json
- config_name: out-index
  data_files:
  - split: train
    path: out/index.json
- config_name: out-safe-rv
  data_files:
  - split: train
    path: out/mcp-contract-parity.v0.1.2.safe-rv.json
- config_name: out-measurement-capsules-index-safe-rv
  data_files:
  - split: train
    path: out/measurement-capsules.index.safe-rv.json
- config_name: safe-rfc-fieldmap
  data_files:
  - split: train
    path: safe-rfc-fieldmap.json
- config_name: out-post-fix-safe-rv
  data_files:
  - split: train
    path: out/C-2026-0928-01.post-fix.safe-rv.json
- config_name: out-post-fix-safe-rv-v2
  data_files:
  - split: train
    path: out/C-2026-0928-02.post-fix.safe-rv.json
- config_name: out-pre-fix-safe-rv
  data_files:
  - split: train
    path: out/C-2026-0928-01.pre-fix.safe-rv.json
- config_name: out-pre-fix-safe-rv-v2
  data_files:
  - split: train
    path: out/C-2026-0928-02.pre-fix.safe-rv.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# SAFE findings proposal

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

**This is a proposed mapping of CSOAI's signed records to the OSAIA SAFE RFC as of its 4 Aug 2026 text. SAFE has no official schema yet, and this is not an official SAFE format.**

CSOAI Ltd wrote it as a candidate for discussion. The Open Secure AI Alliance has not adopted it, and nothing here speaks for the Alliance or for any of its members.

## What the SAFE RFC is, and which text this follows

The SAFE RFC (`rfc-safe-proposal.md` in https://github.com/OpenSecureAIAlliance/RFCs) sets out how AI security findings should be reported and followed up. Its sections include:

- a Reporting Compact (the conditions that trigger a report);
- a Disclosure Model;
- Notification Timelines, including remediation status;
- Evidence Preservation;
- a Review Framework;
- From Lessons to Controls.

This mapping follows the RFC text at commit `4ec76605` (4 Aug 2026). That commit was still the latest in the repository when this dataset was built on 28 Sep 2026 (GitHub API, read that day).

The RFC has prose only. It has no JSON schema, no field list and no official record format. Every field name used here was read from the prose by CSOAI. So the schema in `schema/` is CSOAI's own candidate profile, and it is not the RFC's.

## What is in this dataset

| Path | What it is |
|---|---|
| `safe-rfc-fieldmap.json` | The field map. Each field the RFC text names is mapped to what CSOAI's public records carry today, with a state for each: `HAVE`, `PARTIAL` or `MISSING`. The map also runs the other way: what our records carry that the RFC has no place for. |
| `out/*.safe-rv.json` | 10 example records in the candidate profile `safe-reverification/0.1-draft`. Each one re-expresses an existing CSOAI record: a correction before and after its fix, a corrections-ledger integrity check and a timing check, disclosure-lag readings, a contract-parity run and a capsule index. |
| `out/index.json` | The list of records, with each record's result state, negative-control state and canonical sha256. |
| `schema/safe-reverification-record-v0.1.schema.json` | The candidate profile as a JSON Schema (draft-07). |
| `validation-results.txt` | The output of CSOAI's validator from the run that built this dataset: schema checks, cross-record checks, and negative controls that must be rejected. |

## Signed sources, unsigned examples

- The source records are CSOAI's published records, for example the corrections ledger at https://councilof.ai/api/corrections and the disclosure-lag measurements.
- Where a source record carries an Ed25519 signature, the matching example's `signature` block names that envelope, its key id (`did:web:csoai.org#board-attestation-1`) and the payload sha256. Four of the ten examples do this.
- The example records in `out/` are **not signed themselves**. They are marked `"prototype": true` and `"deployed": false` in `out/index.json`.
- If an example and its source ever disagree, the signed source is the authority.

## Validation results

CSOAI's validator (`validate.py`) was run on 28 Sep 2026 (jsonschema 4.26.0, Python 3.14.7). The full output is in `validation-results.txt`. It exited with code 0:

- **All 10 records are valid** against the candidate schema, and the cross-record rules hold across all 10.
- **All 9 negative controls were rejected**, as designed:
  - a PASS with no negative control run;
  - a PASS whose designed-to-fail control passed;
  - an UNMEASURED result that carries a number;
  - a partial read reported as a population total;
  - a remediation marked VERIFIED with no retest record;
  - a record with no stated limits;
  - a result state outside the vocabulary;
  - a supersession digest altered by one nibble;
  - a retest reference to a record that does not exist.

These checks test the candidate profile's own rules. They do not show that the profile matches what the SAFE authors intend, because no official schema exists to test against.

Anyone can re-run the schema check with any JSON Schema draft-07 validator. From the repository root:

```
pip install jsonschema
python3 -c "import json,glob,jsonschema; s=json.load(open('schema/safe-reverification-record-v0.1.schema.json')); [jsonschema.validate(json.load(open(f)), s) or print('VALID', f) for f in sorted(glob.glob('out/*.safe-rv.json'))]"
```

The cross-record checks and negative controls are recorded in `validation-results.txt`. The validator script itself is not included in this dataset.

## Result states

`PASS`, `FAIL`, `PARTIAL` and `UNMEASURED` are measurement results about one stated claim, within that claim's stated scope and limits. `UNMEASURED` means the public record did not allow a reading, and such a record carries no number. None of these states is a grade, a rating or a statement that any party meets the RFC.

## Licence

The records, field map, schema and validation output are licensed CC-BY-4.0. Attribute CSOAI Ltd (16939677), https://councilof.ai. The SAFE RFC text belongs to its authors and is published under CC-BY-4.0 in its own repository. This dataset quotes field names from it and does not reproduce the RFC.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *SAFE findings proposal (CSOAI records mapped to the SAFE RFC text)*. 2026. Hugging Face dataset `csoai/safe-findings-proposal`. https://huggingface.co/datasets/csoai/safe-findings-proposal

```bibtex
@misc{csoai_safe_findings_proposal,
  title        = {SAFE findings proposal (CSOAI records mapped to the SAFE RFC text)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/safe-findings-proposal},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `out-corrections-ledger-integrity-safe-rv` (default) | `out/corrections-ledger.integrity.safe-rv.json` | 1 |
| `out-corrections-ledger-timing-safe-rv` | `out/corrections-ledger.timing.safe-rv.json` | 1 |
| `out-disclosure-lag-activity-stopped-safe-rv` | `out/disclosure-lag.activity-stopped.safe-rv.json` | 1 |
| `out-disclosure-lag-incident-to-notification-safe-rv` | `out/disclosure-lag.incident-to-notification.safe-rv.json` | 1 |
| `out-index` | `out/index.json` | 1 |
| `out-safe-rv` | `out/mcp-contract-parity.v0.1.2.safe-rv.json` | 1 |
| `out-measurement-capsules-index-safe-rv` | `out/measurement-capsules.index.safe-rv.json` | 1 |
| `safe-rfc-fieldmap` | `safe-rfc-fieldmap.json` | 1 |
| `out-post-fix-safe-rv` | `out/C-2026-0928-01.post-fix.safe-rv.json` | 1 |
| `out-post-fix-safe-rv-v2` | `out/C-2026-0928-02.post-fix.safe-rv.json` | 1 |
| `out-pre-fix-safe-rv` | `out/C-2026-0928-01.pre-fix.safe-rv.json` | 1 |
| `out-pre-fix-safe-rv-v2` | `out/C-2026-0928-02.pre-fix.safe-rv.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/safe-findings-proposal", "out-corrections-ledger-integrity-safe-rv", split="train")
```

<!-- csoai-card-fixes:end -->
