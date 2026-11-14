# Capability Fabric: Catalogs → Harnesses → Measurements → Routing

**State:** integration design, not a live integration. The catalog-hive source
adapters currently normalize snapshots from Cisco ARD, the MCP Registry, and
Hugging Face into quarantined discovery candidates. No downstream write into
SOV-X, Layer 0, or GSPC is claimed by this document.

## The product

Build a capability fabric: a provenance-preserving index of models, world-model
artifacts, datasets, skills, MCP servers, A2A agents, harnesses, and governed
tenant services. It gives an orchestrator a way to find eligible options and
choose among them using task-specific measurements, policy, cost, latency, and
available execution resources.

This is a useful route toward more capable system behavior, but the catalog
itself is not AGI/ASI. Catalogs reveal published or authorized metadata; they
do not reveal everything an organization uses, grant permission to invoke an
endpoint, or establish which option performs best.

## One record, multiple evidence states

Keep a stable `capability_id` and append source observations. Never collapse
different providers' records into one source row. The minimum envelope is:

```json
{
  "schema": "csoai.capability-observation/0.1",
  "capability_id": "source-scoped-stable-id",
  "kind": "model|world_model|dataset|skill|mcp_server|a2a_agent|harness|service",
  "source": {
    "catalog_id": "",
    "uri": "",
    "snapshot_sha256": "",
    "record_sha256": "",
    "observed_at": ""
  },
  "subject": {"publisher": "", "name": "", "version": "", "digest": ""},
  "access": {"scope": "public|tenant|gated|unknown", "auth_required": null},
  "license": {"identifier": "", "source_uri": "", "review_state": "UNKNOWN"},
  "interfaces": [],
  "claims": [],
  "state": "DISCOVERED",
  "limitations": []
}
```

Use source-scoped identity first. Cross-catalog matching is a relationship
(`possible_same_subject`) with evidence and confidence, not destructive
deduplication. Preserve versions, publisher changes, access scope, license,
and withdrawal history.

## System boundaries

```text
Public catalogs + owner-authorized tenant catalogs
                    │ read-only, attributed snapshots
                    ▼
Layer O discovery graph ──► candidate quarantine / source receipts
                    │
                    ▼
Harness X selects a permitted, version-pinned test
                    │ isolated run + replayable inputs/results
                    ▼
Evidence intake ──► independent replay ──► Layer 0 admission
                                             │
                                  signer / anchor separated
                                             ▼
GSPC: admitted, task- and axis-specific measurements
                    │
                    ▼
SOV-X: relationships, dependencies, changes, and world events
                    │
                    ▼
Council OS: explainable routing recommendation / human override
                    │
                    └── next run produces new evidence; no automatic score edits
```

Responsibilities:

- **Layer O:** discover, version, attribute, and track changes in capability
  records. Catalog presence never creates a score.
- **Harness X:** run the selected, permissioned adapter in a bounded sandbox;
  capture exact subject, instrument, executor, environment, and result.
- **Layer 0:** enforce policy and admission requirements; reject incomplete,
  conflicting, stale, or non-replayable evidence. Signing/anchoring remains
  separate from execution.
- **GSPC:** store measurements by declared task/axis and subject lineage. It
  must not emit a universal “best model” rank from catalog popularity.
- **SOV-X:** represent source, capability, harness, measurement, dependency,
  and change relationships; it is the evolving world graph, not the admission
  authority.
- **Council OS:** expose source/access/evidence state and the reason a route
  was selected. Keep unmeasured and unavailable options visible.

## How “better to use” is computed

There is no global winner. For a task, filter first by policy and required
interface; then compare eligible harness/capability combinations on the
relevant admitted evidence: task success, failure modes, uncertainty, freshness,
latency, cost, reproducibility, and operational availability. Show the measured
sample and limits. If no comparable evidence exists, return `UNMEASURED` and use
an explicitly labeled fallback or ask the operator; do not infer quality from
stars, downloads, a vendor badge, or directory health checks.

## Initial source waves

1. **Public discovery:** Cisco ARD, official MCP Registry, Hugging Face; add
   GitHub Agent Finder, Smithery, and Glama only after their official read
   interfaces and fixtures are validated.
2. **Public vendor asset/product catalogs:** NVIDIA NGC, Red Hat Ecosystem
   Catalog, Oracle AI Marketplace, CrowdStrike Marketplace. Distinguish models,
   containers, certified products, marketplace listings, and callable
   endpoints; do not imply downloads or invocation are public.
3. **Tenant inventories:** Palantir Foundry, Google Cloud Agent Registry,
   Oracle deployed models/agents, JFrog AI Catalog, and CrowdStrike Falcon
   integrations. Connect only with explicit customer authorization, least
   privilege, and revocable credentials; never attempt global enumeration.
4. **Regulatory sources:** NIST AI RMF resources, OECD AI Policy Observatory,
   EUR-Lex/European Commission material. Store versioned source documents and
   policy records in a regulatory family, separate from executable
   capabilities and GSPC behavior cells.

Each wave is a source-specific connector with rate limits, retention/terms
review, pagination tests, fixture tests, change detection, and deletion or
withdrawal handling. Avoid generic scraping when a supported feed exists.

## Release gates for a real end-to-end claim

1. Canonical record schema and status vocabulary reviewed against the existing
   Layer 0 evidence envelope and SOV-X event contract.
2. Source snapshots fetched with exact bytes, timestamp, URL, and hash; counts
   reconcile to source pagination and are labeled as source-reported or
   observed.
3. Catalog changes create discovery events only; no direct GSPC writes.
4. Each test has explicit scope, permission, pinned subject/instrument, bounded
   resource use, replayable output, and negative controls where relevant.
5. Layer 0 admission rejects quarantined, withdrawn, stale, or unverifiable
   inputs; independent signer and anchor receipts are read back.
6. GSPC and SOV-X read paths are tested end-to-end, then UI shows where each
   field came from and what has not been checked.
7. Public release is separately approved, deployed, and anonymously byte-read
   back. A local test or catalog count is not publication, adoption, or revenue.

## First implementation slice

Wire one source receipt and one candidate from the existing MCP Registry
adapter into the SOV-X event/relationship contract as `DISCOVERED` only. Add a
negative test proving this event cannot create a GSPC cell. Then wire a single
Harness X replay receipt through the existing Layer 0 admission path and verify
the resulting GSPC read. Expand to the other public sources only after this
vertical slice passes. Do not create parallel schemas or a second signer.

## Current verified boundary

- Local catalog-hive intake has 3 snapshot adapters and passing unit tests.
- The source inventory documents public catalogs, tenant-scoped sources, and
  regulatory source families separately.
- Live source fetching, feed scheduling, SOV-X writes, Layer 0 admission,
  GSPC updates, signatures/anchors for new catalog observations, and dashboard
  integration remain unverified/not implemented by this slice.
