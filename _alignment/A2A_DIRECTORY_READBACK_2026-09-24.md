# CSOAI A2A directory readback — 2026-09-24

Read at **2026-09-24T22:53:09Z**. Public reads only; **no registry edit, submission, claim, A2A task, signing, payment, or site deployment** was made.

| Surface | Public readback |
| --- | --- |
| Canonical card | [councilof.ai/.well-known/agent-card.json](https://councilof.ai/.well-known/agent-card.json): HTTP 200, `application/a2a+json`; declares A2A v1.0 JSON-RPC at [councilof.ai/api/a2a](https://councilof.ai/api/a2a). Card availability is not a task result. |
| a2aregistry.org listing | [Agent 48e5bba6-8848-4adc-8f92-b5fa2c0744e0](https://a2aregistry.org/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0/) names the canonical card and `/api/a2a` endpoint correctly. Its [agent API](https://a2aregistry.org/api/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0) reports `is_healthy: true` and `conformance: true`. Its separate [health API](https://a2aregistry.org/api/agents/48e5bba6-8848-4adc-8f92-b5fa2c0744e0/health) reports 47/47 successful card checks, 100% uptime, last check **2026-09-24T22:45:17.925024Z**. |
| a2aregistry.org task probe | The same agent API reports `task_conformance.passed: false`, category `OTHER`, checked **2026-09-24T02:05:09.992163Z**. `status_notes`: “Returning errors when contacted by users (Agent returned an unexpected error)”. `maintainer_notes`: smoke test against `message/send` failed with an unrecognised error; full error is in registry worker logs. **The 47/47 card checks do not establish task execution.** |
| a2a-registry.org listing | [Council of AI — Measurement Agent](https://www.a2a-registry.org/agent/ai.councilof.council_of_ai__measurement_agent) is publicly indexed with the same manifest URL. Its [public agent API](https://api.a2a-registry.org/public/agents/ai.councilof.council_of_ai__measurement_agent) reports `verification_level: unclaimed`, `lastCheckStatus: changed`, and `lastCheckedAt: 2026-09-20T02:13:20Z`. These are directory states, not A2A task validation. |
| allagents.app listing | [Council of AI — Measurement Agent](https://allagents.app/agent/council-of-ai-measurement-agent) is already self-listed and claimed, created **2026-09-24T16:40:00.683Z**, with `a2a: https://councilof.ai/api/a2a`. No duplicate listing was submitted. |

The actionable discrepancy is the failed `message/send` probe on a2aregistry.org while the card is healthy. A correction needs the registry's full worker-log error and likely an endpoint change or an owner/operator update; neither was performed in this directory-only readback.
