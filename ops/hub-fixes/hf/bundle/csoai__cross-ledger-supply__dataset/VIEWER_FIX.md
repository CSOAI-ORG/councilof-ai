# Viewer fix notes: csoai/cross-ledger-supply

Viewer status before: `{'error': 'Not supported: dataset viewer is disabled in csoai/cross-ledger-supply configuration.'}`

Original failure: Not supported: dataset viewer is disabled in csoai/cross-ledger-supply configuration.

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `ots-upgraded-ots-upgrade` | 21 | 21 | full | no |
| `xl-daily-assets-bny-digital-cash` | 21 | 21 | full (per-file) | no |
| `xl-daily-assets-buidl` | 21 | 21 | full (per-file) | no |
| `xl-daily-assets-citi-token-services` | 21 | 21 | full (per-file) | no |
| `xl-daily-assets-dai` | 21 | 21 | full | no |
| `xl-daily-assets-swift-ledger` | 21 | 21 | full | no |
| `xl-daily-assets-usdc` | 21 | 21 | full | no |
| `xl-daily-assets-usdg` | 21 | 21 | full | no |
| `xl-daily-assets-usds` | 21 | 21 | full | no |
| `xl-daily-proofs-rlusd-base-rlusd-proof` | 21 | 21 | full | no |
| `xl-daily-proofs-sample` | 24 | 24 | full (per-file) | yes, of 709 |
| `xl-daily-assets-sample` | 20 | 20 | full (per-file) | yes, of 42 |
| `xl-daily-signed-sample` | 20 | 20 | full (per-file) | yes, of 42 |
| `xl-daily-assets-ousg-sample` | 20 | 20 | full (per-file) | yes, of 21 |
| `xl-daily-assets-usyc-sample` | 20 | 20 | full (per-file) | yes, of 21 |
| `xl-daily-assets-usde-sample` | 19 | 19 | full (per-file) | yes, of 21 |
| `xl-daily-assets-eurc-sample` | 18 | 18 | full (per-file) | yes, of 21 |
| `xl-daily-assets-usdt-sample` | 18 | 18 | full (per-file) | yes, of 21 |
| `xl-daily-assets-usdy-sample` | 17 | 17 | full (per-file) | yes, of 21 |
| `xl-daily-assets-v2-sample` | 15 | 15 | full (per-file) | yes, of 42 |
| `xl-daily-assets-ustb-sample` | 13 | 13 | full (per-file) | yes, of 21 |
| `xl-daily-assets-jpmd-sample` | 12 | 12 | full (per-file) | yes, of 21 |
| `xl-daily-signed-v2-sample` | 11 | 11 | full (per-file) | yes, of 42 |
| `xl-daily-assets-pyusd-sample` | 10 | 10 | full (per-file) | yes, of 21 |
| `xl-daily-assets-pyusd-v2-sample` | 10 | 10 | full (per-file) | yes, of 21 |

## Notes / exclusions
- 15 smaller file groups not given configs (cap 25): xl-daily/*/proofs/rlusd-ink-RLUSD-proof.json.gz, xl-daily/*/proofs/usdc-celo-USDC-proof.json.gz, xl-daily/*/proofs/usdc-ink-USDC-proof.json.gz, xl-daily/*/proofs/usdc-linea-USDC-proof.json.gz, xl-daily/*/proofs/usdc-morph-USDC-proof.json.gz, xl-daily/*/proofs/usdc-noble-USDC-proof.json.gz, xl-daily/*/proofs/usdc-polygon-USDC-proof.json.gz, xl-daily/*/proofs/usdc-sonic-USDC-proof.json.gz, xl-daily/*/proofs/usdg-ink-USDG-proof.json.gz, xl-daily/*/proofs/usdg-mantle-USDG-proof.json.gz, xl-daily/*/proofs/usdt-kava-USDT-proof.json.gz, xl-daily/*/proofs/usdy-noble-USDY-proof.json.gz, xl-daily/*/proo
- xl-daily/*/proofs/*.json.gz: 709 files; schemas tested on 40; 5 distinct Arrow schemas; 38 files kept in 3 config(s); 0 unloadable
- xl-daily/*/assets/*.json.gz: 42 files; schemas tested on 40; 6 distinct Arrow schemas; 37 files kept in 3 config(s); 0 unloadable
- xl-daily/*/*.json: 42 files; schemas tested on 40; 26 distinct Arrow schemas; 17 files kept in 3 config(s); 0 unloadable
- xl-daily/*/*.signed.json: 42 files; schemas tested on 40; 4 distinct Arrow schemas; 39 files kept in 3 config(s); 0 unloadable
- xl-daily/*/assets/benji.json.gz: 21 files; schemas tested on 21; 0 distinct Arrow schemas; 0 files kept in 0 config(s); 21 unloadable ({'ValueError: Value is too big! at position 62604': 2, 'ValueError: Value is too big! at position 61196': 1})
- xl-daily/*/assets/jpmd.json.gz: 21 files; schemas tested on 21; 4 distinct Arrow schemas; 20 files kept in 3 config(s); 0 unloadable
- xl-daily/*/assets/ousg.json.gz: 21 files; schemas tested on 21; 2 distinct Arrow schemas; 20 files kept in 1 config(s); 0 unloadable
- xl-daily/*/assets/pyusd.json.gz: 21 files; schemas tested on 21; 3 distinct Arrow schemas; 20 files kept in 2 config(s); 0 unloadable
- xl-daily/*/assets/rlusd.json.gz: 21 files; schemas tested on 21; 5 distinct Arrow schemas; 18 files kept in 2 config(s); 0 unloadable
- xl-daily/*/assets/usde.json.gz: 21 files; schemas tested on 21; 3 distinct Arrow schemas; 19 files kept in 1 config(s); 0 unloadable
- xl-daily/*/assets/usdt.json.gz: 21 files; schemas tested on 21; 3 distinct Arrow schemas; 20 files kept in 2 config(s); 0 unloadable
- xl-daily/*/assets/usdy.json.gz: 21 files; schemas tested on 21; 3 distinct Arrow schemas; 20 files kept in 2 config(s); 0 unloadable
- xl-daily/*/assets/ustb.json.gz: 21 files; schemas tested on 21; 5 distinct Arrow schemas; 19 files kept in 3 config(s); 0 unloadable
- xl-daily/*/assets/usyc.json.gz: 21 files; schemas tested on 21; 2 distinct Arrow schemas; 20 files kept in 1 config(s); 0 unloadable
- 16 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
