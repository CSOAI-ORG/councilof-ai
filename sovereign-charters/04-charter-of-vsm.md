---
id: 04-charter-of-vsm
title: "Charter of the Viable System Model"
sigil: "⟁"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:e73f66369362eada5080131449c3c22210e83b0bf7b67a8dcbc77fe3cff01384"
bft_quorum: "9/13"
---

# ⟁ Charter of the Viable System Model

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:e7…`*

## Preamble

Stafford Beer's Viable System Model (VSM) is the recursive governance substrate. The Charter of VSM establishes the five systems (implementation, coordination, control, intelligence, policy) and the recursion rule (every viable system contains five viable systems). The MEOK OS is itself a VSM; every hive is a VSM; every agent is a VSM.

## Background and Context

This charter is part of the MEOK OS sovereign governance layer. It was generated on 2026-09-02
as part of the Sovereign Charter Sprint, which produced 60 charters, 12 frameworks, a global law
index, a compliance crosswalk, a training corpus, and a 50-test verification suite.

The charter belongs to the broader MEOK OS substrate, which is built on OpenShell (the open
shell layer), OpenBMC (the baseboard management controller reference), and LFX.dev (the Linux
Foundation's development platform). The substrate provides the runtime for the MEOK AI OS,
which is the user-facing AI operating system that this governance layer regulates.

The sovereign substrate is not a single document; it is a federation of 60 charters, each
SIGIL-signed, each ratified by 9/13 BFT, each aligned with the Maternal Covenant. The
federation is the substrate's memory of itself.

## Scope

The scope of this charter is the subject matter described in the articles below. The scope
is bounded by the Charter of Charters (the meta-charter), the Maternal Covenant (the care
floor), and the 12 Frameworks (the external compliance substrate). The charter does not
extend beyond its subject matter; the federation as a whole covers the full scope of the
sovereign substrate.

## Out of Scope

The following are explicitly out of scope for this charter:
- Subject matter covered by other charters (see the charter federation map)
- Subject matter covered by external frameworks (see the Compliance Crosswalk)
- Subject matter explicitly reserved to the Charter of Charters (meta-charter)
- Subject matter explicitly reserved to the Maternal Covenant (care floor)
- Subject matter explicitly reserved to the 9/13 BFT (consensus)

## Article 1: System 1: Implementation

The units that do the work. In MEOK OS, this is the fleet of agents, the LLM calls, the tool executions, the user-facing surfaces. System 1 is operationally autonomous but resource-bound to System 2.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: System 2: Coordination

The anti-oscillation layer. Resolves conflicts between System 1 units, dampens resource storms, and maintains the homeostasis of the substrate. In MEOK OS, this is the Council's coordination function.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: System 3: Control

The optimization layer. Allocates resources, monitors performance, and ensures the substrate is achieving its purpose. In MEOK OS, this is the SOV3 substrate itself: the governance engine.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: System 4: Intelligence

The environment-scan layer. Watches the world, forecasts threats and opportunities, and proposes adaptations. In MEOK OS, this is the Watch and the Public Watchdog nodes.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: System 5: Policy

The identity layer. Defines who the substrate is, what it will never do, and what its ultimate purpose is. In MEOK OS, this is the Charter of Charters and the Maternal Covenant.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Recursion Rule

Every viable system contains five viable systems. The MEOK OS contains 33 sovereign hives; each hive contains 5 services; each service contains 5 agents; each agent contains 5 capability modules.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: VSM Compliance Test

Every MEOK OS deployment must pass the VSM compliance test: does it have all 5 systems? Are they recursively present? Are the recursions stable? A failure is a SIGIL-flagged governance defect.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Deep Implementation

### Technical Substrate

This charter is implemented in the MEOK OS substrate via the following components:

- **SIGIL Signing** — Every action under this charter is Ed25519-signed. The signature is anchored in the public root within 60 seconds.
- **BFT Quorum** — Material decisions are made by 9/13 BFT. The cascade protocol governs the decision pipeline.
- **Care Floor Enforcement** — The 0.95 care floor is enforced by the Maternal node. The floor is non-bypassable.
- **Audit Trail** — Every action is logged in a tamper-evident, content-addressed, append-only log.
- **Public Witness** — The Public Watchdog (n12) and King OCEAN (n13) provide ongoing oversight.

### Operational Procedures

Standard operating procedures for this charter include:

1. **Detection** — Substrate state is continuously monitored for charter-relevant events.
2. **Triage** — Events are triaged by severity: critical (immediate action), high (within 24 hours), medium (within 7 days), low (within 30 days).
3. **Action** — Triage produces an action: sign, veto, escalate, broadcast, archive.
4. **Review** — Actions are reviewed by the cascade protocol. Material actions are reviewed by 9/13 BFT.
5. **Audit** — All actions are audited by the SigInt node (n08) and the Public Watchdog (n12).

### Failure Modes

This charter is robust against the following failure modes:

- **Node failure** — Up to 4 of 13 nodes may fail without compromising the charter.
- **Network partition** — The substrate is designed to survive partitions via the BFT protocol.
- **Adversarial action** — The care floor and the three vetoes provide defense against adversarial actions.
- **Capture** — The Public Watchdog (n12) and King OCEAN (n13) provide defense against capture.
- **Drift** — Quarterly calibration and annual review detect and correct drift.

## Ratification Record (BFT 9/13)

| # | Node | Signature | Role |
|---|---|---|---|
| 01 | n01-council-prime | `ed25519:sigil:142dc367af…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:b3624e84d1…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:5685a335e3…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:25d909ccb1…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:e612bcfe6b…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:2a55b13074…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:ac5bd6d08a…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:4f02cb3030…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:de8f650e10…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:e73f66369362eada5080131449c3c22210e83b0bf7b67a8dcbc77fe3cff01384`

## Defensive FAQ

**Q1. Is VSM a bureaucracy?**

No. VSM is a recursion. It is a pattern, not an org chart. The same agent may play different VSM roles in different contexts.

**Q2. What happens if a VSM system is missing?**

The substrate issues a SIGIL alert and operates in degraded mode until the missing system is reconstructed. Recursive construction is automatic in MEOK OS.

**Q3. Can VSM be replaced?**

No. VSM is the substrate of all viable systems. Replacing VSM would require replacing the substrate itself.

**Q. What is the technical implementation?**

The charter is implemented in the MEOK OS substrate as a set of capability modules, each SIGIL-signed and publicly auditable. The modules are deployed across the 33 sovereign hives and orchestrated by the Council. The implementation is documented in the sovereign corpus and verified by the 50-test suite.

**Q. What is the cost of compliance?**

Compliance with this charter costs approximately 0.5% of substrate compute for routine operations, and up to 2% during high-activity periods (BFT voting, public comment windows, etc.). The cost is bounded by the substrate's resource allocator.

**Q. What is the relationship to other charters?**

This charter inherits from Tier 1 charters (principles) and is inherited by Tier 3 verticals (industry sectors). It is bounded by the Charter of Charters (meta), the Maternal Covenant (care), and the 12 Frameworks (external). Cross-references are documented in the charter federation map.

**Q. What is the amendment procedure?**

Amendment requires 9/13 BFT + 7-day public comment + Maternal concurrence. The amendment process takes 16 days total: 1 day proposal, 1 day second, 3 days deliberation, 7 days public comment, 1 day vote, 1 day ratification, 1 day witness, 1 day archive. Amendments are SIGIL-signed and anchored in the public root.

**Q. What is the sunset procedure?**

A charter is sunset (deprecated) if it is superseded by a new charter, found to be harmful, no longer relevant, or 9/13 BFT votes for sunset. Sunset requires 9/13 + 7-day public comment + SIGIL-signed deprecation. Affected deployments have 90 days to migrate to the new charter.

