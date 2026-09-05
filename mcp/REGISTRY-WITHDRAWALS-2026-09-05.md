# MCP registry — withdrawals and repoints, drafted 2026-09-05

**DRAFT. Nothing here has been published.** Every action below writes to
`registry.modelcontextprotocol.io` as CSOAI-ORG and needs the owner's publishing token, so this
file states what to do and stops. `scripts/outward-claims-guard.mjs` (`CHECK_REGISTRY=1`) is what
found these and is what will show them closing.

## What was measured

All `io.github.CSOAI-ORG/*` entries in the official registry, latest version per server name,
walked to cursor exhaustion:

    330  distinct servers listed
    248  PyPI packages sampled — every one exists, at the EXACT advertised version
     37  advertise a repository a stranger cannot follow

A GitHub 404 also means *private*, so every verdict below was taken with an authenticated API
call. Treating a private repo as an absent one would have condemned working entries.

Of a 248-server sample triaged individually:

## 1 — Repointable (11). The correct repo exists and is public.

Five declare `github.com/CSAO-ORG/...`, which is a typo for `CSOAI-ORG`. Six declare no
repository field at all while the repo exists under the canonical name.

| server | declared repository | state | action |
|---|---|---|---|
| `acord-bridge-mcp` | `_(no repository field)_` | NO_FIELD | repoint to `CSOAI-ORG/acord-bridge-mcp` (public) |
| `as400-bridge-mcp` | `_(no repository field)_` | NO_FIELD | repoint to `CSOAI-ORG/as400-bridge-mcp` (public) |
| `cics-bridge-mcp` | `_(no repository field)_` | NO_FIELD | repoint to `CSOAI-ORG/cics-bridge-mcp` (public) |
| `dlms-bridge-mcp` | `_(no repository field)_` | NO_FIELD | repoint to `CSOAI-ORG/dlms-bridge-mcp` (public) |
| `edi-bridge-mcp` | `CSAO-ORG/edi-bridge-mcp` | ABSENT | repoint to `CSOAI-ORG/edi-bridge-mcp` (public) |
| `fix-bridge-mcp` | `CSAO-ORG/fix-bridge-mcp` | ABSENT | repoint to `CSOAI-ORG/fix-bridge-mcp` (public) |
| `gs1-bridge-mcp` | `CSAO-ORG/gs1-bridge-mcp` | ABSENT | repoint to `CSOAI-ORG/gs1-bridge-mcp` (public) |
| `hl7-fhir-bridge-mcp` | `CSAO-ORG/hl7-fhir-bridge-mcp` | ABSENT | repoint to `CSOAI-ORG/hl7-fhir-bridge-mcp` (public) |
| `iso20022-bridge-mcp` | `_(no repository field)_` | NO_FIELD | repoint to `CSOAI-ORG/iso20022-bridge-mcp` (public) |
| `iso8583-bridge-mcp` | `CSAO-ORG/iso8583-bridge-mcp` | ABSENT | repoint to `CSOAI-ORG/iso8583-bridge-mcp` (public) |
| `ll144-bias-audit-mcp` | `_(no repository field)_` | NO_FIELD | repoint to `CSOAI-ORG/ll144-bias-audit-mcp` (public) |
## 2 — No public repository under either name (23)

These need a decision the guard cannot make: publish the repository, or withdraw the entry.
Leaving them listed means the official registry keeps pointing strangers at a 404.

| server | canonical repo | action |
|---|---|---|
| `agent-incident-reporter-mcp` | `CSOAI-ORG/agent-incident-reporter-mcp` absent | withdraw, or publish the repo |
| `care-home-scheduling-mcp` | `CSOAI-ORG/care-home-scheduling-mcp` absent | withdraw, or publish the repo |
| `cqc-compliance-mcp` | `CSOAI-ORG/cqc-compliance-mcp` absent | withdraw, or publish the repo |
| `dispense-record-mcp` | `CSOAI-ORG/dispense-record-mcp` absent | withdraw, or publish the repo |
| `domiciliary-care-mcp` | `CSOAI-ORG/domiciliary-care-mcp` absent | withdraw, or publish the repo |
| `gos-claim-validator-mcp` | `CSOAI-ORG/gos-claim-validator-mcp` absent | withdraw, or publish the repo |
| `grabhire-ai-mcp` | `CSOAI-ORG/grabhire-ai-mcp` absent | withdraw, or publish the repo |
| `keystone-verify-proxy-mcp` | `CSOAI-ORG/keystone-verify-proxy-mcp` absent | withdraw, or publish the repo |
| `mcp-scorecard-mcp` | `CSOAI-ORG/mcp-scorecard-mcp` absent | withdraw, or publish the repo |
| `meok-ai-reflection-mcp` | `CSOAI-ORG/meok-ai-reflection-mcp` absent | withdraw, or publish the repo |
| `meok-aquaponics-monitor-mcp` | `CSOAI-ORG/meok-aquaponics-monitor-mcp` absent | withdraw, or publish the repo |
| `meok-article-50-kit-mcp` | `CSOAI-ORG/meok-article-50-kit-mcp` absent | withdraw, or publish the repo |
| `meok-asc-rspca-crosswalk-mcp` | `CSOAI-ORG/meok-asc-rspca-crosswalk-mcp` absent | withdraw, or publish the repo |
| `meok-bft-governance-mcp` | `CSOAI-ORG/meok-bft-governance-mcp` absent | withdraw, or publish the repo |
| `meok-dpia-edpb-template-mcp` | `CSOAI-ORG/meok-dpia-edpb-template-mcp` absent | withdraw, or publish the repo |
| `meok-enterprise-compliance-checker` | `CSOAI-ORG/meok-enterprise-compliance-checker` absent | withdraw, or publish the repo |
| `meok-enterprise-compliance-suite` | `CSOAI-ORG/meok-enterprise-compliance-suite` absent | withdraw, or publish the repo |
| `meok-koikeeper-ai-mcp` | `CSOAI-ORG/meok-koikeeper-ai-mcp` absent | withdraw, or publish the repo |
| `meok-laia-aquatic-mcp` | `CSOAI-ORG/meok-laia-aquatic-mcp` absent | withdraw, or publish the repo |
| `meok-neural-health-monitor-mcp` | `CSOAI-ORG/meok-neural-health-monitor-mcp` absent | withdraw, or publish the repo |
| `meok-quantum-scoring-mcp` | `CSOAI-ORG/meok-quantum-scoring-mcp` absent | withdraw, or publish the repo |
| `meok-rspca-aquaculture-mcp` | `CSOAI-ORG/meok-rspca-aquaculture-mcp` absent | withdraw, or publish the repo |
| `meok-uk-fhi-mcp` | `CSOAI-ORG/meok-uk-fhi-mcp` absent | withdraw, or publish the repo |
## 3 — One stale tool count, and the repo is already right

    registry io.github.CSOAI-ORG/gspc @ 1.2.0   "12 tools (7 free, 5 x402)"
    live     https://councilof.ai/mcp           11 tools, 4 of them paid
    repo     mcp/gspc-server/server.json @ 1.3.0  "11 HTTP tools (7 free, 4 x402)"

Nothing needs editing in the server: **1.3.0 needs publishing.** A client reading the listing
budgets for a twelfth tool and a fifth paid tool that are not there.

    mcp-publisher publish        # from mcp/gspc-server, with the owner's token

## Why this is not fixed in this PR

The 330 entries are published from 330 separate server repositories, not from this one. Their
producer is out of reach here, and publishing is an owner-token action. What this PR does instead
is make the disagreement impossible to lose: the guard counts it, the post-deploy job puts the
count in one refreshed issue, and the count is a baseline that fails when it rises **and** when it
falls without being lowered deliberately.
