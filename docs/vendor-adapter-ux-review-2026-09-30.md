# Vendor adapter UX review — 2026-09-30

Status: **design evidence and implementation guidance**. No vendor tenant was changed and no live vendor integration is claimed.

## What the products teach us

### CrowdStrike Falcon

The API-client console makes the integration lifecycle legible: a focused client inventory, a separate action-log view, and one clear create action. Each client has explicit API scopes. CrowdStrike's developer guidance says to request only the scopes needed; users see those scopes during installation and can judge read versus write access.

**GSPC application:** one provider record per connection, with owner, environment, region, requested scopes, last test, status, and action history. Put a read-only scope preset first. Make secrets one-time entry fields that are never echoed back. A connection is not “healthy” until a dated probe succeeds; a saved config is only “configured.”

### Red Hat OpenShift AI

OpenShift AI organizes model work inside named projects. Connections, workbenches, models, and pipelines live under the project, so users can see which environment and collaborators own each resource. The connection flow records reusable endpoint/storage settings rather than asking users to paste them repeatedly.

**GSPC application:** scope connectors and runs to a workspace/project; reuse a named connection; show which evidence, models, and pipeline outputs it can access. Preserve owner, access boundary, and source lineage on the job record.

### Palantir Foundry / AIP

Palantir's public docs describe using the current user's identity and permissions, recording actions in the platform audit log, and requiring confirmation for sensitive mutations. Data connections have separately managed permissions for agents, sources, and syncs.

**GSPC application:** execute under the user's granted scope; show the permission being exercised; require an explicit approval for writes/publishing; emit a receipt with actor, tool, scope, target, result, and evidence references. A model's authority must never exceed the human or service identity.

### NVIDIA NeMo / NIM

NVIDIA's NeMo evaluation workflow treats policies, interaction fixtures, compliance results, resource use, and latency as one evaluation record. NIM exposes metrics and structured logs so operators can compare behavior and resource cost in their existing observability stack.

**GSPC application:** evaluate a route or harness against frozen fixtures and negative controls; report quality/safety, latency, cost, and failure states together. Do not promote a route from a single successful smoke test.

### Cisco Outshift catalog

Treat a large agent catalog as a discovery index, not as a trust or quality verdict. Imported entries need canonical source URL, observed timestamp, identifier/version, declared protocols, license, and retrieval digest. Changes become candidates for review and measurement rather than silently replacing existing records.

## One GSPC job flow for humans and agents

1. **Choose a task** from a small user-facing set; ask only for missing inputs.
2. **Resolve capability** from the provider/capability catalog; show why a route was selected, the available alternatives, and expected cost/latency where known.
3. **Check access** against the user's identity, workspace, resource, requested scopes, and action type. Default to read-only.
4. **Require approval** before a write, external publication, spend, or tenant mutation. Keep read-only observation separately available.
5. **Run once through the shared job record** from the human UI, MCP, A2A, or UI-generation adapter. Store input digest, route, tool versions, permission decision, outputs, measurements, and errors.
6. **Review and correct**: show evidence, limits, stale dependencies, controls, and correction history before a human accepts or republishes anything.
7. **Close the loop**: update the capability's dated observation only through the evidence/admission path. Re-check changed dependencies on the existing scheduler; do not create parallel registries or schedulers.

## First implementation slice

Improve the existing GSPC Connect/Connections surface with an adapter lifecycle panel:

- `Not configured` → `Configured, not tested` → `Probe passed/failed` → `Measurement available` → `Approval required` → `Published/withdrawn`.
- List scopes and data boundaries before connection; put read-only first.
- Separate **Connection details**, **Test history**, and **Actions** in tabs or subnavigation.
- One safe “Test connection” action; never combine it with “Create credential” or “Publish.”
- Every action links to the resulting job/evidence receipt; errors include a recovery step and preserve the last known-good config.
- Reuse the existing shared job record and evidence schema. Do not add a parallel scheduler, registry, score, or generic new tool surface.

Adapter order: (1) local/mock and OpenShift-compatible test profile, (2) CrowdStrike sandbox or customer-authorized tenant with read-only scopes, (3) NVIDIA NIM/NeMo evaluation profile, (4) Palantir sandbox with scoped OAuth, (5) Cisco catalog ingestion as versioned discovery data. Red Hat, CrowdStrike, NVIDIA, Palantir, and Cisco remain separate providers behind one adapter contract.

## Boundaries

- Public documentation and catalogs may be observed and cited; tenant configuration, credential creation, data export, API writes, or deployment require the relevant account owner's authorization.
- A listing is not integration; a saved connection is not a passing probe; an HTTP response is not measurement; a measurement is not certification or endorsement.
- Do not describe any vendor as adopting, endorsing, or requiring GSPC without direct evidence.
- This note is not a claim that the listed adapters are implemented. Current branch changes are limited to correcting stale tool-count language on the GSPC connection page.

## Official references

- CrowdStrike API scopes: https://developer.crowdstrike.com/foundry/authorization/api-scopes/
- CrowdStrike API reference: https://developer.crowdstrike.com/api-reference/overview/
- Red Hat OpenShift AI projects and workflow: https://docs.redhat.com/en/documentation/red_hat_openshift_ai_self-managed/2.16/html-single/getting_started_with_red_hat_openshift_ai_self-managed
- Red Hat connections: https://docs.redhat.com/en/documentation/red_hat_openshift_ai_self-managed/2.16/pdf/working_on_data_science_projects/Red_Hat_OpenShift_AI_Self-Managed-2.16-Working_on_data_science_projects-en-US.pdf
- Palantir AI FDE permissions and approvals: https://www.palantir.com/docs/foundry/ai-fde/security-and-governance
- Palantir AIP architecture and evaluation: https://www.palantir.com/docs/foundry/architecture-center/aip-architecture
- NVIDIA NeMo policy evaluation: https://docs.nvidia.com/nemo/guardrails/evaluation/evaluate-configuration
- NVIDIA NIM observability: https://docs.nvidia.com/nim/large-language-models/latest/nim-per-request-metrics.html
