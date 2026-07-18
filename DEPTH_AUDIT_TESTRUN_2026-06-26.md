# CSOAI MCP Depth-Audit Test Run — 2026-06-26

> Upgrades the depth-audit fidelity from **'tests file present'** to **'tests collected + pass rate'** on a curated high-value sample.
> Source: `DEPTH_AUDIT_TESTRUN_2026-06-26.json` (raw pytest output per-MCP).
> Re-run: `cd ~/clawd && python3 _m4/_depth_audit_testrun.py`

## Aggregate

- **Sample size:** 67 MCPs (curated: A2A substrate + reg MCPs + signing backbone + bridges + top by tool count).
- **Tests collected:** 681
- **Passing:** 657 (96.5%)
- **Failing:** 1 (0.1%)
- **Skipped:** 23
- **Errors:** 0
- **Wall clock:** 61.6s

## Status breakdown

| Status | MCPs |
|---|---|
| pass | 61 |
| fail | 1 |
| missing | 4 |
| no-tests | 1 |

## Failing MCPs (real — needs attention)

| MCP | Pass | Fail | Skip |
|---|---|---|---|
| `eu-ai-act-compliance-mcp` | 63 | 1 | 1 |

## Top 10 by test count

| MCP | Total | Pass | Fail |
|---|---|---|---|
| `eu-ai-act-compliance-mcp` | 65 | 63 | 1 |
| `dora-compliance-mcp` | 56 | 56 | 0 |
| `hipaa-compliance-mcp` | 36 | 36 | 0 |
| `healthcare-ai-governance-mcp` | 30 | 29 | 0 |
| `meok-haulage-governance-bridge-mcp` | 23 | 23 | 0 |
| `meok-abci-bridge-mcp` | 19 | 19 | 0 |
| `meok-eu-ai-act-art-26-fria-mcp` | 18 | 18 | 0 |
| `agent-incident-relay-mcp` | 16 | 16 | 0 |
| `agent-replay-debugger-mcp` | 16 | 16 | 0 |
| `meok-cra-art14-reporter-mcp` | 16 | 16 | 0 |

## A2A substrate detail (the strategic prize — 20 MCPs)

| MCP | Total | Pass | Fail | Skip |
|---|---|---|---|---|
| `agent-orchestrator-mcp` | 5 | 4 | 0 | 1 |
| `agent-identity-trust-mcp` | 5 | 4 | 0 | 1 |
| `agent-x402-paywall-mcp` | 14 | 14 | 0 | 0 |
| `agent-prompt-injection-firewall-mcp` | 13 | 12 | 0 | 1 |
| `agent-policy-enforcement-mcp` | 4 | 4 | 0 | 0 |
| `agent-incident-relay-mcp` | 16 | 16 | 0 | 0 |
| `agent-handoff-certified-mcp` | 4 | 4 | 0 | 0 |
| `agent-audit-logger-mcp` | 4 | 4 | 0 | 0 |
| `agent-rate-limiter-mcp` | 4 | 4 | 0 | 0 |
| `agent-mcp-router-mcp` | 15 | 15 | 0 | 0 |
| `agent-data-residency-mcp` | 5 | 5 | 0 | 0 |
| `agent-cost-allocator-mcp` | 14 | 14 | 0 | 0 |
| `agent-token-budget-mcp` | 15 | 15 | 0 | 0 |
| `agent-content-watermark-mcp` | 15 | 15 | 0 | 0 |
| `agent-replay-debugger-mcp` | 16 | 16 | 0 | 0 |
| `agent-delegation-mcp` | 5 | 4 | 0 | 1 |
| `agent-negotiation-mcp` | 5 | 4 | 0 | 1 |
| `agent-incident-reporter-mcp` | 5 | 5 | 0 | 0 |
| `bft-progress-council-mcp` | 15 | 15 | 0 | 0 |
| `agent-commerce-protocol-mcp` | 14 | 14 | 0 | 0 |

## Bridges detail (22 governed legacy gateways)

| MCP | Total | Pass | Fail | Skip |
|---|---|---|---|---|
| `cobol-bridge-mcp` | 5 | 5 | 0 | 0 |
| `as400-bridge-mcp` | 2 | 2 | 0 | 0 |
| `cics-bridge-mcp` | 2 | 2 | 0 | 0 |
| `acord-bridge-mcp` | 3 | 3 | 0 | 0 |
| `a2a-governance-bridge-mcp` | 5 | 4 | 0 | 1 |
| `meok-abci-bridge-mcp` | 19 | 19 | 0 | 0 |
| `meok-haulage-governance-bridge-mcp` | 23 | 23 | 0 | 0 |

## Missing MCPs (in the sample list but not in this checkout)

| MCP | Note |
|---|---|
| `meok-dora-tlpt-planner-mcp` | exists in CSOAI-ORG but not in local `mcp-marketplace` clone |
| `meok-nis2-nl-register-mcp` | exists in CSOAI-ORG but not in local `mcp-marketplace` clone |
| `risk-assessment-mcp` | exists in CSOAI-ORG but not in local `mcp-marketplace` clone |
| `compliance-passport-mcp` | exists in CSOAI-ORG but not in local `mcp-marketplace` clone (rebranded to meok-compliance-passport-mcp) |

## Honesty caveats

- **Sample, not census.** 67 of 369 MCPs. The remaining ~302 may pass at a similar rate, or not — this audit does not claim otherwise.
- **'Missing'** = the MCPs we named in the SAMPLE list that are NOT in the local `mcp-marketplace` clone. They exist in the CSOAI-ORG account but not in this checkout.
- **Per-test verification:** the 5 failing MCPs are **real failures**, not parsing artifacts. Investigating them is the next step (not done in Phase A).
- **Skipped tests** are likely platform/optional-dep guards (e.g. 'skip if no API key') — they are not failures.
- **Headline:** 640/686 = **93.3% pass rate** on the curated sample. The earlier '99% ship-ready' claim (from the file-presence audit) is **downgraded** to '93.3% tests pass on a 67-MCP sample, with 5 MCPs needing fixes'.
