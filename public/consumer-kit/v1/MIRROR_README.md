---
license: cc-by-4.0
language:
- en
tags:
- claim-maintenance
- measurement
- provenance
- evidence
- mcp
- x402
- reproducibility
---

# Council of AI — public evidence and reader tools

**Start here: [Public evidence walkthrough](consumer-kit/v1/README.md).** Read a dated evidence artifact and verify its bytes without an API key, wallet or GPU.

| Start with | What you get |
| --- | --- |
| [Python client](consumer-kit/v1/csoai_read.py) · [offline tests](consumer-kit/v1/test_csoai_read.py) | Standard-library, read-only verification of a revision-pinned manifest and selected public artifact. |
| [Jupyter / Kaggle import notebook](consumer-kit/v1/public_evidence_walkthrough.ipynb) | Inspectable client code, two explicit read cells and an offline negative control. No remote-code download/execution. |
| [Machine discovery file](consumer-kit/v1/discovery.json) | Entry points with explicit scopes; no scores or counts copied from an old snapshot. |
| [Latest claim capture](claim-capture/latest.json) · [capture guide](claim-capture/README.md) | Dated populations, original observation dates, coverage, source references, exact-revision report and verification links. |
| [Latest operational report pointer](operations/claim-maintenance/latest.json) | Links to its pinned report, status, evidence graph, feed and byte manifest. |
| [Original site-mirror manifest](MIRROR-MANIFEST.json) | Retrieval dates and digests for the original mirrored website files. It does not describe every later release family. |

## Verify before combining

The capture release, operational report, signed-card index, public website root and paid population products are **different artifacts**. A newer capture does not replace an older paid product automatically. A root or signature covering one family must not be attributed to another.

Read the selected release's `as_of`, coverage and identity scope. A recently rebuilt report can contain older measurements. Counts are in their source artifacts, not frozen here. Download activity is not unique people, customer adoption or revenue.

**councilof.ai is the canonical publication surface for its site artifacts.** This repository is a continuity and distribution mirror and hosts explicitly labelled capture releases. Historical access failures are dated observations, not a permanent statement that the site blocks all machine clients. If the latest pointer is unavailable, do not silently substitute an old revision and call it current.

## Public site entry points

[Living GSPC board](https://councilof.ai/api/gspc) · [Claim Maintenance](https://councilof.ai/claim-maintenance/) · [Claim register](https://councilof.ai/api/claims/register) · [Free population manifest](https://councilof.ai/api/pop/stablecoins/manifest) · [Correction ledger](https://councilof.ai/api/corrections) · [Agent discovery](https://councilof.ai/mcp)

Measurement, not certification. A successful byte check does not establish source truth, a model ranking, compliance, an institutional endorsement or a paid delivery. Changes require review before they become corrections. Confidential case material is not part of this mirror.

## Reuse

The existing repository documentation license is CC BY 4.0. The new reader code is MIT. Upstream source data and separately published artifacts retain their own terms and provenance; this page grants no new rights in third-party material.
