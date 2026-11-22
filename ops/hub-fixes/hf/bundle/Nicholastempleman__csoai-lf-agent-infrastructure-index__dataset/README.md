---
pretty_name: CSOAI LF Open Agent Infrastructure Capability Index
tags:
- linux-foundation
- agent-infrastructure
- provenance
- policy
- council-of-ai
license: cc-by-4.0
size_categories:
- n<1K
configs:
- config_name: bitcoin-path-readback
  data_files:
  - split: train
    path: bitcoin-path-readback.json
  default: true
- config_name: directory-receipt
  data_files:
  - split: train
    path: directory-receipt.json
- config_name: files
  data_files:
  - split: train
    path: files.json
- config_name: index
  data_files:
  - split: train
    path: index.json
- config_name: root-json
  data_files:
  - split: train
    path: wave1-audit.json
- config_name: root-json-v2
  data_files:
  - split: train
    path: wave2-audit.json
- config_name: root-json-v3
  data_files:
  - split: train
    path: wave3-audit.json
language:
- en
---

# Open agent infrastructure: a source-checked capability index

This is a dated research index of public Linux Foundation project records, not a list of CSOAI integrations or partners. It helps builders find candidate components for identity, policy, execution containment, provenance, measurement, and supply-chain evidence. Each source link below names the exact revision we inspected.

As of 25 September 2026, the [official LF directory](https://www.linuxfoundation.org/projects) yielded **1,300 visible active project records**. We individually read and pinned **30**; three had bounded anonymous public API/data flows, and OPA passed one isolated synthetic policy-engine lab. **Zero** CSOAI production integrations have qualified. The other 1,270 records are discovery/preflight entries, not project audits.

**Source update, 25 September 2026:** The Open Component Model row below pins `open-component-model/ocm` as the repository inspected for this dated snapshot. The project now labels that repository **“Legacy Toolset.”** Its [current CLI installation guide](https://ocm.software/docs/getting-started/install-the-ocm-cli/) directs new builds to [`open-component-model/open-component-model`](https://github.com/open-component-model/open-component-model). Treat the pinned row as historical source evidence, not a recommendation to build a new integration on the legacy CLI. No OCM runtime integration was tested here. This correction is recorded in the card while the immutable graph and wave audit remain as originally published.



The exact graph snapshot has SHA-256 `52f49733862107f41e4a05fc0d6814c63a5b559ddeb4a6c9b5076345572a24ac`. Its original OpenTimestamps sidecar was accepted by three calendars; an upgraded copy has 2 checked Bitcoin-header paths to blocks 968537, 968555. The [graph](graph.json), [original sidecar](graph-original.json.ots), [upgraded sidecar](graph.json.ots), and [path readback](bitcoin-path-readback.json) are included for exact-byte review. This is an existence-time trail, not a signature, source-truth check, or measurement of every project.

## Use the live Council entry points

The [Agent Card](https://councilof.ai/.well-known/agent-card.json) describes the A2A endpoint. The [GSPC board](https://councilof.ai/api/gspc) exposes current measured evidence, while [Council products](https://councilof.ai/products/) and the [x402 catalog](https://councilof.ai/api/x402) show current public offers and machine-readable terms. Machine clients can discover the live [MCP tools](https://councilof.ai/mcp) with `tools/list`. A listing or payment challenge is not a completed test, delivery, or customer. No project in this research index is represented as a deployed Council integration.

## Audited source candidates

| Project | Public source at inspected revision | Evidence reached |
|---|---|---|
| Agent Authority Conformance | [Pinned public repository](https://github.com/Agent-Authority-Conformance/aps-conformance-suite/tree/5829e2ff00d75f49ce21e9d87e756658deb1ef33) | Documentation readback; integration untested |
| Apalache | [Pinned public repository](https://github.com/apalache-mc/apalache/tree/1371658a2c7377b43882b82764ea7720ec689e21) | Documentation readback; integration untested |
| Automated Compliance Tooling (ACT) | [Pinned public repository](https://github.com/act-project/TAC/tree/0c707a22ca1b1b2ddc9b90864c3f6eda748df274) | Documentation readback; integration untested |
| bomctl | [Pinned public repository](https://github.com/bomctl/bomctl/tree/150c2f7d23138c3a869cec0f92b41e7203a72dc6) | Documentation readback; integration untested |
| Enarx | [Pinned public repository](https://github.com/enarx/enarx/tree/6eb92364c3d8e93802deb24e03255a5c1f3e80ce) | Documentation readback; integration untested |
| Gemara | [Pinned public repository](https://github.com/gemaraproj/gemara/tree/6ad03e41d481143947d5d0edafc08fc757d5d6db) | Pinned schema readback; integration untested |
| Greenhouse | [Pinned public repository](https://github.com/cloudoperators/greenhouse/tree/3d504cafa7882d214f2b658cb53590836686bc98) | Documentation readback; integration untested |
| in-toto | [Pinned public repository](https://github.com/in-toto/in-toto/tree/e352b43ad7cb8915d84c36d791aa61346152a0a3) | Documentation readback; integration untested |
| Keylime | [Pinned public repository](https://github.com/keylime/keylime/tree/3476366881d7931407154597d88577895f2f818e) | Documentation readback; integration untested |
| KitOps | [Pinned public repository](https://github.com/jozu-ai/kitops/tree/d04583d6d2b6a6f48b1070f10bea637dc9c3b74a) | Documentation readback; integration untested |
| Longfellow | [Pinned public repository](https://github.com/longfellow-zk/longfellow-zk/tree/b762b93b4ebfc67f2df311d96dbca132390d3cd1) | Documentation readback; integration untested |
| MaterialX | [Pinned public repository](https://github.com/AcademySoftwareFoundation/MaterialX/tree/2d516f56752abbb8bc5d6d438bfb7970d1b6f8f7) | Documentation readback; integration untested |
| Model Context Protocol | [Pinned public repository](https://github.com/modelcontextprotocol/modelcontextprotocol/tree/ab3a39c13bd23be691c2760e1c6c5c15a64582e1) | Documentation readback; integration untested |
| OAAX | [Pinned public repository](https://github.com/OAAX-standard/oaax/tree/cae0cbeb78bf0978d2b7eced6da9e8cb1b2c79a1) | Documentation readback; integration untested |
| Open Component Model | [Pinned legacy toolset readback](https://github.com/open-component-model/ocm/tree/5adad3efc20d52eb6f7e1b38922a51a0f1ea5712); [current toolchain](https://github.com/open-component-model/open-component-model) | Documentation readback of legacy toolset; current CLI and integration untested |
| Open Policy Agent | [Pinned public repository](https://github.com/open-policy-agent/opa/tree/fb4fe65b53643ff3cb54779a71ce75d624435dc5) | Documentation readback; integration untested |
| OpenFGA | [Pinned public repository](https://github.com/openfga/openfga/tree/b74685e115e65f52655ed6866818d5a0d985805a) | Documentation readback; integration untested |
| OpenSSF Scorecard | [Pinned public repository](https://github.com/ossf/scorecard/tree/f92023a3f77879f96e0c9c1305f289d755be4bb6) | Public API readback; integration untested |
| OpenTelemetry | [Pinned public repository](https://github.com/open-telemetry/opentelemetry-collector/tree/ee42c62804c0d2d225bebdd2b157fd8b0e342de3) | Documentation readback; integration untested |
| OSV Schema | [Pinned public repository](https://github.com/ossf/osv-schema/tree/8e3305dedc0786c4869c7bb0b14564e03ec277b3) | Documentation readback; integration untested |
| Paralus | [Pinned public repository](https://github.com/paralus/paralus/tree/209be7ff8aac08e9a53e7681a68a182783bb0a7a) | Documentation readback; integration untested |
| Protobom | [Pinned public repository](https://github.com/protobom/protobom/tree/22510c5720fdacf15a68653194816341431a1ae6) | Documentation readback; integration untested |
| sigstore | [Pinned public repository](https://github.com/sigstore/cosign/tree/907c3d899c0e5e8ea1c5ce78c23db6d9a9d40247) | Public API readback; integration untested |
| SLSA | [Pinned public repository](https://github.com/slsa-framework/slsa/tree/618f5b2192aad8417a8ee8ccb9e3f27d05c0e9b6) | Documentation readback; integration untested |
| SODA Anomaly Detection | [Pinned public repository](https://github.com/sodafoundation/anomaly-detection/tree/1b0aab03197ee690248cfed6fd67c8f4b533bb91) | Documentation readback; integration untested |
| SPDX License List | [Pinned public repository](https://github.com/spdx/license-list-XML/tree/b1dbeb5c8bca21af860a90e187f71d60b84a7a40) | Public data readback; integration untested |
| SPIFFE | [Pinned public repository](https://github.com/spiffe/spiffe/tree/99470b9abc825f14aa364dfa2c3b53b02ba5db5b) | Pinned specification readback; integration untested |
| The Update Framework (TUF) | [Pinned public repository](https://github.com/theupdateframework/specification/tree/7dd5faca4251995063b851c060a12ac915b17ae3) | Documentation readback; integration untested |
| TRACE Specification | [Pinned public repository](https://github.com/agentrust-io/trace-spec/tree/e3111c77b89cc9870ac7218936ab956ad77de6c9) | Pinned specification readback; integration untested |
| wasmCloud | [Pinned public repository](https://github.com/wasmCloud/wasmCloud/tree/ced0963080e466f83b3599da28591652c56ee79b) | Documentation readback; integration untested |

A pinned source or license observation does not clear dependencies, hosted-service terms, data, model weights, trademarks, or permission to reuse a project’s name as an endorsement. ACT’s selected repository had no root license at its inspected revision, so its reuse rights remain unresolved. Longfellow’s LF directory documentation link returned 404 during this audit; its README-linked official documentation answered successfully. Neither observation is a verdict on the project.

## The execution seam under test

The proposed chain is scoped authority → policy decision → bounded execution → source observation → event and state evidence → independent measurement. [OPA v1.21.0](https://github.com/open-policy-agent/opa/releases/tag/v1.21.0) passed four synthetic policy tests in an isolated Runpod lab. [NVIDIA OpenShell’s pinned quickstart](https://github.com/NVIDIA/OpenShell/blob/aead95b7ab59c3b4f417f78779da1e73fbd40ff9/examples/sandbox-policy-quickstart/README.md) supplied the read-allowed/write-denied expectation for five local fixture controls; an OpenShell gateway was not run. The [pinned OpenBMC Redfish guide](https://github.com/openbmc/bmcweb/blob/c498b1971a1225229b7c4525485c7ecfcba5aa0f/docs/Redfish.md) supplied a GET-only evidence shape for six local fixture controls; no live BMC was contacted. These are independently useful components and evidence candidates, not CSOAI deployments or vendor partnerships.

## What we will test next

The common admission path is source and rights review → positive and negative local fixture → independent replay → GSPC measurement → signed evidence and change watch. A project gets a CSOAI integration label only after that chain is measured and replayable.

The [index data](index.json) preserves project IDs, exact source revisions, evidence levels, rights caveats, and source hashes. [Wave 1](wave1-audit.json), [wave 2](wave2-audit.json), [wave 3](wave3-audit.json), and the [directory receipt](directory-receipt.json) are included with a [hash manifest for evidence files](files.json). Publication is checked separately by anonymous readback. Search visibility, partnership, and revenue are separate outcomes.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `bitcoin-path-readback` (default) | `bitcoin-path-readback.json` | 1 |
| `directory-receipt` | `directory-receipt.json` | 1 |
| `files` | `files.json` | 1 |
| `index` | `index.json` | 1 |
| `root-json` | `wave1-audit.json` | 1 |
| `root-json-v2` | `wave2-audit.json` | 1 |
| `root-json-v3` | `wave3-audit.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("Nicholastempleman/csoai-lf-agent-infrastructure-index", "bitcoin-path-readback", split="train")
```

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{nicholastempleman_csoai_lf_agent_infrastructure_index_2026,
  title        = {CSOAI LF Open Agent Infrastructure Capability Index},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/Nicholastempleman/csoai-lf-agent-infrastructure-index}},
  url          = {https://huggingface.co/datasets/Nicholastempleman/csoai-lf-agent-infrastructure-index}
}
```

<!-- csoai-card-fixes:end -->
