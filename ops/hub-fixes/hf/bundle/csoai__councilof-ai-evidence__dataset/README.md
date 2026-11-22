---
license: cc-by-4.0
pretty_name: Council of AI public evidence (cards and inclusion proofs)
tags:
- ai-governance
- measurement
- council-of-ai
size_categories:
- 10K<n<100K
configs:
- config_name: index
  data_files:
  - split: train
    path: INDEX.jsonl
  default: true
- config_name: interop-mill-cards-signed-superseded
  data_files:
  - split: train
    path: interop/mill-cards-signed/SUPERSEDED.jsonl
- config_name: interop-ots
  data_files:
  - split: train
    path: interop/ots/*.jsonl
- config_name: public-interop-claim-maintenance-candidates
  data_files:
  - split: train
    path: public/interop/claim-maintenance/candidates.jsonl
- config_name: interop-mill-cards-signed-withdrawn
  data_files:
  - split: train
    path: interop/mill-cards-signed/WITHDRAWN.jsonl
- config_name: public-interop-claim-maintenance-outcomes
  data_files:
  - split: train
    path: public/interop/claim-maintenance/outcomes.jsonl
- config_name: interop-mill-evidence-sample
  data_files:
  - split: train
    path:
    - interop/mill-evidence/items-swarm-0b80423c899a.jsonl
    - interop/mill-evidence/items-swarm-0d0cc407e1ab.jsonl
    - interop/mill-evidence/items-swarm-1161132dcc0e.jsonl
    - interop/mill-evidence/items-swarm-1177090b5b36.jsonl
    - interop/mill-evidence/items-swarm-17905142c32d.jsonl
    - interop/mill-evidence/items-swarm-19e07b76a51f.jsonl
    - interop/mill-evidence/items-swarm-1b6d1671c7a7.jsonl
    - interop/mill-evidence/items-swarm-20fd076e913c.jsonl
    - interop/mill-evidence/items-swarm-2211cbad84d9.jsonl
    - interop/mill-evidence/items-swarm-3a9056cdadf7.jsonl
    - interop/mill-evidence/items-swarm-4e3b9d64f151.jsonl
    - interop/mill-evidence/items-swarm-69ca90fda236.jsonl
    - interop/mill-evidence/items-swarm-69e19ac4e1cb.jsonl
    - interop/mill-evidence/items-swarm-6d360d28ee89.jsonl
    - interop/mill-evidence/items-swarm-731ad9153e7f.jsonl
    - interop/mill-evidence/items-swarm-77804f3b69d2.jsonl
    - interop/mill-evidence/items-swarm-77b6ef42f1cf.jsonl
    - interop/mill-evidence/items-swarm-8755eda09fca.jsonl
    - interop/mill-evidence/items-swarm-95ce1e7118b5.jsonl
    - interop/mill-evidence/items-swarm-960f036595fa.jsonl
    - interop/mill-evidence/items-swarm-9ae803b46d58.jsonl
    - interop/mill-evidence/items-swarm-9e625bbc23f3.jsonl
    - interop/mill-evidence/items-swarm-a1b062a395c5.jsonl
    - interop/mill-evidence/items-swarm-a288be441fbe.jsonl
    - interop/mill-evidence/items-swarm-a9521f04de38.jsonl
    - interop/mill-evidence/items-swarm-aa48de0a8b30.jsonl
    - interop/mill-evidence/items-swarm-aa61ddea9d2d.jsonl
    - interop/mill-evidence/items-swarm-aad97b814aae.jsonl
    - interop/mill-evidence/items-swarm-ac8cf2a722cb.jsonl
    - interop/mill-evidence/items-swarm-b7baa1110515.jsonl
    - interop/mill-evidence/items-swarm-c39666366b67.jsonl
    - interop/mill-evidence/items-swarm-c81ae08609c6.jsonl
    - interop/mill-evidence/items-swarm-d2b269699def.jsonl
    - interop/mill-evidence/items-swarm-d4e2fcc6107b.jsonl
    - interop/mill-evidence/items-swarm-e241550b64fe.jsonl
    - interop/mill-evidence/items-swarm-e8d509fc9748.jsonl
    - interop/mill-evidence/items-swarm-e91bd4f805de.jsonl
    - interop/mill-evidence/items-swarm-eadfcfb228b5.jsonl
    - interop/mill-evidence/items-swarm-ee3158881cd1.jsonl
    - interop/mill-evidence/items-swarm-f1cc217c74b0.jsonl
- config_name: interop-mill-evidence-json-sample
  data_files:
  - split: train
    path:
    - interop/mill-evidence/runpod-verification-e98280da6439.json
    - interop/mill-evidence/runpod-verification-e9b499936948.json
    - interop/mill-evidence/runpod-verification-e9e3790a9655.json
    - interop/mill-evidence/runpod-verification-ea3672320143.json
    - interop/mill-evidence/runpod-verification-eab4d34d518a.json
    - interop/mill-evidence/runpod-verification-eac2a6c60f0f.json
    - interop/mill-evidence/runpod-verification-ec064f132a01.json
    - interop/mill-evidence/runpod-verification-eca218ddd48c.json
    - interop/mill-evidence/runpod-verification-ecee9fce9299.json
    - interop/mill-evidence/runpod-verification-ed507fe6e373.json
    - interop/mill-evidence/runpod-verification-ed8c0dc63b8f.json
    - interop/mill-evidence/runpod-verification-edd55812c5c1.json
    - interop/mill-evidence/runpod-verification-ee0b11ea922a.json
    - interop/mill-evidence/runpod-verification-ee9ebf436c68.json
    - interop/mill-evidence/runpod-verification-eeaa00ee5062.json
    - interop/mill-evidence/runpod-verification-f009cbf5a790.json
    - interop/mill-evidence/runpod-verification-f243dc8a1cf4.json
    - interop/mill-evidence/runpod-verification-f2c193451f37.json
    - interop/mill-evidence/runpod-verification-f33923652de6.json
    - interop/mill-evidence/runpod-verification-f37e751cda36.json
    - interop/mill-evidence/runpod-verification-f45f0d45040f.json
    - interop/mill-evidence/runpod-verification-f4c6455a7809.json
    - interop/mill-evidence/runpod-verification-f5a7acb051b9.json
    - interop/mill-evidence/runpod-verification-f6e2371267b4.json
    - interop/mill-evidence/runpod-verification-f79b48fbf2a5.json
    - interop/mill-evidence/runpod-verification-f7c03c489f9c.json
    - interop/mill-evidence/runpod-verification-f7ef62a2bca6.json
    - interop/mill-evidence/runpod-verification-f7fb2387c08a.json
    - interop/mill-evidence/runpod-verification-f84755e6ebfc.json
    - interop/mill-evidence/runpod-verification-f88378ad9bbb.json
    - interop/mill-evidence/runpod-verification-f93040b97080.json
    - interop/mill-evidence/runpod-verification-fa0db55ae823.json
    - interop/mill-evidence/runpod-verification-faa6c0538845.json
    - interop/mill-evidence/runpod-verification-fbd7a3336359.json
    - interop/mill-evidence/runpod-verification-fc289400691a.json
    - interop/mill-evidence/runpod-verification-fe6bf646332b.json
    - interop/mill-evidence/runpod-verification-fed31c494d86.json
    - interop/mill-evidence/runpod-verification-ff7dc9e1c7ae.json
- config_name: interop-mill-evidence-json-v2-sample
  data_files:
  - split: train
    path:
    - interop/mill-evidence/runpod-verification-f61f6a843bf7.json
    - interop/mill-evidence/runpod-verification-fef93fb3091b.json
- config_name: proofs
  data_files:
  - split: train
    path: proofs/*.json
- config_name: public-interop-corrections-watch-signed
  data_files:
  - split: train
    path:
    - public/interop/corrections-watch/2026-09-28.signed.json
    - public/interop/corrections-watch/2026-09-29.signed.json
    - public/interop/corrections-watch/2026-09-30.signed.json
    - public/interop/corrections-watch/2026-10-01.signed.json
    - public/interop/corrections-watch/2026-10-02.signed.json
    - public/interop/corrections-watch/2026-10-06.signed.json
    - public/interop/corrections-watch/2026-10-07.signed.json
    - public/interop/corrections-watch/2026-10-08.signed.json
    - public/interop/corrections-watch/2026-10-15.signed.json
    - public/interop/corrections-watch/2026-10-16.signed.json
    - public/interop/corrections-watch/2026-10-17.signed.json
    - public/interop/corrections-watch/2026-10-18.signed.json
    - public/interop/corrections-watch/2026-10-19.signed.json
    - public/interop/corrections-watch/2026-10-20.signed.json
    - public/interop/corrections-watch/2026-10-21.signed.json
    - public/interop/corrections-watch/2026-10-22.signed.json
    - public/interop/corrections-watch/2026-10-23.signed.json
    - public/interop/corrections-watch/2026-10-24.signed.json
    - public/interop/corrections-watch/2026-10-25.signed.json
- config_name: ots-upgraded-ots-upgrade
  data_files:
  - split: train
    path: ots-upgraded/*/OTS-UPGRADE.json
- config_name: roots-root
  data_files:
  - split: train
    path: roots/*/root.json
- config_name: root-json
  data_files:
  - split: train
    path: MILL-PRUNE-MANIFEST-2026-11-06.json
- config_name: prune-manifest
  data_files:
  - split: train
    path: PRUNE-MANIFEST.json
- config_name: interop-mill-cards-signed-governance-retrieve
  data_files:
  - split: train
    path: interop/mill-cards-signed/GOVERNANCE-RETRIEVE.json
- config_name: interop-mill-evidence-runtime-declarations-runtime-declarati
  data_files:
  - split: train
    path: interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--art5-safeguard--a7aa37201d3a.json
- config_name: interop-mill-evidence-runtime-declarations-runtime-declarati-json
  data_files:
  - split: train
    path: interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--cross-reality--955eb7fba59f.json
- config_name: interop-mill-cards-unsigned-sample
  data_files:
  - split: train
    path:
    - interop/mill-cards-unsigned/unsigned-swarm-b65e4d9ce00a.json
    - interop/mill-cards-unsigned/unsigned-swarm-ebb755fef4ff.json
    - interop/mill-cards-unsigned/unsigned-swarm-ed951080868d.json
    - interop/mill-cards-unsigned/unsigned-swarm-f1758e8bf1e1.json
    - interop/mill-cards-unsigned/unsigned-swarm-f2615993338b.json
    - interop/mill-cards-unsigned/unsigned-swarm-f924bbb1906c.json
    - interop/mill-cards-unsigned/unsigned-swarm-f9bc4ec960fc.json
    - interop/mill-cards-unsigned/unsigned-swarm-fda102969731.json
- config_name: cards-sample
  data_files:
  - split: train
    path:
    - cards/fe7185a6a41db8de.json
    - cards/fe99181d7d9b9f7d.json
    - cards/feb869ef69f81364.json
    - cards/ff396991d8523898.json
    - cards/ff46755634d3c1e4.json
    - cards/ff7e7cf78c23c5b3.json
    - cards/fff206a509b18b65.json
- config_name: interop-mill-evidence-runtime-declarations-sample
  data_files:
  - split: train
    path:
    - interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--cross-reality--2ddedbf7a1df.json
    - interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--governance--d69383b04aa1.json
    - interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--jail--fe26af17fd74.json
    - interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--openness--48cf210a5fd7.json
    - interop/mill-evidence/runtime-declarations/runtime-declaration-qwen2.5-7b--cross-reality--189a9dc8e779.json
    - interop/mill-evidence/runtime-declarations/runtime-declaration-qwen2.5-7b--openness--d2e48fd364b1.json
    - interop/mill-evidence/runtime-declarations/runtime-declaration-qwen2.5-7b--safety--899b91b28f65.json
- config_name: public-interop-corrections-watch-sample
  data_files:
  - split: train
    path:
    - public/interop/corrections-watch/2026-10-19.json
    - public/interop/corrections-watch/2026-10-20.json
    - public/interop/corrections-watch/2026-10-21.json
    - public/interop/corrections-watch/2026-10-22.json
    - public/interop/corrections-watch/2026-10-23.json
    - public/interop/corrections-watch/2026-10-24.json
    - public/interop/corrections-watch/2026-10-25.json
- config_name: interop-mill-cards-unsigned-v2-sample
  data_files:
  - split: train
    path:
    - interop/mill-cards-unsigned/unsigned-swarm-bbd02400ee8f.json
    - interop/mill-cards-unsigned/unsigned-swarm-bc296cd5e719.json
    - interop/mill-cards-unsigned/unsigned-swarm-ec3c91deb341.json
    - interop/mill-cards-unsigned/unsigned-swarm-f09080048600.json
    - interop/mill-cards-unsigned/unsigned-swarm-f165c986d365.json
    - interop/mill-cards-unsigned/unsigned-swarm-fb927c3f5bf8.json
- config_name: interop-mill-cards-signed-sample
  data_files:
  - split: train
    path:
    - interop/mill-cards-signed/signed-swarm-f175d74fb3e0.json
    - interop/mill-cards-signed/signed-swarm-f3f0758f121e.json
    - interop/mill-cards-signed/signed-swarm-f98b4b19633f.json
    - interop/mill-cards-signed/signed-swarm-fc8e539da3f9.json
    - interop/mill-cards-signed/signed-swarm-fdc5fe5089d9.json
- config_name: public-interop-corrections-watch-v2-sample
  data_files:
  - split: train
    path:
    - public/interop/corrections-watch/2026-10-08.json
    - public/interop/corrections-watch/2026-10-15.json
    - public/interop/corrections-watch/2026-10-16.json
    - public/interop/corrections-watch/2026-10-17.json
    - public/interop/corrections-watch/2026-10-18.json
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Council of AI: public evidence files

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

This dataset holds the files that https://councilof.ai serves by redirect:

- `cards/<sha16>.json`: the card wrappers behind `https://councilof.ai/cards/<sha16>.json`
- `proofs/<sha16>.json`: the Merkle inclusion proofs behind `https://councilof.ai/proofs/<sha16>.json`
- `interop/effect-binding-server-probe-2026-09-22.json`: the axis-23 run artifact, whose bytes are sha256-pinned in its signed companion on councilof.ai

Cloudflare Pages caps a deployment at 20,000 files, so these files are served from here. The URLs on councilof.ai stay the same.

**councilof.ai is authoritative.** The signed public root is `https://councilof.ai/root.json`. A proof here is valid only if it recomputes to that root's `merkle_root` with `index < card_count`. The build pod syncs this dataset before each deploy. A file that disagrees with the root is stale.

Each file was secret-scanned (gitleaks plus a regex pass) before upload. The dataset holds no repository bundles and no git history.

We measure. Nothing here is a certification, and verification is free.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *Council of AI public evidence (cards and inclusion proofs)*. 2026. Hugging Face dataset `csoai/councilof-ai-evidence`. https://huggingface.co/datasets/csoai/councilof-ai-evidence

```bibtex
@misc{csoai_councilof_ai_evidence,
  title        = {Council of AI public evidence (cards and inclusion proofs)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/councilof-ai-evidence},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- corrections-watch-ots:start -->
## Timestamps (OpenTimestamps) for corrections-watch

Each `public/interop/corrections-watch/<date>.json` is stamped with OpenTimestamps before upload, as `<date>.json.ots`. At upload that proof is **pending**: a calendar commitment, not yet attested in Bitcoin. The daily OTS upgrade job adds a Bitcoin attestation later, in a separate commit titled "OTS upgrade <date>"; the original proof is left unchanged. Until then, treat a `<date>.json.ots` here as pending.
<!-- corrections-watch-ots:end -->

<!-- DATA-ACCESS:START -->
## Read this product

This is a structured evidence archive, not a training table. The automatic table viewer is disabled because the repository contains documents with different schemas, signatures or timestamp proofs. All original evidence files remain available.

Browse [Files](https://huggingface.co/datasets/csoai/councilof-ai-evidence/tree/main) and download the named document or proof you need. Use `hf_hub_download` with its exact repository path; downloading the entire archive is unnecessary.

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `index` (default) | `INDEX.jsonl` | 36750 |
| `interop-mill-cards-signed-superseded` | `interop/mill-cards-signed/SUPERSEDED.jsonl` | 1682 |
| `interop-ots` | `interop/ots/*.jsonl` | 604 |
| `public-interop-claim-maintenance-candidates` | `public/interop/claim-maintenance/candidates.jsonl` | 116 |
| `interop-mill-cards-signed-withdrawn` | `interop/mill-cards-signed/WITHDRAWN.jsonl` | 58 |
| `public-interop-claim-maintenance-outcomes` | `public/interop/claim-maintenance/outcomes.jsonl` | 11 |
| `interop-mill-evidence-sample` | `interop/mill-evidence/items-swarm-0b80423c899a.jsonl`, `interop/mill-evidence/items-swarm-0d0cc407e1ab.jsonl`, `interop/mill-evidence/items-swarm-1161132dcc0e.jsonl` … (+37) | 1200 |
| `interop-mill-evidence-json-sample` | `interop/mill-evidence/runpod-verification-e98280da6439.json`, `interop/mill-evidence/runpod-verification-e9b499936948.json`, `interop/mill-evidence/runpod-verification-e9e3790a9655.json` … (+35) | 38 |
| `interop-mill-evidence-json-v2-sample` | `interop/mill-evidence/runpod-verification-f61f6a843bf7.json`, `interop/mill-evidence/runpod-verification-fef93fb3091b.json` | 2 |
| `proofs` | `proofs/*.json` | ≥100 (streamed sample) |
| `public-interop-corrections-watch-signed` | `public/interop/corrections-watch/2026-09-28.signed.json`, `public/interop/corrections-watch/2026-09-29.signed.json`, `public/interop/corrections-watch/2026-09-30.signed.json` … (+16) | 19 |
| `ots-upgraded-ots-upgrade` | `ots-upgraded/*/OTS-UPGRADE.json` | 18 |
| `roots-root` | `roots/*/root.json` | 2 |
| `root-json` | `MILL-PRUNE-MANIFEST-2026-11-06.json` | 1 |
| `prune-manifest` | `PRUNE-MANIFEST.json` | 1 |
| `interop-mill-cards-signed-governance-retrieve` | `interop/mill-cards-signed/GOVERNANCE-RETRIEVE.json` | 1 |
| `interop-mill-evidence-runtime-declarations-runtime-declarati` | `interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--art5-safeguard--a7aa37201d3a.json` | 1 |
| `interop-mill-evidence-runtime-declarations-runtime-declarati-json` | `interop/mill-evidence/runtime-declarations/runtime-declaration-hf.co_openbmb_MiniCPM5-2B-GGUF-Q8_0--cross-reality--955eb7fba59f.json` | 1 |
| `interop-mill-cards-unsigned-sample` | `interop/mill-cards-unsigned/unsigned-swarm-b65e4d9ce00a.json`, `interop/mill-cards-unsigned/unsigned-swarm-ebb755fef4ff.json`, `interop/mill-cards-unsigned/unsigned-swarm-ed951080868d.json` … (+5) | 8 |
| `cards-sample` | `cards/fe7185a6a41db8de.json`, `cards/fe99181d7d9b9f7d.json`, `cards/feb869ef69f81364.json` … (+4) | 7 |
| `interop-mill-evidence-runtime-declarations-sample` | `interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--cross-reality--2ddedbf7a1df.json`, `interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--governance--d69383b04aa1.json`, `interop/mill-evidence/runtime-declarations/runtime-declaration-mistral-nemo-12b--jail--fe26af17fd74.json` … (+4) | 7 |
| `public-interop-corrections-watch-sample` | `public/interop/corrections-watch/2026-10-19.json`, `public/interop/corrections-watch/2026-10-20.json`, `public/interop/corrections-watch/2026-10-21.json` … (+4) | 7 |
| `interop-mill-cards-unsigned-v2-sample` | `interop/mill-cards-unsigned/unsigned-swarm-bbd02400ee8f.json`, `interop/mill-cards-unsigned/unsigned-swarm-bc296cd5e719.json`, `interop/mill-cards-unsigned/unsigned-swarm-ec3c91deb341.json` … (+3) | 6 |
| `interop-mill-cards-signed-sample` | `interop/mill-cards-signed/signed-swarm-f175d74fb3e0.json`, `interop/mill-cards-signed/signed-swarm-f3f0758f121e.json`, `interop/mill-cards-signed/signed-swarm-f98b4b19633f.json` … (+2) | 5 |
| `public-interop-corrections-watch-v2-sample` | `public/interop/corrections-watch/2026-10-08.json`, `public/interop/corrections-watch/2026-10-15.json`, `public/interop/corrections-watch/2026-10-16.json` … (+2) | 5 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/councilof-ai-evidence", "index", split="train")
```

<!-- csoai-card-fixes:end -->
