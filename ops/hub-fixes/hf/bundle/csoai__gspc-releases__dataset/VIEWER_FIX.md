# Viewer fix notes: csoai/gspc-releases

Viewer status before: `{'preview': False, 'viewer': False, 'search': False, 'filter': False, 'statistics': False}`

Original failure: default/train: CastError

## Proposed configs (each loaded locally with `datasets` 5.2.0)

| config | files | rows loaded | method | partial |
|---|---|---|---|---|
| `axes` | 2 | 2 | full | no |
| `axis-registry` | 1 | 1 | full | no |
| `release` | 1 | 1 | full | no |
| `axes-affect` | 1 | 1 | full | no |
| `axes-ai-adoption-components` | 1 | 1 | full | no |
| `axes-care` | 1 | 1 | full | no |
| `axes-claim-maintenance` | 1 | 1 | full | no |
| `axes-company-practice` | 1 | 1 | full | no |
| `axes-conformance` | 1 | 1 | full | no |
| `axes-continuity` | 1 | 1 | full | no |
| `axes-cross-reality` | 1 | 1 | full | no |
| `axes-custody-disclosure` | 1 | 1 | full | no |
| `axes-detector-interop` | 1 | 1 | full | no |
| `axes-distribution-integrity` | 1 | 1 | full | no |
| `axes-effect-binding` | 1 | 1 | full | no |
| `axes-governance` | 1 | 1 | full | no |
| `axes-harness-fidelity` | 1 | 1 | full | no |
| `axes-humanoid-deployment` | 1 | 1 | full | no |
| `axes-humanoid-labour-index` | 1 | 1 | full | no |
| `axes-interop-conformance` | 1 | 1 | full | no |
| `axes-jail` | 1 | 1 | full | no |
| `axes-lab-practice` | 1 | 1 | full | no |
| `axes-labour-components` | 1 | 1 | full | no |
| `axes-machinery-conformity` | 1 | 1 | full | no |
| `axes-measurer-integrity` | 1 | 1 | full | no |

## Notes / exclusions
- 10 smaller file groups not given configs (cap 25): */axes/openness.json, */axes/provenance-controls.json, */axes/provenance.json, */axes/regulator-transparency.json, */axes/regulatory-framework.json, */axes/reserve-attestation.json, */axes/safety.json, */axes/serving-fidelity.json, */axes/swarm.json, */axes/watchdog-ingest.json
