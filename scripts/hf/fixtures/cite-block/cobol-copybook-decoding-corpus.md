---
license: cc0-1.0
pretty_name: COBOL copybook decoding test corpus
tags:
- cobol
- mainframe
- ebcdic
- test-vectors
- data-conversion
size_categories:
- n<1K
---

# COBOL copybook decoding test corpus

Wrapping a COBOL system behind an API means some decoder turns fixed-width EBCDIC records into JSON. The risk is a value that looks plausible and is wrong: a negative amount that comes back positive, a packed decimal read one digit short, a code page that swaps a character. This corpus lets anyone check a decoder against records whose correct values are known **by construction**, not by trusting another decoder.

- **41 copybooks, 49 records, 166 scored fields**, including **8 must-fail control fields** that a correct decoder should reject or flag instead of emitting a number.
- Every record was encoded by `gen_corpus.py` with its own hand-written encoder (code-page tables, nibble, zone and binary packing). No decoder under test and no EBCDIC codec produced the bytes; Python's codecs only cross-check the hand tables, and the build aborts if they disagree.
- The expected value of every field is the value that was encoded. Each encoding rule cites the IBM Enterprise COBOL Language Reference 6.4, the Programming Guide 6.4 or the z/Architecture Principles of Operation (see `corpus/expected.json` → `encoding_rules`).

## Hazards covered

| Hazard | Fields |
|---|---|
| OCCURS DEPENDING ON (variably located items) | 30 |
| Baseline (plain DISPLAY and binary) | 23 |
| Zoned decimal with overpunched sign, SIGN LEADING / TRAILING / SEPARATE | 17 |
| REDEFINES | 17 |
| COMP-3 packed decimal | 15 |
| Implied decimal point (V) and scaling (P) | 12 |
| COMP / COMP-4 / BINARY | 12 |
| Code pages (CCSID 37, 500, 1140) | 10 |
| Alternate sign nibbles (A–F) and negative zero | 9 |
| COMP-5 values beyond the PICTURE digits | 9 |
| Must-fail controls (bad packed nibble, bad zone, wrong code page) and their valid siblings | 12 |

Not covered yet: COMP-1/COMP-2 floating point, SYNC alignment, national/DBCS data, and RDW record framing. COMP values beyond the PICTURE digits are left out of COMP (they depend on the TRUNC compiler option) and tested under COMP-5, where the meaning is fixed.

## Use it

```bash
python3 gen_corpus.py            # regenerate every copybook, record and expected.json byte for byte
# decode each record with your decoder, one JSON line per record:
#   {"record": "c01_pk_basic_r01", "fields": {"C01-NEG": "-12345", ...}}
#   {"record": "c41_mf_ascii_r01", "rejected": true}
python3 check.py corpus/expected.json your_output.jsonl
```

`check.py` uses the standard library only. It prints one verdict per field (MATCH, MISMATCH with both values, REJECTED) and a per-hazard tally. Numbers compare as exact decimals; text compares after removing trailing spaces.

## Results against open-source decoders

We have run this corpus against seven configurations of open-source decoders. Those results are held until each project's maintainers have seen them. They will be published here afterwards as a dated record, together with any correction or context the maintainers send.

## About

Published 28 September 2026 by CSOAI Ltd (Council of AI, councilof.ai), which measures whether published claims can be checked by a third party. This is a measurement resource: it does not certify, rate or rank any decoder, and it does not convert or remediate COBOL. Corrections: nicholas@csoai.org.

Licence: CC0 1.0. Use it for anything.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *COBOL copybook decoding test corpus*. 2026. Hugging Face dataset `csoai/cobol-copybook-decoding-corpus`. https://huggingface.co/datasets/csoai/cobol-copybook-decoding-corpus

```bibtex
@misc{csoai_cobol_copybook_decoding_corpus,
  title        = {COBOL copybook decoding test corpus},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/cobol-copybook-decoding-corpus},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC0-1.0. Attribution is appreciated, not required.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
