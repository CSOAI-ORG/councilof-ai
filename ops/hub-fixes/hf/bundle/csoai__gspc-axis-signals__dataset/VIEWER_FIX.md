# Viewer fix notes: csoai/gspc-axis-signals

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: TypeError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `root-json` | 2 | 2 | full | no |
| `affect` | 1 | 1 | full | no |
| `ai-adoption-components` | 1 | 1 | full | no |
| `care` | 1 | 1 | full | no |
| `claim-maintenance` | 1 | 1 | full | no |
| `company-practice` | 1 | 1 | full | no |
| `conformance` | 1 | 1 | full | no |
| `continuity` | 1 | 1 | full | no |
| `cross-reality` | 1 | 1 | full | no |
| `custody-disclosure` | 1 | 1 | full | no |
| `detector-interop` | 1 | 1 | full | no |
| `distribution-integrity` | 1 | 1 | full | no |
| `effect-binding` | 1 | 1 | full | no |
| `governance` | 1 | 1 | full | no |
| `harness-fidelity` | 1 | 1 | full | no |
| `humanoid-deployment` | 1 | 1 | full | no |
| `humanoid-labour-index` | 1 | 1 | full | no |
| `interop-conformance` | 1 | 1 | full | no |
| `jail` | 1 | 1 | full | no |
| `lab-practice` | 1 | 1 | full | no |
| `labour-components` | 1 | 1 | full | no |
| `machinery-conformity` | 1 | 1 | full | no |
| `measurer-integrity` | 1 | 1 | full | no |
| `openness` | 1 | 1 | full | no |
| `provenance-controls` | 1 | 1 | full | no |

## Notes / exclusions
- 8 smaller file groups not given configs (cap 25): */provenance.json, */regulator-transparency.json, */regulatory-framework.json, */reserve-attestation.json, */safety.json, */serving-fidelity.json, */swarm.json, */watchdog-ingest.json
