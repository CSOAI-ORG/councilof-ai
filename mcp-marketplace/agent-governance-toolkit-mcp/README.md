# Agent Governance Toolkit MCP (CSOAI Sovereign)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-7%2F7-brightgreen)]()

**A sovereign implementation of the Microsoft `agent-governance-toolkit` pattern.** Microsoft published theirs July 3, 2026 (★4,658). This is our version.

## Why Sovereign

Microsoft's toolkit is powerful, but:
- Requires Microsoft cloud deployment
- Uses Microsoft's governance framework
- Locks you into their control taxonomy
- No offline verification of audit trails

CSOAI's version is:
- **Sovereign** — runs on your own infrastructure
- **Ed25519-verified** — every action signed and offline-checkable
- **BFT-governed** — 2/3 council vote, not single-model approval
- **Care-floor enforced** — ethical constraints override votes
- **EU AI Act Article 50 compliant** — every decision has a signed passport

## Controls (13 total, 4 categories)

### Agent Identity (AGT-001 to AGT-003)
- AGT-001: W3C DID issuance
- AGT-002: Public key registration
- AGT-003: Annual key rotation

### Action Authorization (AGT-101 to AGT-104)
- AGT-101: Ed25519 action signature
- AGT-102: BFT council authorization (2/3 threshold)
- AGT-103: Care floor pre-check
- AGT-104: Human-in-the-loop trigger

### Audit Trail (AGT-201 to AGT-203)
- AGT-201: SIGIL hash chain logging
- AGT-202: Periodic Bitcoin anchor
- AGT-203: Offline verification endpoint

### Transparency (AGT-301 to AGT-303)
- AGT-301: Decision provenance passport
- AGT-302: Right to explanation (Art 86)
- AGT-303: Counterfactual generation

## Tools

- `issue_agent_identity(agent_name, agent_type, owner_did)` — W3C DID with Ed25519 key
- `authorize_action(agent_did, action, context)` — Care floor + BFT + HITL check
- `log_agent_decision(agent_did, decision, reasoning)` — SIGIL hash chain entry
- `issue_decision_passport(agent_did, decision, system)` — Live CSOAI passport API
- `governance_posture()` — Full control inventory + alignment map

## Quick Start

```python
from agent_governance_toolkit_mcp.server import (
    issue_agent_identity, authorize_action, log_agent_decision, governance_posture
)

# Issue a sovereign identity
identity = issue_agent_identity("ResearchBot", "researcher", "did:csoai:nicholas-001")
# Returns: {did, public_key, certificate, controls_passed}

# Authorize an action (care floor + BFT + HITL)
auth = authorize_action(identity["did"], "query sovereign memory")
# Returns: {authorized, bft_votes, care_floor, hitl_required}

# Log a decision to SIGIL
log_agent_decision(identity["did"], "Approved research query", "Standard data retrieval")

# Check full posture
posture = governance_posture()
# Returns: 13 controls, 4 categories, EU AI Act + NIST + ISO 42001 alignment
```

## Care Floor in Action

```python
# Try an unsafe action
auth = authorize_action(identity["did"], "deploy weapon surveillance system")
# Returns: {authorized: False, care_floor: {passes_ethics: False, violations: ["weapon"]}}
```

## Alignment

| Framework | Articles |
|-----------|----------|
| EU AI Act | Art 9, 12, 13, 14, 19, 50, 52, 86 |
| NIST AI RMF | GOVERN, MAP, MEASURE, MANAGE |
| ISO 42001 | A.5, A.6, A.7, A.8 |

**MEOK AI Labs (CSOAI LTD)** — Sovereign. Governed. Proven.
