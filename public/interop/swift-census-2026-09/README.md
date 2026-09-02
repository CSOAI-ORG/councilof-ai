# SWIFT 26 census — public.notice pack (2026-09)

**Surface:** `public.notice` (unsigned card-v0)  
**Live authority:** [`GET https://councilof.ai/api/swift`](https://councilof.ai/api/swift) · schema `csoai.swift-census/0.1`  
**Counts:** **n=26** · **LIVE 3** · **COMMITTED 9** · **DISCOVERED 14** · **`n_measured=0`**

Honest sentence on every card:

> **Public notice hashed. Not independently recomputed. Settlement still off-chain.**

Locks held: `writes_board: false` · `sig_ed25519: null` · `settlement_still_off_chain: true` · `n_measured: 0` stays 0.  
No ISO 20022 claim. No on-ledger object claim. No invented banks / scores / MEASURED.

## Three states

| State | n | Meaning (from live census) |
| --- | ---: | --- |
| LIVE | 3 | Named in a dated live-transaction press notice (HSBC, Standard Chartered, UOB) |
| COMMITTED | 9 | Named in construction-phase / MVP cohort source; not live |
| DISCOVERED | 14 | Named in 9 Jul 2026 pilot cohort (and/or secondary); no live transaction sourced |

## Cards (26)

| id | name | status | card |
| --- | --- | --- | --- |
| `hsbc` | HSBC | LIVE | [`card-hsbc-public-notice-unsigned.json`](./card-hsbc-public-notice-unsigned.json) |
| `standard-chartered` | Standard Chartered | LIVE | [`card-standard-chartered-public-notice-unsigned.json`](./card-standard-chartered-public-notice-unsigned.json) |
| `uob` | UOB | LIVE | [`card-uob-public-notice-unsigned.json`](./card-uob-public-notice-unsigned.json) |
| `anz` | ANZ | DISCOVERED | [`card-anz-public-notice-unsigned.json`](./card-anz-public-notice-unsigned.json) |
| `bnp-paribas` | BNP Paribas | DISCOVERED | [`card-bnp-paribas-public-notice-unsigned.json`](./card-bnp-paribas-public-notice-unsigned.json) |
| `bny` | BNY | DISCOVERED | [`card-bny-public-notice-unsigned.json`](./card-bny-public-notice-unsigned.json) |
| `citi` | Citi | DISCOVERED | [`card-citi-public-notice-unsigned.json`](./card-citi-public-notice-unsigned.json) |
| `dbs` | DBS | DISCOVERED | [`card-dbs-public-notice-unsigned.json`](./card-dbs-public-notice-unsigned.json) |
| `fab` | First Abu Dhabi Bank | DISCOVERED | [`card-fab-public-notice-unsigned.json`](./card-fab-public-notice-unsigned.json) |
| `firstrand` | FirstRand Bank Limited | DISCOVERED | [`card-firstrand-public-notice-unsigned.json`](./card-firstrand-public-notice-unsigned.json) |
| `itau-unibanco` | Itaú Unibanco | DISCOVERED | [`card-itau-unibanco-public-notice-unsigned.json`](./card-itau-unibanco-public-notice-unsigned.json) |
| `lloyds` | Lloyds Bank | DISCOVERED | [`card-lloyds-public-notice-unsigned.json`](./card-lloyds-public-notice-unsigned.json) |
| `mashreq` | Mashreq | DISCOVERED | [`card-mashreq-public-notice-unsigned.json`](./card-mashreq-public-notice-unsigned.json) |
| `mufg` | MUFG Bank | DISCOVERED | [`card-mufg-public-notice-unsigned.json`](./card-mufg-public-notice-unsigned.json) |
| `ocbc` | OCBC | DISCOVERED | [`card-ocbc-public-notice-unsigned.json`](./card-ocbc-public-notice-unsigned.json) |
| `ubs` | UBS | DISCOVERED | [`card-ubs-public-notice-unsigned.json`](./card-ubs-public-notice-unsigned.json) |
| `wells-fargo` | Wells Fargo | DISCOVERED | [`card-wells-fargo-public-notice-unsigned.json`](./card-wells-fargo-public-notice-unsigned.json) |
| `jpmorgan` | JPMorgan | COMMITTED | [`card-jpmorgan-public-notice-unsigned.json`](./card-jpmorgan-public-notice-unsigned.json) |
| `deutsche-bank` | Deutsche Bank | COMMITTED | [`card-deutsche-bank-public-notice-unsigned.json`](./card-deutsche-bank-public-notice-unsigned.json) |
| `natwest` | NatWest | COMMITTED | [`card-natwest-public-notice-unsigned.json`](./card-natwest-public-notice-unsigned.json) |
| `rbc` | Royal Bank of Canada | COMMITTED | [`card-rbc-public-notice-unsigned.json`](./card-rbc-public-notice-unsigned.json) |
| `saudi-awwal` | Saudi Awwal Bank | COMMITTED | [`card-saudi-awwal-public-notice-unsigned.json`](./card-saudi-awwal-public-notice-unsigned.json) |
| `shinhan` | Shinhan Bank | COMMITTED | [`card-shinhan-public-notice-unsigned.json`](./card-shinhan-public-notice-unsigned.json) |
| `socgen-forge` | Societe Generale-FORGE | COMMITTED | [`card-socgen-forge-public-notice-unsigned.json`](./card-socgen-forge-public-notice-unsigned.json) |
| `td` | TD Bank Group | COMMITTED | [`card-td-public-notice-unsigned.json`](./card-td-public-notice-unsigned.json) |
| `westpac` | Westpac | COMMITTED | [`card-westpac-public-notice-unsigned.json`](./card-westpac-public-notice-unsigned.json) |

`sig_ed25519` is `null` on every card. **SIGNED needs keystone.** Do not wait on this PR for keystone.

## Hashed notices

Fetched at **2026-09-02T04:37:10Z** (UTC). Method: keyless HTTPS GET; sha256 of exact response bytes when HTTP 200.  
HTML recorded as `*.meta.json` only under [`mirrors/`](./mirrors/) — stranger re-downloads from `source_url` and checks sha256. SPA/CMS HTML is volatile.

| source id | body state | body sha256 (this fetch) | bytes | published |
| --- | --- | --- | ---: | --- |
| `sc_live_19aug` | **HASHED** | `e956da27b1e467b3494ad27bca4e52c3054a0aab7e84aeb262a5afe0d5453fa3` | 132117 | 2026-08-19 |
| `fintechnews_uob_28aug` | **HASHED** | `f6487997bd12f44392c20149ac0895d2309ecbdf2a92f0d0bab3a60329fa4d9b` | 958207 | 2026-08-28 |
| `gfmag_pilot_10jul` | **HASHED** | `455cb787f8a4f021f72c596af05f9c79a0e22fd4061ab6e57276686a7d5505f6` | 109325 | 2026-07-10 |
| `ethers_mvp_2apr` | **HASHED** | `86fa654f76144032ae2bc6a3838a2941d521a572baacfe77768085049f46cd42` | 108091 | 2026-04-02 |
| `swift_pilot_9jul` | **UNCHECKABLE** | `—` | — | 2026-07-09 |

Census `url_sha256` fields on `/api/swift` are **URL-string** fingerprints (not body hashes). Body hashes above are this fetch's content digests.

## UNCHECKABLE

- **Swift primary press HTML body** (`swift_pilot_9jul`) — timed out / 0 bytes this vantage. Cards that cite it still emit; gap declared. Census URL-string sha256: `215626e6c3a947b1d4cef4de1e169ae36c7351786aeb3d434b815f34f98d637f`.
- **cobolbridge.ai** — HTTP **522**. Infra, not this tape. No ISO 20022 / copybook / MT artefact fetched.
- Everything in each card's `unmeasured[]`.
- EAS on Base attestation of root/card sha — estate key owner-gated.

## Hard stops

- Never invent scores / MEASURED.
- Never wrangler. Never shrink `card_index`.
- Never claim we recomputed a transfer or saw an on-ledger object.
- Measurement, not certification. Zero gatekeeper. Banks are not clients.
