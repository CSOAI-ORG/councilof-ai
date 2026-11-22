---
license: cc-by-4.0
pretty_name: EU ecosystem measurements (aggregate, signed)
tags:
- measurement
- data-spaces
- gaia-x
- pontus-x
- endpoints
- council-of-ai
size_categories:
- n<1K
configs:
- config_name: ots-upgraded-ots-upgrade
  data_files:
  - split: train
    path: ots-upgraded/*/OTS-UPGRADE.json
  default: true
- config_name: pontus-x-summary
  data_files:
  - split: train
    path: pontus-x/*/summary.json
- config_name: pontus-x-summary-signed
  data_files:
  - split: train
    path: pontus-x/*/summary.signed.json
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# EU ecosystem measurements

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

This dataset is published by the Council of AI (CSOAI), an independent measurement layer. We measure. We never certify. No organisation named here is a client, partner or member of anything of ours, and none of them has reviewed or approved this work.

## Release 1: Pontus-X public catalogue, declared vs observed (2026-09-27), aggregate only

Files are in `pontus-x/2026-09-27/`:

| File | What it is |
|---|---|
| `summary.json` | The aggregate counts (redacted, see below). |
| `summary.signed.json` | The Ed25519 signature over `summary.json`, from `did:web:csoai.org#board-attestation-1`. |
| `summary.json.ots` | The OpenTimestamps proof for the `summary.json` bytes. |
| `summary.ots.json` | The state of that proof. |

### Method
- **Read-only.** The source is the public Aquarius metadata catalogue at `https://aquarius.pontus-x.eu/api/aquarius/assets/query`, for chains 32456 and 32457. We queried every document that has metadata. The query spans 12 Elasticsearch indices: 9,591 documents, which are 3,403 unique DIDs.
- **Endpoints and metadata only.** For each distinct URL a document declares, we made one probe and recorded:
  - DNS resolution;
  - TLS certificate validity;
  - the HTTP status of a HEAD request, or of a GET whose body was not read.
- **No data consumed.** Nothing was ordered, purchased, downloaded or consumed. The file URLs are encrypted and served only after an order, so file availability was not examined.
- **Politeness.** robots.txt was honoured, at most 1 request started per host per second, UA `CSOAI-measure/0.1 (+https://councilof.ai)`.
- **Timing.** The run went from 2026-09-27T05:51:44Z to 05:53:06Z. Every URL was probed once, so there is no uptime measurement.

### Counts (from `summary.json`)

**Assets and declared service endpoints**

| Measure | Count |
|---|---|
| Unique assets (DIDs) read | 3,403 |
| Assets by chain | 1,597 on chain 32456; 1,806 on chain 32457 |
| Asset types declared | 2,913 dataset, 483 algorithm, 4 compute, 1 SaaS, 1 access, 1 service |
| Distinct declared service endpoints | 20 |
| Service endpoints that responded | 20 of 20 |
| Assets whose declared service endpoint responded | 3,403 of 3,403 |
| Distinct service endpoints with a TLS finding | 2: one expired certificate, one "unable to get local issuer certificate" |
| Per-asset declared services, by TLS state | 8 TLS_INVALID; 3,398 TLS_VALID (3,406 services across 3,403 assets) |

**Declared Gaia-X `serviceSD` URLs**

There are 418 distinct `serviceSD` URLs:
- 97 respond;
- 6 answer with a 5xx status;
- 314 are unreachable (in 310 the DNS does not resolve, and 4 resolve but give no HTTP response);
- 1 is UNCHECKABLE because it is not an http(s) URL.

By asset, 2,882 declare no `serviceSD` URL.

### What this shows
It shows whether each endpoint that a public catalogue entry declares resolved, answered and presented a valid TLS certificate at probe time.

### What this does not show
- Data delivery or file availability.
- Whether any DID, credential or Gaia-X self-description verifies. The content of the `serviceSD` documents was not checked, so it is **UNMEASURED**.
- Uptime.
- Anything about the quality or conduct of any publisher, operator or participant, or of the ecosystem.

This is not a score, a ranking or a compliance determination, and no legal provision is bound to it.

### Why this release is aggregate-only (redaction)
The signed staging summary named two service-endpoint hostnames (the two TLS findings) and one organisation in its disclaimer. This release names no operator. So:
- this `summary.json` is a **redacted aggregate**: the hostnames are replaced by a count and the two reasons, and the organisation name is removed;
- it was **re-signed** and **re-timestamped** as its own artifact;
- every count is unchanged.

The unredacted summary is committed here by hash only (`redaction.source_summary_sha256`), and so are the per-asset and per-URL files (`withheld_files`). None of them is published in this release, because they identify operators, DIDs and endpoint URLs.

### How to verify
```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("summary.signed.json")); raw = open("summary.json", "rb").read()
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(raw).hexdigest() == s["payload"]["artifact"]["sha256"]   # file is the signed one
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]       # payload preimage
req = urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"user-agent": "Mozilla/5.0"})
did = json.load(urllib.request.urlopen(req))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(
    bytes.fromhex(s["signature"]["sig_ed25519"]), c)
print("VERIFIES")
```

For the timestamp, run `pip install opentimestamps-client`, then `ots upgrade summary.json.ots` and then `ots verify summary.json.ots`.

At publication the proof is a **pending calendar commitment**, not a Bitcoin attestation. It becomes one only after an upgrade returns a Bitcoin block-header attestation.

The signature proves only that these bytes were signed by the board key at `signature.signed_at`. It proves nothing inside the record beyond what the record's own instruments measured.

### Objections and corrections
If you operate anything in this catalogue and disagree with a count, or want context added, please use https://councilof.ai/census/ to tell us. Corrections are published as new dated files. They never silently overwrite.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *EU ecosystem measurements (aggregate, signed)*. 2026. Hugging Face dataset `csoai/eu-ecosystem-measurements`. https://huggingface.co/datasets/csoai/eu-ecosystem-measurements

```bibtex
@misc{csoai_eu_ecosystem_measurements,
  title        = {EU ecosystem measurements (aggregate, signed)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/eu-ecosystem-measurements},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- DATA-ACCESS:START -->
## Read this product

This is a structured evidence archive, not a training table. The automatic table viewer is disabled because the repository contains documents with different schemas, signatures or timestamp proofs. All original evidence files remain available.

```python
import json
from huggingface_hub import hf_hub_download
path = hf_hub_download("csoai/eu-ecosystem-measurements", "pontus-x/2026-09-27/summary.json", repo_type="dataset")
with open(path, encoding="utf-8") as source:
    document = json.load(source)
summary = document
```

Only the aggregate summary is public. Per-asset probes and raw logs are withheld by design.

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `ots-upgraded-ots-upgrade` (default) | `ots-upgraded/*/OTS-UPGRADE.json` | 1 |
| `pontus-x-summary` | `pontus-x/*/summary.json` | 1 |
| `pontus-x-summary-signed` | `pontus-x/*/summary.signed.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/eu-ecosystem-measurements", "ots-upgraded-ots-upgrade", split="train")
```

<!-- csoai-card-fixes:end -->
