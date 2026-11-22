# Field reference: nicktempleman/csoai-registry-harvest-xrpl-mica-lei

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `casp-gleif-status.jsonl`

| field | type | description |
|---|---|---|
| `slug` | string | Observed type string; non-null in 331/331 rows read; example: 21bitcoin |
| `name` | string | Observed type string; non-null in 331/331 rows read; example: 21bitcoin |
| `homeState` | string | Observed type string; non-null in 331/331 rows read; example: AT |
| `lei` | string | Observed type string; non-null in 331/331 rows read; example: 529900HMYYJR2NHVZ124 |
| `registration_status` | string | Observed type string; non-null in 331/331 rows read; example: ISSUED |
| `next_renewal` | datetime | Observed type datetime; non-null in 322/331 rows read; example: 2027-09-11T12:35:10Z |
| `entity_status` | string | Observed type string; non-null in 322/331 rows read; example: ACTIVE |
| `legal_name` | string | Observed type string; non-null in 322/331 rows read; example: FIOR Digital GmbH |
| `err` | string | Observed type string; non-null in 9/331 rows read; example: HTTP Error 404: Not Found |

## `casp-lei-validation.jsonl`

| field | type | description |
|---|---|---|
| `home_state` | string | Observed type string; non-null in 335/335 rows read; example: AT |
| `competent_authority` | string | Observed type string; non-null in 0/335 rows read |
| `commercial_name` | string | Observed type string; non-null in 311/335 rows read; example: Bitpanda |
| `legal_name` | string | Observed type string; non-null in 335/335 rows read; example: Bitpanda GmbH |
| `lei` | string | Observed type string; non-null in 335/335 rows read; example: 5493007WZ7IFULIL8G21 |
| `lei_iso17442_valid` | boolean | Observed type boolean; non-null in 335/335 rows read; example: true |
| `lei_finding` | string | Observed type string; non-null in 335/335 rows read; example: ok |
| `as_of` | datetime | Observed type datetime; non-null in 335/335 rows read; example: 2026-09-04T11:37:16Z |
| `source` | string | Observed type string; non-null in 335/335 rows read; example: ESMA MiCA CASP register CSV, snapshot 2026-08-20, via casptr… |
| `method` | string | Observed type string; non-null in 335/335 rows read; example: ISO 17442 offline validation: 20 alphanumeric characters, ba… |

## `eurcv-multichain.jsonl`

| field | type | description |
|---|---|---|
| `ledger` | string | Observed type string; non-null in 9/9 rows read; example: XRPL |
| `asset_code` | string | Observed type string; non-null in 9/9 rows read; example: EURCV |
| `issuer` | string | Observed type string; non-null in 9/9 rows read; example: rUNaS5sqRuxZz6V7rBGhoSaZiVYA3ut4UL |
| `issuers_using_this_code_in_our_registry` | integer | Observed type integer; non-null in 9/9 rows read; example: 1 |
| `declared_domain` | string | Observed type string; non-null in 6/9 rows read; example: eurcvtoken.space |
| `allowlisting_enforced` | boolean | Observed type boolean; non-null in 9/9 rows read; example: false |
| `freeze_capability_retained` | boolean | Observed type boolean; non-null in 1/9 rows read; example: true |
| `two_way_domain_check` | string | Observed type string; non-null in 9/9 rows read; example: UNCHECKABLE — no Domain declared, so there is nothing to che… |
| `identification_rests_on` | string | Observed type string; non-null in 1/9 rows read; example: XRPScan well-known directory (a third party), not the issuer |
| `holders` | integer | Observed type integer; non-null in 1/9 rows read; example: 120 |
| `supply` | integer | Observed type integer; non-null in 1/9 rows read; example: 10000000 |
| `as_of` | datetime | Observed type datetime; non-null in 9/9 rows read; example: 2026-09-04T11:40:49Z |
| `sources` | string | Observed type string; non-null in 9/9 rows read; example: ["XRPL mainnet account_info (validated ledger)", "Stellar Ho… |
| `rubric` | string | Observed type string; non-null in 9/9 rows read; example: deterministic: ledger-native issuer flags + declared domain … |
| `not_a_compliance_finding` | string | Observed type string; non-null in 9/9 rows read; example: Publishing a stellar.toml or xrp-ledger.toml is not a MiCA r… |
| `issuer_own_domain_publishes_toml` | boolean | Observed type boolean; non-null in 9/9 rows read; example: false |
| `issuer_own_domain_checked` | string | Observed type string; non-null in 9/9 rows read; example: ["https://sgforge.com/.well-known/stellar.toml (404)", "http… |
| `auth_revocable` | boolean | Observed type boolean; non-null in 8/9 rows read; example: false |
| `clawback_enabled` | boolean | Observed type boolean; non-null in 8/9 rows read; example: false |

## `lei-crosswalk.jsonl`

| field | type | description |
|---|---|---|
| `census_name` | string | Observed type string; non-null in 26/26 rows read; example: HSBC |
| `census_state` | string | Observed type string; non-null in 26/26 rows read; example: LIVE |
| `lei` | string | Observed type string; non-null in 26/26 rows read; example: MLU0ZO3ML4LN2LL2TL39 |
| `legal_name` | string | Observed type string; non-null in 26/26 rows read; example: HSBC HOLDINGS PLC |
| `country` | string | Observed type string; non-null in 26/26 rows read; example: GB |
| `registration_status` | string | Observed type string; non-null in 26/26 rows read; example: ISSUED |
| `entity_status` | string | Observed type string; non-null in 26/26 rows read; example: ACTIVE |
| `match` | string | Observed type string; non-null in 26/26 rows read; example: EXACT_NAME_COUNTRY |
| `as_of` | datetime | Observed type datetime; non-null in 26/26 rows read; example: 2026-09-04T07:09:10Z |
| `source` | url | Observed type url; non-null in 26/26 rows read; example: https://api.gleif.org/api/v1/lei-records |
| `rubric` | string | Observed type string; non-null in 26/26 rows read; example: group-head LEI: exact legal name + country + registration st… |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 12/12 rows read; example: casp-lei-validation.jsonl |
| `bytes` | integer | Observed type integer; non-null in 12/12 rows read; example: 154430 |
| `sha256` | string | Observed type string; non-null in 0/12 rows read |
| `blob_id` | string | Observed type string; non-null in 12/12 rows read; example: c836ee858944d7ee6ba453608a2b5255e200318b |
| `url` | url | Observed type url; non-null in 12/12 rows read; example: https://huggingface.co/datasets/csoai/registry-harvest-xrpl-… |
| `as_of` | datetime | Observed type datetime; non-null in 12/12 rows read; example: 2026-09-05T12:52:39Z |

## `mica-art-issuers.json`

Top-level keys: `generatedAt`, `lastChanged`, `source`, `note`, `attribution`, `count`, `items`.


## `mica-emt-issuers.json`

Top-level keys: `generatedAt`, `lastChanged`, `source`, `note`, `attribution`, `count`, `wpCount`, `countries`, `items`.
Records under `items`:

| field | type | description |
|---|---|---|
| `lei` | string | Observed type string; non-null in 23/23 rows read; example: 743700KYSSTKZYGEUF50 |
| `leiName` | string | Observed type string; non-null in 23/23 rows read; example: Paxos Issuance Europe Oy |
| `name` | string | Observed type string; non-null in 23/23 rows read; example: Paxos EU |
| `homeState` | string | Observed type string; non-null in 23/23 rows read; example: FI |
| `authority` | string | Observed type string; non-null in 23/23 rows read; example: Finanssivalvonta (FIN-FSA) |
| `address` | string | Observed type string; non-null in 23/23 rows read; example: Meritullinkatu 1 B 00170 HELSINKI |
| `website` | string | Observed type string; non-null in 23/23 rows read; example: paxos.com |
| `websiteHref` | url | Observed type url; non-null in 23/23 rows read; example: https://www.paxos.com/eu |
| `type` | string | Observed type string; non-null in 23/23 rows read; example: emi |
| `ex484` | boolean | Observed type boolean; non-null in 23/23 rows read; example: false |
| `ex485` | boolean | Observed type boolean; non-null in 23/23 rows read; example: false |
| `exempt` | boolean | Observed type boolean; non-null in 23/23 rows read; example: false |
| `tokens` | string | Observed type string; non-null in 23/23 rows read; example: ["USDG", "EUROe", "eUSD"] |
| `entityAuthDate` | datetime | Observed type datetime; non-null in 23/23 rows read; example: 2022-11-23 |
| `firstWpDate` | datetime | Observed type datetime; non-null in 23/23 rows read; example: 2024-06-29 |
| `lastUpdate` | datetime | Observed type datetime; non-null in 21/23 rows read; example: 2026-04-28 |
| `whitepapers` | string | Observed type string; non-null in 23/23 rows read; example: [{"url": "https://www.membrane.fi/whitepapers/EUROe.html", "… |
| `dti` | string | Observed type string; non-null in 23/23 rows read; example: ["2VT5W3GH7"] |
| `dtiFfg` | string | Observed type string; non-null in 23/23 rows read; example: ["R9MZCNWS4"] |
| `caspSlug` | string | Observed type string; non-null in 8/23 rows read; example: circle |
| `caspWebsite` | string | Observed type string; non-null in 8/23 rows read; example: www.circle.com/en |
| `ctId` | string | Observed type string; non-null in 23/23 rows read; example: CT-14EFBZK |

## `stellar-code-collision.jsonl`

| field | type | description |
|---|---|---|
| `ledger` | string | Observed type string; non-null in 13/13 rows read; example: Stellar |
| `asset_code` | string | Observed type string; non-null in 13/13 rows read; example: USDC |
| `distinct_issuers_publishing_this_code` | integer | Observed type integer; non-null in 13/13 rows read; example: 428 |
| `code_is_ambiguous` | boolean | Observed type boolean; non-null in 13/13 rows read; example: true |
| `as_of` | datetime | Observed type datetime; non-null in 13/13 rows read; example: 2026-09-04T11:51:13Z |
| `source` | string | Observed type string; non-null in 13/13 rows read; example: Stellar Horizon /assets?asset_code=, paged |
| `note` | string | Observed type string; non-null in 13/13 rows read; example: On Stellar an asset is the pair (code, issuer). A code alone… |

## `xrpl-16-factrun.jsonl`

| field | type | description |
|---|---|---|
| `symbol` | string | Observed type string; non-null in 16/16 rows read; example: RLUSD |
| `issuer` | string | Observed type string; non-null in 16/16 rows read; example: Ripple |
| `issuer_address` | string | Observed type string; non-null in 16/16 rows read; example: rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De |
| `state` | string | Observed type string; non-null in 16/16 rows read; example: READ |
| `allowlisting_enforced` | boolean | Observed type boolean; non-null in 16/16 rows read; example: true |
| `issuer_freeze_capability` | boolean | Observed type boolean; non-null in 16/16 rows read; example: true |
| `global_freeze_active` | boolean | Observed type boolean; non-null in 16/16 rows read; example: false |
| `declared_domain` | string | Observed type string; non-null in 7/16 rows read; example: https://ripple.com/ |
| `flags_raw` | integer | Observed type integer; non-null in 16/16 rows read; example: 2174353408 |
| `flags_decoded` | string | Observed type string; non-null in 16/16 rows read; example: ["lsfRequireAuth"] |
| `ledger_index` | integer | Observed type integer; non-null in 16/16 rows read; example: 106750535 |
| `as_of` | datetime | Observed type datetime; non-null in 16/16 rows read; example: 2026-09-04T06:37:57Z |
| `source` | string | Observed type string; non-null in 16/16 rows read; example: XRPL mainnet account_info (validated ledger) |
| `rubric` | string | Observed type string; non-null in 16/16 rows read; example: csoai.gspc-domains/provenance-controls — account-root flags … |

## `xrpl-mica-join.jsonl`

| field | type | description |
|---|---|---|
| `symbol` | string | Observed type string; non-null in 16/16 rows read; example: RLUSD |
| `issuer` | string | Observed type string; non-null in 16/16 rows read; example: Ripple |
| `issuer_address` | string | Observed type string; non-null in 16/16 rows read; example: rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De |
| `state` | string | Observed type string; non-null in 16/16 rows read; example: READ |
| `allowlisting_enforced` | boolean | Observed type boolean; non-null in 16/16 rows read; example: true |
| `issuer_freeze_capability` | boolean | Observed type boolean; non-null in 16/16 rows read; example: true |
| `global_freeze_active` | boolean | Observed type boolean; non-null in 16/16 rows read; example: false |
| `declared_domain` | string | Observed type string; non-null in 7/16 rows read; example: https://ripple.com/ |
| `flags_raw` | integer | Observed type integer; non-null in 16/16 rows read; example: 2174353408 |
| `flags_decoded` | string | Observed type string; non-null in 16/16 rows read; example: ["lsfRequireAuth"] |
| `ledger_index` | integer | Observed type integer; non-null in 16/16 rows read; example: 106750535 |
| `as_of` | datetime | Observed type datetime; non-null in 16/16 rows read; example: 2026-09-04T06:37:57Z |
| `source` | string | Observed type string; non-null in 16/16 rows read; example: XRPL mainnet account_info (validated ledger) |
| `rubric` | string | Observed type string; non-null in 16/16 rows read; example: csoai.gspc-domains/provenance-controls — account-root flags … |
| `mica_emt_authorised` | boolean | Observed type boolean; non-null in 16/16 rows read; example: false |
| `mica_emt_lei` | string | Observed type string; non-null in 5/16 rows read; example: 969500FX8K40ZDW4F377 |
| `mica_home_state` | string | Observed type string; non-null in 5/16 rows read; example: FR |
| `mica_casp_authorised` | boolean | Observed type boolean; non-null in 16/16 rows read; example: false |
| `_join_as_of` | datetime | Observed type datetime; non-null in 16/16 rows read; example: 2026-09-04T07:11:28Z |
| `_join_sources` | string | Observed type string; non-null in 16/16 rows read; example: ["XRPL mainnet account_info", "ESMA MiCA register via casptr… |

## `xrpl-two-way-check.jsonl`

| field | type | description |
|---|---|---|
| `ledger` | string | Observed type string; non-null in 6/6 rows read; example: XRPL |
| `symbol` | string | Observed type string; non-null in 6/6 rows read; example: RLUSD |
| `declared_domain` | string | Observed type string; non-null in 6/6 rows read; example: https://ripple.com/ |
| `two_way_result` | string | Observed type string; non-null in 6/6 rows read; example: PASS |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T11:51:13Z |
| `method` | string | Observed type string; non-null in 6/6 rows read; example: fetch https://<Domain>/.well-known/xrp-ledger.toml and look … |
