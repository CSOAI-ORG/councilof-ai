---
license: cc-by-4.0
tags:
- x402
- payments
- base
- agents
- measurement
- census
- council-of-ai
pretty_name: x402 settlement census
configs:
- config_name: default
  data_files:
  - split: train
    path: x402-settlement-census-2026-09-06.jsonl
- config_name: move_a_self
  data_files:
  - split: train
    path: x402-move-a-self-2026-09-06.jsonl
- config_name: dry-2026-09-06
  data_files:
  - split: train
    path: dry/dry-2026-09-06.jsonl
- config_name: dry-2026-09-10
  data_files:
  - split: train
    path: dry/dry-2026-09-10.jsonl
- config_name: dry-2026-09-11
  data_files:
  - split: train
    path: dry/dry-2026-09-11.jsonl
- config_name: dry-2026-09-24
  data_files:
  - split: train
    path: dry/dry-2026-09-24.jsonl
- config_name: dry-2026-09-26
  data_files:
  - split: train
    path: dry/dry-2026-09-26.jsonl
- config_name: dry-2026-09-27
  data_files:
  - split: train
    path: dry/dry-2026-09-27.jsonl
- config_name: dry-2026-09-28
  data_files:
  - split: train
    path: dry/dry-2026-09-28.jsonl
- config_name: dry-2026-11-02
  data_files:
  - split: train
    path: dry/dry-2026-11-02.jsonl
- config_name: dry-2026-11-03
  data_files:
  - split: train
    path: dry/dry-2026-11-03.jsonl
- config_name: dry-2026-11-06
  data_files:
  - split: train
    path: dry/dry-2026-11-06.jsonl
- config_name: dry-2026-11-07
  data_files:
  - split: train
    path: dry/dry-2026-11-07.jsonl
- config_name: dry-2026-11-08
  data_files:
  - split: train
    path: dry/dry-2026-11-08.jsonl
- config_name: dry-2026-11-09
  data_files:
  - split: train
    path: dry/dry-2026-11-09.jsonl
- config_name: dry-2026-11-10
  data_files:
  - split: train
    path: dry/dry-2026-11-10.jsonl
- config_name: dry-2026-11-11
  data_files:
  - split: train
    path: dry/dry-2026-11-11.jsonl
- config_name: dry-2026-11-13
  data_files:
  - split: train
    path: dry/dry-2026-11-13.jsonl
- config_name: dry-2026-11-14
  data_files:
  - split: train
    path: dry/dry-2026-11-14.jsonl
language:
- en
task_categories:
- other
size_categories:
- n<1K
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# x402 settlement census — 2026-09-06

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

**We paid 316 conformant x402 hosts as an ordinary buyer and recorded what came back.**
Not a survey of what hosts advertise — a record of what they did when real USDC arrived.

| outcome | hosts | share |
|---|---|---|
| **REFUSED** | 213 | **67.4%** |
| DELIVERED | 100 | 31.6% |
| NO_CHALLENGE | 2 | 0.6% |
| MISMATCH | 1 | 0.3% |

**Two in three conformant hosts refused a correctly-signed payment.** Being listed in a Bazaar index
and answering a valid 402 is not the same as taking money and delivering.

## Method

Buyer's-eye, exactly as a client experiences it:

1. `GET` the resource → `402` + a challenge (v2 header, or v1 body)
2. sign an EIP-3009 `TransferWithAuthorization` for `accepts[0]`, with the EIP-712 domain taken **from
   the challenge itself**
3. `GET` again carrying `PAYMENT-SIGNATURE` (v2) or `X-PAYMENT` (v1)
4. record status, bytes, content-type, latency, and the settlement tx the host reports

The payer never broadcasts a transaction and holds no ETH: the authorisation travels in a header and
the **host's** facilitator submits it and pays gas. That is what EIP-3009 is for.

**Caps, enforced in code:** 0.05 USDC per host (50000 units), 5.5 USDC total. Actual spend
**1.3398 USDC**. Hosts asking more than the per-host cap were never contacted. Our own hosts are
excluded by name — paying ourselves is a self-settlement, never a purchase.

## Beneficiary concentration

174 distinct `payTo` addresses collect for 314 live doors — and the three
largest collect for 91 of them.

| payTo | hosts |
|---|---|
| `0x2880EdfFF13100677Bf97A3CBdF3Bc34771C4E5E` | 62 |
| `0xFFc458dB291b4ABcE020fE3de4f91F2770E537b1` | 18 |
| `0xEf879BFD6C4AccB8F795136de90246e1EC245e06` | 11 |

A directory of many hosts is not a market of many beneficiaries, and a host count cannot show that.

## Took a settlement and still refused (14 hosts)

These reported an on-chain settlement in their own `PAYMENT-RESPONSE` and then answered the retried
request with 402/4xx anyway. Money moved; nothing was delivered. Check the chain yourself:

| host | units | settlement tx |
|---|---|---|
| `api.vibe.airforce` | 1000 | [`0xe9bba7f8d3e52b5f…`](https://basescan.org/tx/0xe9bba7f8d3e52b5f53b346e566173a896382f047596eb8150c76fa49f389bc15) |
| `5108-x402.community.iamstarchild.com` | 2000 | [`0x00aa4923b82a19d1…`](https://basescan.org/tx/0x00aa4923b82a19d1447f07c10e284c02e7c3ef36508ed1b6e8b7bc3dc8a4e08a) |
| `agent.api.0x.org` | 10000 | [`0xddf564dbe6cfb93d…`](https://basescan.org/tx/0xddf564dbe6cfb93d0b8aee0f88e5a7c28d559d3a14a08e1c1157ae369592c793) |
| `agents.bytemine.ai` | 10000 | [`0x9b143a686a7265f4…`](https://basescan.org/tx/0x9b143a686a7265f42dbedb509906deef0f6cd0fed4e08ca2ab0383ae7506560e) |
| `linklens-sand.vercel.app` | 10000 | [`0xb6e0cc06928e709d…`](https://basescan.org/tx/0xb6e0cc06928e709d183306a6b28222466277ac0562f64057c84d84d578b65eb2) |
| `rentcast.x402.paysponge.com` | 10000 | [`0x05adb3a1be357a1e…`](https://basescan.org/tx/0x05adb3a1be357a1e09488d64fa9f99fc20e2b816dc279809e5116554607f4330) |
| `tripadvisor.x402.paysponge.com` | 10000 | [`0x66cfef13db6641a6…`](https://basescan.org/tx/0x66cfef13db6641a6e8d74a04c70c6eec04b0108a988d5bdc290b9f76cf6a6877) |
| `url-extractor.x402.paysponge.com` | 10000 | [`0xe8c860ce72c6ef82…`](https://basescan.org/tx/0xe8c860ce72c6ef82952202584ae6eebcf5702321216aa557a0dcc5bd0e83d788) |
| `agent-proxy.alchemy.com` | 20000 | [`0x452d1ba528cbc7ff…`](https://basescan.org/tx/0x452d1ba528cbc7ff2e684451bdcb7de9fe94c98cacb7e6727a3949ce090c0685) |
| `agents.x402stock.xyz` | 20000 | [`0x4a577262638e4316…`](https://basescan.org/tx/0x4a577262638e4316cc86cb280b10c551c1109a72d2c4a887cc5c3ec5aafe3986) |
| `screenshotone.x402.paysponge.com` | 20000 | [`0x97e33e1d05380a9e…`](https://basescan.org/tx/0x97e33e1d05380a9ed2eea8e7c950d1eae1db68f3046713c968783c02c28437fb) |
| `wolframalpha.x402.paysponge.com` | 20000 | [`0xce4b39d183145526…`](https://basescan.org/tx/0xce4b39d1831455267fb55216613d362157703ed06bf715934cdc482d0658a2c1) |
| `formo.x402.paysponge.com` | 50000 | [`0xaec93dcc900b7e5c…`](https://basescan.org/tx/0xaec93dcc900b7e5cee0fc8d515cd02ed56690624518be0b894944614be03856f) |
| `api.loyalspark.online` | 1000 | 401 after payment; tx unparseable in data file |

keyronne.com also reported a settlement but is marked MISMATCH with a 200 response, so it is not counted here.

## What this is NOT

- **Not a ranking or a recommendation.** No host was contacted, before or after.
- **`REFUSED` is not proof of bad faith.** A host may rate-limit, require an account, or have changed
  its terms between the challenge and the retry. From outside, all of those look identical.
- **One purchase per host, at one moment.** A single refusal is not a pattern. A second round is what
  would make it one.
- **Not revenue.** Every USDC left our own wallet. Paying anyone is a cost.
- **Not certification, not a conformity mark.** Measurement of what happened, and when.

## The `move_a_self` config

A second config records **our own eight doors, paid by a wallet we control**. It is here so the method
can be checked against a case where the answer is known, and it is labelled so nobody mistakes it for
demand: **a self-settlement is never revenue.** `/api/revenue` `one_number` stayed **0** throughout and
`self_settlements` rose to 5. Five doors settled (all receipts `status 0x1` on Base); three are priced
at 250, 25 and 25 USD by design and were not bought — settling all eight would cost about 300 USDC.

## Reproduce

```bash
SETTLE=1 X402_PAYER_KEY=<throwaway> python3 scripts/grants/x402-settlement-census.py \
  --max-hosts 316 --total-cap 5.5 --out x402-settlement-census-2026-09-06.jsonl
```

Source population: `csoai/x402-bazaar-conformance`, hosts that are conformant on `eip155:8453`
with scheme `exact` and an amount inside the per-host cap.

## What is in this repository

| file | bytes | rows | what |
|---|---:|---:|---|
| `x402-settlement-census-2026-09-06.jsonl` | 188557 | 316 | data (one JSON object per line) |
| `dry/dry-2026-09-24.jsonl` | 144857 | 405 | data (one JSON object per line) |
| `dry/dry-2026-09-27.jsonl` | 138391 | 390 | data (one JSON object per line) |
| `dry/dry-2026-09-06.jsonl` | 113745 | 321 | data (one JSON object per line) |
| `dry/dry-2026-09-26.jsonl` | 110373 | 316 | data (one JSON object per line) |
| `dry/dry-2026-09-10.jsonl` | 105907 | 316 | data (one JSON object per line) |
| `dry/dry-2026-09-11.jsonl` | 102576 | 288 | data (one JSON object per line) |
| `receipts-verified-2026-09-06.json` | 19843 |  | JSON document |
| `README.md` | 17210 |  | card |
| `summary-2026-09-06.json` | 6192 |  | JSON document |
| `x402-move-a-self-2026-09-06.jsonl` | 5287 | 10 | data (one JSON object per line) |
| `receipts-verified-2026-09-06.summary.json` | 3652 |  | JSON document |
| `manifest.jsonl` | 3531 | 14 | derived at 2026-09-27T05:00:40Z |
| `settle-loop/SETTLES-2026-09-22.jsonl` | 2249 |  | data (one JSON object per line) |

`manifest.jsonl` is derived from this repository's own file tree at 2026-09-27T05:00:40Z; it lists every file with its
size, its blob hash and a direct URL, so an agent can enumerate the repo without cloning it.

## Citation

```bibtex
@misc{csoai_gspc_x402_settlement_census,
  title        = {x402-settlement-census — Council of AI / GSPC},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face Hub, \url{https://huggingface.co/datasets/csoai/x402-settlement-census}},
  note         = {Live board: https://councilof.ai/api/gspc. Measurement, not certification.}
}
```


<!-- csoai-openx402-free-cite-2026-09-14 -->
## OpenX402 + free discovery (cite only · never invent OX resource rows)

```
OpenX402 server: Council of AI · https://councilof.ai · payTo 0x212686404a7d1e1fd88f35ed6200c3af7a78ae31
Servers API: GET https://openx402.ai/api/servers (LIVE row · registered 2026-09-14 · Base tx 0x0eb1ead995e235a2…)
Whitelist: GET https://facilitator.openx402.ai/whitelist/0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 → whitelisted true
OX discovery resources: GET https://facilitator.openx402.ai/discovery/resources → councilof still 0/60 (no free advertise API; settle-through required — do not invent rows)
Estate well-known: GET https://councilof.ai/.well-known/x402.json → 10 resources · mode live
OpenAPI: https://councilof.ai/openapi.json
Free-door: https://councilof.ai/api/free-door (402 amount 0 · bazaar)
Free crawl: https://councilof.ai/api/feeds/provider-diff (200 JSON · not a paid OX resource)
Catalog: https://councilof.ai/api/x402
Measurement, never certification. Self≠revenue. Never clone PayAI.
```


Owner: N-Sites spray onto HF leftovers / registry printers. OX discovery stays 0 until settle-through — never invent. Stamp 2026-09-14T03:29Z.

<!-- csoai-smithery-e1e2-honest-2026-09-14 -->
## Smithery / MCP door (measured 2026-09-14 — not a certification)

- **Primary free MCP door:** `https://councilof.ai/mcp` — GET 200; `tools/list` = **12** tools (matches registry `tools[]` for `csoai/gspc-mcp`).
- **Smithery primary listing:** https://smithery.ai/server/csoai/gspc-mcp · registry https://registry.smithery.ai/servers/csoai/gspc-mcp — `deploymentUrl=https://gspc-mcp--csoai.run.tools` → **GET/POST 401 `invalid_token`** (Smithery auth required). Prefer Connect `https://councilof.ai/mcp`; registry deploymentUrl is gateway-by-design (run.tools 401 without bearer) — do not claim registry points at the council door.
- **Stale duplicate:** https://smithery.ai/server/csoai/gspc · registry https://registry.smithery.ai/servers/csoai/gspc — `tools[]` includes phantoms `measure|verify|jail-probe|enter-arena` (not on live `/mcp`); `deploymentUrl=https://gspc--csoai.run.tools` also **401**. Prefer **archive/unlist**; keep only `csoai/gspc-mcp`.
- **Registry write:** PATCH/DELETE need Authorization — no free write without Nick Smithery login (HARD BLOCKER if token absent).
- Measurement only. Never invent that Smithery was fixed. Never certify.
<!-- /csoai-smithery-e1e2-honest-2026-09-14 -->

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *x402 settlement census*. 2026. Hugging Face dataset `csoai/x402-settlement-census`. https://huggingface.co/datasets/csoai/x402-settlement-census

```bibtex
@misc{csoai_x402_settlement_census,
  title        = {x402 settlement census},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/x402-settlement-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- council-product-guide:v1 -->
## Reuse and provenance

Download one published file at the recorded revision:

```python
from huggingface_hub import hf_hub_download
path = hf_hub_download(
    repo_id='csoai/x402-settlement-census', repo_type='dataset',
    filename='x402-move-a-self-2026-09-06.jsonl',
    revision='b20b42e9514f17e7d11d26d249b046f1e0eaa281',
)
print(path)
```

Use the file's observation date, scope and licence when reusing it. Repository updates and downloads are not new measurements.

- [Current GSPC board](https://councilof.ai/api/gspc) and [methodology](https://councilof.ai/methodology/).
- [Verify supported signed records](https://councilof.ai/gspc-verify/) and [read corrections](https://councilof.ai/claim-maintenance).
- [Earlier page notes and dated integration announcements](https://huggingface.co/datasets/csoai/x402-settlement-census/blob/b20b42e9514f17e7d11d26d249b046f1e0eaa281/README.md).

Measurement is not certification. A repository, signed record or passing software test does not by itself establish current board admission, product acceptance or benchmark leadership.
<!-- /council-product-guide:v1 -->
