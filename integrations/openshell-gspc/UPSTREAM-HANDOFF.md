# NVIDIA OpenShell upstream handoff

## Candidate

The package is a least-privilege policy/example for the public Council of AI GSPC MCP endpoint.

Observed public surface on 27 September 2026:
- 16 advertised tools;
- 12 marked read-only;
- 4 x402/paid tools marked non-read-only;
- the package policy allows only those 12 read-only tools and explicitly denies the 4 paid tools.

On 28 September a new anonymous `tools/list` readback found 13 tools: nine read-only and four paid. `measurement_index`, `verify_capsule`, and `server_evidence` were no longer advertised. The current candidate policy allows nine and denies four; both live probes pass. The 27 September gateway-load result below applies to the earlier 12-tool policy, not this revised policy.

## Local acceptance

Completed:
- package YAML/toolset validation: PASS;
- live tools/list drift check: PASS;
- live free board_totals call: PASS;
- no paid tool invoked by the probe;
- current official OpenShell v0.1.1 CLI, gateway and VM-driver asset digests matched the upstream release;
- current v0.1.1 gateway loaded the unmodified GSPC policy successfully, effective policy hash e0c47a8447c9ebbbe28f8435b266984d682e5e378c4a798edea0369708b76526.

Still required before claiming runtime compatibility:
- a v0.1.1 sandbox workload run proving an allowed read-only call succeeds and a paid call is blocked by OpenShell;
- upstream maintainer review/acceptance.

The current gateway-policy qualification is documented in RUNTIME-QUALIFICATION.md.

## First-time contributor gate

OpenShell requires a first-time contributor to open a Vouch Request discussion. Their contribution instructions say the vouch request must be written in the contributor's own words and that AI-generated vouch requests will be denied.

This repository therefore intentionally contains no paste-ready vouch request.

Human notes for Nicholas:
- explain that the proposed example is a narrowly scoped public read-only MCP measurement endpoint;
- explain that the useful OpenShell feature is MCP-aware tool-name allow/deny;
- state that no credential provider is needed;
- state that policy schema/load has been tested on v0.1.1, while full sandbox enforcement remains to be exercised;
- ask maintainers whether the contribution belongs as an example, skill, or external integration document.

## Proposed technical acceptance after vouch

1. OpenShell permits initialize, tools/list, ping and the named read-only tools.
2. The four paid tools are denied.
3. No credential provider is required.
4. Default-deny applies to all other network destinations.
5. A current sandbox smoke test demonstrates the positive and negative paths.
6. Documentation says measurement is not certification and does not imply NVIDIA endorsement.
