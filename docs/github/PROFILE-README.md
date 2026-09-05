# Council of AI — an independent AI-measurement body

> **22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.**
>
> We run AI systems against frozen, published instruments; grade deterministically; sign every result with Ed25519; publish a Merkle root and witness it in a public transparency log; and keep a public corrections ledger. **Measurement, not certification.** Verification is free and loginless. Nothing ranked pays us; we exclude our own models from public leader positions.

_derived 2026-09-05T14:19:51Z — every number on this page is read live from the URLs in [`scripts/github/org-readme.py`](https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/github/org-readme.py); if this file and the API disagree, the API is right._

[![GSPC board — 22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/api/gspc)

[![PyPI csoai-gspc](https://img.shields.io/pypi/v/csoai-gspc?style=flat-square&color=10b981&label=PyPI%20csoai--gspc)](https://pypi.org/project/csoai-gspc/)
[![npm csoai-gspc-mcp](https://img.shields.io/npm/v/csoai-gspc-mcp?style=flat-square&color=10b981&label=npm%20csoai--gspc--mcp)](https://www.npmjs.com/package/csoai-gspc-mcp)
[![DOI methodology](https://zenodo.org/badge/DOI/10.5281/zenodo.21991104.svg)](https://doi.org/10.5281/zenodo.21991104)
[![DOI board snapshot](https://zenodo.org/badge/DOI/10.5281/zenodo.22344048.svg)](https://doi.org/10.5281/zenodo.22344048)
[![HF datasets: 99](https://img.shields.io/badge/HF%20datasets-99-10b981?style=flat-square&logo=huggingface&logoColor=white)](https://huggingface.co/csoai)
[![signed cards: 335](https://img.shields.io/badge/signed%20cards-335-10b981?style=flat-square)](https://councilof.ai/signed/card_index.json)
[![merkle root: 6347384a…](https://img.shields.io/badge/merkle%20root-6347384a…-10b981?style=flat-square)](https://councilof.ai/root.json)
[![Rekor witness: WITNESSED](https://img.shields.io/badge/Rekor%20witness-WITNESSED-10b981?style=flat-square)](https://councilof.ai/interop/root-witness-pointer.json)
[![corrections ledger: 46](https://img.shields.io/badge/corrections%20ledger-46-10b981?style=flat-square)](https://councilof.ai/api/corrections)
[![A2A agent card: 6 skills](https://img.shields.io/badge/A2A%20agent%20card-6%20skills-10b981?style=flat-square)](https://councilof.ai/.well-known/agent.json)
[![x402 manifest: v2 · live](https://img.shields.io/badge/x402%20manifest-v2%20%C2%B7%20live-10b981?style=flat-square)](https://councilof.ai/.well-known/x402.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](https://github.com/CSOAI-ORG/councilof-ai/blob/master/LICENSE)

## The board today

`GET https://councilof.ai/api/gspc` — schema `csoai.gspc-axes/0.5` · `totals.public_count` = **22 axis · 22 measured** · 14 model fleets · 8 fact runs · 3 public leader scores.

| # | axis | family | kind | n | status | separation | leader carried? |
|---|---|---|---|---|---|---|---|
| 1 | `governance` | gspc | model-comparison | 237 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 2 | `safety` | gspc | model-comparison | 36 | **MEASURED** | TIE | yes — accuracy 0.944 |
| 3 | `provenance` | gspc | model-comparison | 32 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 4 | `continuity` | gspc | model-comparison | 33 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 5 | `conformance` | gspc | model-comparison | 35 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 6 | `openness` | gspc | model-comparison | 32 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 7 | `machinery-conformity` | gspc | model-comparison | 33 | **MEASURED** | UNTESTED | no — no signed card |
| 8 | `care` | gspc | model-comparison | 199 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 9 | `cross-reality` | gspc | model-comparison | 32 | **MEASURED** | UNTESTED | no — no signed card |
| 10 | `detector-interop` | gspc | model-comparison | 33 | **MEASURED** | UNTESTED | no — no signed card |
| 11 | `art5-safeguard` | gspc | model-comparison | 36 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 12 | `swarm` | gspc | model-comparison | 37 | **MEASURED** | SEPARATED | yes — accuracy 0.384 |
| 13 | `affect` | gspc | model-comparison | 41 | **MEASURED** | UNTESTED | no — own model led, excluded |
| 14 | `jail` | gspc | model-comparison | 71 | **MEASURED** | TIE | yes — accuracy 0.5915 |
| 15 | `provenance-controls` | financial | deterministic-facts | 6 | **MEASURED** | — | no leader by design (facts run) |
| 16 | `reserve-attestation` | financial | deterministic-facts | 16 | **MEASURED** | — | no leader by design (facts run) |
| 17 | `regulatory-framework` | financial | deterministic-facts | 16 | **MEASURED** | — | no leader by design (facts run) |
| 18 | `distribution-integrity` | financial | deterministic-facts | 16 | **MEASURED** | — | no leader by design (facts run) |
| 19 | `custody-disclosure` | financial | deterministic-facts | 16 | **MEASURED** | — | no leader by design (facts run) |
| 20 | `ai-adoption-components` | financial | deterministic-facts | 2 | **MEASURED** | — | no leader by design (facts run) |
| 21 | `labour-components` | financial | deterministic-facts | 2 | **MEASURED** | — | no leader by design (facts run) |
| 22 | `humanoid-labour-index` | financial | deterministic-facts | 8 | **MEASURED** | — | no leader by design (facts run) |

Counted from the `axes` array at derive time: 22 rows — MEASURED 22 — agrees with `totals.axes`. Separation over the 14 model-comparison axes: SEPARATED 1 · TIE 2 · UNTESTED 11. A TIE is not a win; UNTESTED is not a win; a facts run has no leader. Living stamp: **SIGNED** (`did:web:csoai.org#board-attestation-1`).

## Integrity stack — every layer has a live URL

| layer | live now | where |
|---|---|---|
| Ed25519-signed measurement cards | **335** cards (`n_cards == n_cells`: True), one key `d4cb0eaa…` = `did:web:csoai.org#card-attestation-1` | [`/signed/card_index.json`](https://councilof.ai/signed/card_index.json) · [how to verify](https://councilof.ai/signed/HOW-TO-VERIFY.md) |
| Signed public root (Merkle) | `csoai.public-root/v1` · root `6347384aa686…` · **167** leaves (`card_count == len(card_sha256)`: True) · as_of `2026-09-05T12:39:29Z` · signed: True | [`/root.json`](https://councilof.ai/root.json) · [how to verify the root](https://councilof.ai/signed/HOW-TO-VERIFY-ROOT.md) |
| Transparency-log witness | Rekor **WITNESSED** · OpenTimestamps `STAMPED_PENDING_BITCOIN` · EAS `NOT_YET` · witnessed root `6347384aa686…` — equals live `root.json` at derive time: **True** · pointer's own last drift check `DRIFTED` at `2026-09-05T12:39:37Z` · conflict `NONE` | [`/interop/root-witness-pointer.json`](https://councilof.ai/interop/root-witness-pointer.json) · [sidecar](https://councilof.ai/interop/root-witness-latest.json) |
| Living board stamp | **SIGNED** under `did:web:csoai.org#board-attestation-1` | [`/api/gspc` → `measured_on.living_stamp`](https://councilof.ai/api/gspc) |
| Corrections ledger | **46** entries · latest `C-2026-0822-01` (2026-08-22) · signature_state **STALE** · CC-BY-4.0 | [`/api/corrections`](https://councilof.ai/api/corrections) |
| Third-party Hub cells | **826** cells: MEASURED 756 · UNMEASURED 70 · complete read: True | [`/api/hub-cards`](https://councilof.ai/api/hub-cards) |
| Keys (DID) | `did:web:csoai.org` · 5 verification methods · card key x=`1MsOqhbV9Q…` | [`/.well-known/did.json`](https://csoai.org/.well-known/did.json) |

Three different card numbers appear above on purpose and are never reconciled here: the **signed-card chain** (335), the **public-root leaf count** (167) and the **Hub cells** (826) are three populations with three source URLs. Quote each with its URL.

**Buyers (the one number):** `distinct_nonself_payers` = **0** all-time · 0 in 30 d · 0 settlements · status MEASURED — read from [`/api/revenue`](https://councilof.ai/api/revenue). Published because a measurement body that hides its own zero has no standing to publish anyone else's.

## Verify in 4 curls

```bash
# 1. the lid — the one sentence the board is allowed to say about itself
curl -s https://councilof.ai/api/gspc | python3 -c 'import sys,json; print(json.load(sys.stdin)["totals"]["lid"])'

# 2. the signed public root — Merkle root, leaf count, timestamp (card_count MUST equal len(card_sha256))
curl -s https://councilof.ai/root.json | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r["merkle_root"], r["card_count"], len(r["card_sha256"]), r["as_of"])'

# 3. pin the card key from the DID document — never trust the key a card ships with
curl -s https://csoai.org/.well-known/did.json | python3 -c 'import sys,json,base64; k=[v for v in json.load(sys.stdin)["verificationMethod"] if v["id"].endswith("#card-attestation-1")][0]["publicKeyJwk"]["x"]; print(base64.urlsafe_b64decode(k+"="*(-len(k)%4)).hex())'

# 4. verify any card against that pinned key — three states only: VALID · INVALID · UNCHECKABLE
pipx run --spec 'csoai-gspc[verify]' csoai-gspc verify "$(curl -s https://councilof.ai/signed/card_index.json | python3 -c 'import sys,json; print(json.load(sys.stdin)["cards"][0]["card"])')"
```

## Products (evidence artefacts behind an x402 door — never a grade, never a price on this page)

| product | what you get | 402 door (live status at derive time) |
|---|---|---|
| `commission-card` | Commission a signed card (request-attestation) | [`/api/request-attestation?subject=csoai&axis=honesty`](https://councilof.ai/api/request-attestation?subject=csoai&axis=honesty) → **402** |
| `evidence-bundle` | Evidence bundle mapped to an obligation | [`/api/evidence-bundle?obligation=article-50&subject=csoai&bundle=1`](https://councilof.ai/api/evidence-bundle?obligation=article-50&subject=csoai&bundle=1) → **402** |
| `eu-ai-act-pack` | EU AI Act pack (Article 50 / 53 transparency) | [`/api/evidence-bundle?obligation=article-53&subject=csoai&bundle=1`](https://councilof.ai/api/evidence-bundle?obligation=article-53&subject=csoai&bundle=1) → **402** |
| `swift-bank-pack` | SWIFT/bank census evidence pack | [`/api/evidence-bundle?obligation=dora&subject=csoai&bundle=1`](https://councilof.ai/api/evidence-bundle?obligation=dora&subject=csoai&bundle=1) → **402** |
| `xrpl-asset-evidence` | XRPL asset evidence card (per request) | [`/api/rwa/evidence?asset=RLUSD`](https://councilof.ai/api/rwa/evidence?asset=RLUSD) → **402** |
| `signed-data-feed` | Signed data feed (assembly + cadence) | [`/api/eunomia-data?feed=1`](https://councilof.ai/api/eunomia-data?feed=1) → **402** |
| `provider-diff-feed` | Provider document diff feed | [`/api/feeds/provider-diff?history=1`](https://councilof.ai/api/feeds/provider-diff?history=1) → **402** |
| `receipts-batch` | Receipts batch (historical measurement leaves) | [`/api/receipts/batch?from=2026-09-01&to=2026-09-05`](https://councilof.ai/api/receipts/batch?from=2026-09-01&to=2026-09-05) → **402** |

_8 SKUs read from `docs/product/_INDEX.json` (as_of 2026-09-05T12:20:02Z). A **402** means the door is metered by x402 and the amount appears only in that 402 challenge — never here, never on the board. Verification of every artefact is free._

## Repositories that carry the estate

| repo | what it does |
|---|---|
| [`councilof-ai`](https://github.com/CSOAI-ORG/councilof-ai) | 📏 Measures AI systems on frozen instruments and publishes the live 22-axis GSPC board, Ed25519-signed cards, a signed Merkle root with a Rekor witness, and a public corrections ledger — councilof.ai. Measurement, not certification. |
| [`gspc-board`](https://github.com/CSOAI-ORG/gspc-board) | 🪞 Mirrors GET councilof.ai/api/gspc as dated JSON/parquet snapshots — every count derived from the axes array, every card Ed25519-verifiable without an account. CC0 data. |
| [`a2a-signed-receipts`](https://github.com/CSOAI-ORG/a2a-signed-receipts) | 🧾 Extends A2A with signed-receipts/v1 — did:web key-trust for §8.4 AgentCard signing plus Ed25519-signed task-outcome receipts. Evidence of what was claimed, not a certification. |
| [`inspect-receipts`](https://github.com/CSOAI-ORG/inspect-receipts) | 🔏 Signs every Inspect AI eval run with an Ed25519, hash-chained, offline-verifiable measurement receipt. Evidence of what was claimed and when — not certification. |
| [`corpus-watch`](https://github.com/CSOAI-ORG/corpus-watch) | 👁️ Watches the EU AI Act (CELLAR) and UK statute daily by hash and reports drift; fail-closed — UNKNOWN is never reported as unchanged. |
| [`carder`](https://github.com/CSOAI-ORG/carder) | 🗂️ Emits deterministic JSON fact-cards for public datasets and benchmarks — facts with dates, an adjective lint, no LLM judge. Measurement, not certification. |

## Elsewhere

- **Hugging Face** [`csoai`](https://huggingface.co/csoai) — 99 datasets (frozen banks, hub cards), 39 Spaces, 2 models
- **Zenodo** — methodology [10.5281/zenodo.21991104](https://doi.org/10.5281/zenodo.21991104) (this version `10.5281/zenodo.21991105`, 2026-08-18) · board snapshot [10.5281/zenodo.22344048](https://doi.org/10.5281/zenodo.22344048) (this version `10.5281/zenodo.22344048`, 2026-09-05)
- **PyPI** [`csoai-gspc`](https://pypi.org/project/csoai-gspc/) 0.2.20260905 (Apache-2.0) · **npm** [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp) 0.2.1 (Apache-2.0) — stdio MCP server over the same endpoints
- **A2A** agent card [`/.well-known/agent.json`](https://councilof.ai/.well-known/agent.json) — `Council of AI — Measurement Agent`, 6 skills · **x402** manifest [`/.well-known/x402.json`](https://councilof.ai/.well-known/x402.json) — `csoai.x402/0.2`, network `eip155:8453`, mode `live`, 9 metered resources
- **Honesty page** [councilof.ai/honesty](https://councilof.ai/honesty/) — our own models losing our own arena, published

## Contributing

- **Challenge a measurement:** open a [measurement challenge](https://github.com/CSOAI-ORG/.github/issues/new?template=measurement-challenge.yml) — cite the card id and the frozen bank row.
- **Report a defect:** [defect template](https://github.com/CSOAI-ORG/.github/issues/new?template=defect.yml). Accepted defects land in the public [corrections ledger](https://councilof.ai/api/corrections), never in a silent edit.
- **Code:** PRs into [`councilof-ai`](https://github.com/CSOAI-ORG/councilof-ai) run the same gates as a deploy (`pr-gates.yml`). Read [CONTRIBUTING](https://github.com/CSOAI-ORG/.github/blob/main/CONTRIBUTING.md) and [SECURITY](https://github.com/CSOAI-ORG/.github/blob/main/SECURITY.md).
- **What we never do:** certify; sell ratings, ranking position or early sight of a grade; remediate for a fee; or take money from anything we rank.

---

<sub>CSOAI Ltd · UK Companies House 16939677 · 3rd Floor 86-90 Paul Street, London EC2A 4NE · nicholas@csoai.org · derived 2026-09-05T14:19:51Z</sub>
