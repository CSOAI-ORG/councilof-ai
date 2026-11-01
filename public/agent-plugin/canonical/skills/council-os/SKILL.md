---
name: council-os
description: Navigate the Council OS operating surface and route by evidence state. Use for Council OS, the /os surface, GPAI, RAS, standards adapters, tools, evidence, verify, operations, products, or any question about what is live versus merely catalogued.
---

# Council OS

Council OS is the operating surface at https://councilof.ai/os. It must reveal the **state** of a
capability rather than flattening pages, adapters and measurements into one list.

## Primary modules

1. **Measure** — subjects, deterministic runs, axes, the living board.
2. **Standards Lab** — named adapters for OWASP Agentic, OWASP MCP, Microsoft agent safety, SCITT
   and C2PA. A standards mapping is not a legal verdict and not a GSPC score.
3. **Evidence** — quarantine, observations, candidate findings, replay, provenance, admission.
4. **Verify** — signed Council cards and external attachments with three-state verdicts.
5. **Operations** — authenticated N-site census, queues, workers, costs, failures, signer separation.
6. **Products** — GPAI evidence packs, RAS measurement work, machine access, embeds, reports.
   A grade is never sold.

## Status vocabulary — use only the most specific supported state

| State | Meaning |
|---|---|
| `DISCOVERED` | metadata or a listing exists |
| `CATALOGUED` | an adapter or tool is recorded, not necessarily callable |
| `STATIC_OBSERVED` | a pinned artifact passed a named static predicate |
| `RUNTIME_OBSERVED` | a pinned subject produced a captured runtime result |
| `CANDIDATE_FINDING` | an observation awaits independent replay or admission |
| `REPRODUCED` | the same frozen procedure reproduced the observation |
| `MEASURED` | an admitted cell exists for a unique subject lineage |
| `SIGNED` | the measurement is bound to a verifiable Council card |
| `UNMEASURED` / `UNREACHABLE` / `UNCHECKABLE` | honest terminal states where applicable |

Never substitute `safe`, `approved`, `certified` or `compliant` for one of these states.

## Routing rules

- Use the `gspc` MCP server only for live board and card reads, and for verification.
- Use `csoai-governance` only for sealing artifacts, verifying a seal, policy routing and catalog
  reads. Its output does not automatically create a GSPC cell.
- Treat every other repository or package as `CATALOGUED` until its exact version and behaviour are
  inspected.
- Do not expose credentials, worker controls or paid compute actions in a public unauthenticated module.
- Do not claim a worker is live from a configured endpoint alone. Require a fresh heartbeat and a
  completed test job.
- A `CATALOGUED` capability is not a working capability, and a configured endpoint is not a live one.

## The boundary this body holds

Council of AI measures third-party systems and does not rank its own artefacts. When a question
concerns CSOAI's own products, plugins or models, the honest answer is that this body does not score
itself: report the measurement that exists, name the gaps, and do not produce a leaderboard of our
own work.

## Reporting state

Every report carries: the source URL, the observed time, the subject identity, the instrument
version, the executor identity, and the limitations. A state without its source is null, never zero.
