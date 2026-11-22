# Viewer fix notes: Nicholastempleman/csoai-measurement-cards

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/test: TypeError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `cards-axis-evals-axis-eval-agent-economy` | 1 | 1 | full | no |
| `cards-axis-evals-axis-eval-anti-gaming` | 1 | 1 | full | no |
| `cards-axis-evals-axis-eval-arc-reasoning` | 1 | 1 | full | no |
| `cards-axis-evals-axis-eval-bond-router` | 1 | 1 | full | no |
| `cards-axis-evals-axis-eval-data-dao` | 1 | 1 | full | no |
| `cards-axis-evals-axis-eval-oversight` | 1 | 1 | full | no |
| `cards-axis-evals-axis-eval-stock-market` | 1 | 1 | full | no |
| `cards-discovery-agent-card-affect` | 1 | 1 | full | no |
| `cards-discovery-agent-card-care` | 1 | 1 | full | no |
| `cards-discovery-agent-card-conformance` | 1 | 1 | full | no |
| `cards-discovery-agent-card-continuity` | 1 | 1 | full | no |
| `cards-discovery-agent-card-governance` | 1 | 1 | full | no |
| `cards-discovery-agent-card-jail` | 1 | 1 | full | no |
| `cards-discovery-agent-card-openness` | 1 | 1 | full | no |
| `cards-discovery-agent-card-provenance` | 1 | 1 | full | no |
| `cards-discovery-agent-card-safety` | 1 | 1 | full | no |
| `cards-discovery-agent-card-swarm` | 1 | 1 | full | no |
| `cards-discovery-agent-card` | 1 | 1 | full | no |
| `cards-discovery-arena-elo` | 1 | 1 | full | no |
| `cards-discovery-court-of-record` | 1 | 1 | full | no |
| `cards-discovery-crosswalk-anthropic-rsp` | 1 | 1 | full | no |
| `cards-discovery-crosswalk-gpaicp` | 1 | 1 | full | no |
| `cards-discovery-crosswalk-mitre-atlas` | 1 | 1 | full | no |
| `cards-discovery-sample` | 3 | 3 | full (per-file) | yes, of 13 |
| `cards-discovery-v2-sample` | 3 | 3 | full (per-file) | yes, of 13 |

## Notes / exclusions
- 10 smaller file groups not given configs (cap 25): cards/discovery/crosswalk-nist-ai-rmf.json, cards/discovery/crosswalk-owasp-llm.json, cards/discovery/crosswalk-sg-ai-verify.json, cards/discovery/crosswalk-us-traiga.json, cards/discovery/east-west-map.json, cards/discovery/gpai-first-fine.json, cards/discovery/load-bearing.json, cards/discovery/meok-mcp.json, cards/discovery/sector-boards.json, cards/discovery/wave-dashboard.json
- cards/discovery/*.json: 13 files; schemas tested on 13; 8 distinct Arrow schemas; 6 files kept in 2 config(s); 1 unloadable ({"HTTPStatusError: Client error '429 Too Many Requests' for url 'https:/": 1})
- 5 further configs dropped by cap

**Owner recommendation:** these file groups mix many nested JSON shapes (one object per file, keys vary between files). The configs above expose the largest schema-consistent subsets. For full viewer coverage, publish a normalised table (JSONL or Parquet with flat columns, nested parts as JSON strings) and point a config at it.
