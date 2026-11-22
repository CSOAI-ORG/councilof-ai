---
pretty_name: CSOAI OPA Read-Only Policy Effect Lab
language:
- en
license: apache-2.0
configs:
- config_name: default
  data_files:
  - split: test
    path: cases.jsonl
tags:
- open-policy-agent
- agent-infrastructure
- policy-as-code
- reproducibility
- synthetic-data
- council-of-ai
size_categories:
- n<1K
---

# One allowed agent read, three blocked: a reproducible OPA lab

**25 September 2026 · synthetic research fixture · no production integration.** This small lab asks whether a pinned [Open Policy Agent](https://www.openpolicyagent.org/docs) policy actually gates a downstream effect. In the recorded run, a synthetic reviewer was allowed to read the public [Council GSPC board](https://councilof.ai/api/gspc) once. A guest, a changed-scope grant, and a revoked grant were denied before any network request. The OPA v1.21.0 policy tests passed 4/4.

The run is useful because it records both the **decision** and whether the **effect** happened. It does **not** verify a real person's identity, a real grant issuer, revocation freshness, an independent GSPC measurement, or production deployment. CSOAI's LF capability index therefore still counts **zero qualified integrations**. OPA and the Linux Foundation have not endorsed or partnered in this experiment.

The four frozen cases are also provided as `cases.jsonl` so the dataset viewer can show each synthetic input and its observed decision. It is a case index, not a population benchmark.

| Frozen input | OPA decision | Recorded public GETs |
| --- | --- | ---: |
| `reviewer` | allow | 1 |
| `guest` | deny | 0 |
| `changed-scope` | deny | 0 |
| `revoked` | deny | 0 |

The official OPA v1.21.0 Linux amd64 static binary was pinned to SHA-256 `5eef70644868bb04d0556bcc795ee42f2ab379e73f51d1bfa30f83e1305bc9b9`. The policy is `policy.rego` (SHA-256 `879dbc52b62443bd1c7c8385d4237d508ab59dc22b8494fdc6c6d5dc01a06294`). The read-only effect receipt is `opa-readonly-effect-result.json` (SHA-256 `cdbfc702e1edce9e321e974bdac0cdfc4c1bc32c4ccbcb30c884769b5eac332a`). The returned public board body was 72,650 bytes, SHA-256 `be45a7ed47dc7f43a0ab83b75d3ce60909f918ecf386af7c11a78c0d5a708cca`. A separate later public GET matched those bytes; that corroborates the response body, not the earlier network call.

## Reproduce

Download `csoai-opa-readonly-policy-lab-20260925.tar.gz`. On Linux amd64, in a disposable directory:

```sh
tar -xzf csoai-opa-readonly-policy-lab-20260925.tar.gz
cd csoai-opa-readonly-policy-lab-20260925
python3 verify_handoff.py
sh run_remote.sh
```

`run_remote.sh` downloads the binary and checksum from the [official v1.21.0 release](https://github.com/open-policy-agent/opa/releases/tag/v1.21.0), checks the pinned SHA-256 and upstream checksum, then reruns the four policy tests and decisions. It does **not** make the public GSPC request. For the separately bounded public-read experiment, inspect `opa_readonly_effect.py` and run it only if you intend to make one GET to the public Council endpoint. `verify_handoff.py` checks the **original published receipts and saved bytes offline**; run it before regenerating `result.json`, because a new run changes timestamps and that receipt's hash.

The recorded independent replay reran the four OPA decisions on the research host and checked the recorded effect flags without making a network request. It did not independently observe the earlier HTTP request. `verify_handoff.py` is narrower: it checks the saved bytes and claim boundaries without rerunning OPA.

## Files and boundaries

The archive contains the complete frozen fixture and its SHA-256 manifest. The policy and test files are also visible at the repository root for quick inspection.

- `policy.rego`, `policy_test.rego`, `inputs/`: the synthetic policy and four frozen cases.
- `cases.jsonl`: a four-row, viewer-friendly index derived from those frozen inputs and the recorded effect receipt.
- `result.json`: OPA version, check, 4/4 tests, decision stdout and hashes.
- `opa-readonly-effect-result.json`: decision-to-effect trace for the one public read and three blocked effects.
- `opa-readonly-effect-independent-replay.json`: second OPA decision replay; zero verifier network calls.
- `gspc-public-readback.json` and the content-addressed board body: independent exact-byte response comparison.
- `opa-eat-gate-result.json`: explicitly admits only `FIXTURE_READBACK` and holds GSPC admission.
- `verify_handoff.py`: offline check of the original receipts and scope.
- `FILES.json`: SHA-256 manifest for every archived source file except itself.

This is a dated snapshot. The public GSPC endpoint may change; a later run need not return the same board hash. No binary, private key, grant credential, payment, customer data or production authority is included. The policy and lab scripts are released under Apache-2.0; the pinned OPA source README and license are included for upstream attribution. For wider context, see the [public LF capability index](https://huggingface.co/datasets/Nicholastempleman/csoai-lf-agent-infrastructure-index) and its [methods article](https://huggingface.co/blog/Nicholastempleman/open-agent-infrastructure-capability-index).

<!-- csoai-card-fixes:start -->

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{nicholastempleman_csoai_opa_readonly_policy_lab_2026,
  title        = {CSOAI OPA Read-Only Policy Effect Lab},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/Nicholastempleman/csoai-opa-readonly-policy-lab}},
  url          = {https://huggingface.co/datasets/Nicholastempleman/csoai-opa-readonly-policy-lab}
}
```

<!-- csoai-card-fixes:end -->
