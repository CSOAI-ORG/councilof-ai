---
pretty_name: CSOAI Layer 0 public discovery cuts
language:
- en
tags:
- mcp
- x402
- provenance
- opentimestamps
- ai-governance
- a2a
- agent-discovery
- council-of-ai
license: cc-by-4.0
size_categories:
- n<1K
configs:
- config_name: root-json-sample
  data_files:
  - split: train
    path:
    - c4ebe4561e4f22245bd33c0841643057c87de83fcc77a812ead3357a8ea23dbd-ots-status.json
    - dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df-ots-status.json
    - e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145-ots-status.json
  default: true
- config_name: root-json-v2-sample
  data_files:
  - split: train
    path:
    - dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df.json
    - e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145.json
---

# CSOAI Layer 0 public discovery cuts

This repository preserves small, content-addressed observations of publicly served Council of AI discovery surfaces and a local gate map. It is a reproducibility aid, not a certification, training dataset, or record of revenue.

The first cut is [e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145.json](e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145.json). Its filename is the SHA-256 of its exact bytes. It records 13 public MCP tool names, 21 x402 resource IDs, a [public discovery post](https://huggingface.co/posts/Nicholastempleman/123331718014400), and the states of five local Layer 0 loops. The served JSON was independently read back byte for byte after publication.

## Find and try the live agent

- [A2A Registry listing](https://a2aregistry.org/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0/) links the Council [Agent Card](https://councilof.ai/.well-known/agent-card.json) and its A2A endpoint. The card declares protocol v1.0 and shows a structured `SendMessage` example for the live GSPC board.
- [Glama MCP listing](https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai) gives agents another discovery path. Call the live [MCP endpoint](https://councilof.ai/mcp) for the current tool catalog; directory snapshots can lag it.
- The [GSPC board](https://councilof.ai/api/gspc) and [x402 catalog](https://councilof.ai/api/x402) are public read paths. A catalog or payment challenge is an offer, not evidence of a buyer, settlement, or delivered work.

The matching OpenTimestamps sidecar is provided as [base64 text](e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145.json.ots.b64) because the browser's binary uploader was unavailable. Decode that text to the original .json.ots bytes before inspection. Its SHA-256 is 6d2604f4be45b46d3bec2e3716d699a7497baed90a6686159ca02c85dcb49f30. Four public calendars accepted the timestamp; Bitcoin confirmation was pending at the initial readback. The [status receipt](e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145-ots-status.json) records that state.

The original sidecar remains unchanged. A later [Bitcoin-upgraded sidecar, encoded as base64](e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145-bitcoin-upgrade.json.ots.b64) binds the same cut bytes; its decoded SHA-256 is `f0ea8ce7aea1fe1690a6d5dc7a84a479a71d09c63860bc8462d353c1e72b90c9`. The [independent path readback](e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145-bitcoin-upgrade-readback.json) found a matching Merkle path to Bitcoin block 968549, with two public explorers agreeing on the block hash and the header satisfying its encoded proof-of-work target. Decode the sidecar to `.ots` and verify it against the cut with an OpenTimestamps client. This is an exact-byte existence proof checked against public Bitcoin headers, not a local full-node validation or proof that the cut's claims are true.

Run the [standalone public verifier](verify_public_cut.py) with Python 3: `python3 verify_public_cut.py --live`. It downloads the cut, both encoded sidecars, both status receipts, and card at one pinned repository revision; checks their exact content binding; and, with `--live`, compares the recorded MCP tool names and x402 resource IDs with the currently served public catalogs. A live change calls for a new cut and review. This portable verifier checks the published Bitcoin-path receipt's binding but does not independently replay its Merkle path or establish the truth of self-reported gate states.

An existence timestamp does not prove the cut's content true. It does not establish tool effects, GSPC admission, a CSOAI signature, buyer settlement, delivered work, search-engine inclusion, or partnership. The local gate states are self-reported and require their underlying source receipts before use as effect evidence. This is Nicholas's distribution mirror, not the Council's signed root or canonical GSPC board.

## x402 buyer-route walk — 25 September 2026

The dated [21-resource buyer map](c4ebe4561e4f22245bd33c0841643057c87de83fcc77a812ead3357a8ea23dbd.json) links each tested preview and payment challenge. Nineteen routes have an anonymous quote only. The data-feed preview has four unreadable streams, and the Article 50 marking challenge does not bind the tested `url` query exactly. Those two routes are held for repair. No payment, settlement, signed delivery or buyer acceptance was tested. Amounts in this frozen observation are not current prices; read each live 402 challenge for current terms.

The [full anonymous census](d09c231e4421120536c0ffa153f036ad00d19d1052dd829b4cc6ff17ccec7e85-x402-census.json), [exact-byte manifest](c4ebe4561e4f22245bd33c0841643057c87de83fcc77a812ead3357a8ea23dbd-public-manifest.json), [base64 OpenTimestamps sidecar](c4ebe4561e4f22245bd33c0841643057c87de83fcc77a812ead3357a8ea23dbd.json.ots.b64) and [status receipt](c4ebe4561e4f22245bd33c0841643057c87de83fcc77a812ead3357a8ea23dbd-ots-status.json) are published with the cut. The OTS calendars accepted it; Bitcoin confirmation is pending. A pinned-revision download matched all five local files byte for byte. This is a discovery observation, not GSPC admission or revenue.

## Three source-bound fact cuts with Bitcoin proof — 25 September 2026

The [three-axis proof bundle](94507be0ae11b6cfd3ce73d2ec3706d73ea7822cdc5667b40ab139b47e000b53.json) contains candidate fact cuts for XRPL provenance controls, Eurostat enterprise AI-adoption components, and Eurostat labour components. Its filename is the SHA-256 of its exact JSON bytes. Each entry embeds the cut bytes, a source receipt, a saved-raw replay summary, the original OpenTimestamps sidecar, an upgraded sidecar, and a path readback. The embedded binary sidecars are base64-encoded so they can be decoded for independent verification.

The locally checked upgraded sidecars link each exact cut to Bitcoin blocks 968554 and 968555; two public explorers agreed on each header and the checked paths matched its Merkle root and proof-of-work target. This is an existence timestamp checked against public headers, not local full-node validation or proof that the source facts are true. The XRPL source receipt references saved raw node responses, but those raw response bodies are not in this compact bundle. These three measurements remain candidates for owner review: no GSPC admission, production signature, issuer compliance verdict, buyer delivery or revenue is claimed.

Run the [portable exact-byte verifier](verify_axis_proof_bundle.py) with Python 3: `python3 verify_axis_proof_bundle.py --extract axis-proofs`. It downloads the pinned bundle, checks every embedded SHA-256 and source/cut/proof binding, and writes the decoded cuts and sidecars. This helper does not cryptographically replay OpenTimestamps; use an OpenTimestamps client on each extracted cut and adjacent `.json.ots` file for that independent check.

## LF public-index state cut — 25 September 2026

The second [content-addressed discovery cut](dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df.json) records the five public-facing Layer 0 lane states after publication of the separate [Linux Foundation agent-infrastructure capability index](https://huggingface.co/datasets/Nicholastempleman/csoai-lf-agent-infrastructure-index). That dated index distinguishes 30 individually researched project records from 1,270 directory/preflight-only records; zero production CSOAI integrations qualify. The cut also snapshots the then-served MCP tool names and x402 resource IDs. Local lane states are self-reported and require their underlying receipts.

The cut's [original OpenTimestamps sidecar, base64 encoded](dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df.json.ots.b64) and [binding/status receipt](dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df-ots-status.json) are published with it. Four calendars accepted the proof; Bitcoin confirmation is pending for this cut. Run the [portable exact-byte verifier](verify_latest_discovery_cut.py) with `python3 verify_latest_discovery_cut.py --live` to compare its MCP and x402 discovery lists with current public endpoints. This helper checks published bytes and the receipt's binding, not the timestamp's cryptographic path. Nothing here claims GSPC admission, a production signature, a partner endorsement, general search-engine inclusion, buyer settlement, or revenue.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json-sample` (default) | `c4ebe4561e4f22245bd33c0841643057c87de83fcc77a812ead3357a8ea23dbd-ots-status.json`, `dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df-ots-status.json`, `e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145-ots-status.json` | 3 |
| `root-json-v2-sample` | `dc4cdb25e8641cd36a64f7748bd0f5cb1117c524336ad36e48c28f16ff4c27df.json`, `e9c4df4e9383af62c5970cc3680cfcb5e3f095b93e8ad5824c807e74495fe145.json` | 2 |

```python
from datasets import load_dataset

ds = load_dataset("Nicholastempleman/csoai-layer0-discovery-cuts", "root-json-sample", split="train")
```

## Citation

```bibtex
@misc{nicholastempleman_csoai_layer0_discovery_cuts_2026,
  title        = {CSOAI Layer 0 public discovery cuts},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/Nicholastempleman/csoai-layer0-discovery-cuts}},
  url          = {https://huggingface.co/datasets/Nicholastempleman/csoai-layer0-discovery-cuts}
}
```

<!-- csoai-card-fixes:end -->
