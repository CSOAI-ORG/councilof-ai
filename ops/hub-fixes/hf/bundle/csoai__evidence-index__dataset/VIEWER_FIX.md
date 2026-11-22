# Viewer fix notes: csoai/evidence-index

Viewer status before: `{'error': 'Not supported: dataset viewer is disabled in csoai/evidence-index configuration.'}`

Original failure: Not supported: dataset viewer is disabled in csoai/evidence-index configuration.

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `gspc-pulse-alerts` | 1 | 11 | full | no |
| `gspc-pulse-academy-curriculum-leaves` | 1 | 10 | full | no |
| `gspc-pulse-frameworks` | 1 | 5 | full | no |
| `gspc-pulse-claims-claims-ledger` | 1 | 3 | full | no |
| `manifests` | 151 | 161 | full | no |
| `measurement-index-rekor-receipt` | 32 | 32 | full | no |
| `ots-upgraded-ots-upgrade` | 26 | 26 | full | no |
| `checks-datasets-csoai-faq` | 1 | 1 | full | no |
| `checks-spaces-csoai-faq` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-agi` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-asi` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-det` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-gov` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-mcp` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-oss` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-prv` | 1 | 1 | full | no |
| `checks-spaces-csoai-gspc-xr` | 1 | 1 | full | no |
| `enumeration-owners` | 1 | 1 | full | no |
| `gspc-pulse-academy-completions-schema` | 1 | 1 | full | no |
| `checks-sample` | 38 | 38 | full (per-file) | yes, of 151 |
| `measurement-index-sample` | 6 | 6 | full (per-file) | yes, of 35 |
| `measurement-index-signed-sample` | 4 | 4 | full (per-file) | yes, of 35 |
| `measurement-index-v2-sample` | 3 | 3 | full (per-file) | yes, of 35 |
| `measurement-index-v3-sample` | 3 | 3 | full (per-file) | yes, of 35 |
| `measurement-index-rekor-entry-sample` | 1 | 1 | full (per-file) | yes, of 32 |

## Notes / exclusions
- excluded JSON-Schema file(s) gspc-pulse/*/discovery/mcp-server.json
- 14 smaller file groups not given configs (cap 25): gspc-pulse/*/academy/completions/first-receipt.json, gspc-pulse/*/academy/curriculum-manifest.json, gspc-pulse/*/academy/lessons.json, gspc-pulse/*/academy/sources.json, gspc-pulse/*/deep-board/*.json, gspc-pulse/*/discovery/*.json, gspc-pulse/*/discovery/*.manifest.json, gspc-pulse/*/feed.json, gspc-pulse/*/frameworks/crosswalk.json, gspc-pulse/*/frameworks/obligation-index.json, gspc-pulse/*/inside/chatgpt-action-openapi.json, gspc-pulse/*/inside/extension/manifest.json, gspc-pulse/*/kaggle/kernel-metadata.json, gspc-pulse/*/latest.json
- checks/*.json: 151 files; schemas tested on 40; 3 distinct Arrow schemas; 38 files kept in 1 config(s); 0 unloadable
- measurement-index/*/*.json: 35 files; schemas tested on 35; 24 distinct Arrow schemas; 12 files kept in 3 config(s); 0 unloadable
- measurement-index/*/*.signed.json: 35 files; schemas tested on 35; 3 distinct Arrow schemas; 4 files kept in 1 config(s); 29 unloadable ({'ValueError: Expected object or value at position 0': 29})
- measurement-index/*/*.rekor-entry.json: 32 files; schemas tested on 32; 32 distinct Arrow schemas; 1 files kept in 1 config(s); 0 unloadable
- 8 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
