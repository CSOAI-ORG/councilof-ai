---
id: 28-charter-of-queen
title: "Charter of the 13 Queens"
sigil: "♕"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "2"
sigil_signature: "ed25519:sigil:88255020b356dc4d22187c7d04833214b86b6ea5f415983fa0f087ee400f5cba"
bft_quorum: "9/13"
---

# ♕ Charter of the 13 Queens

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:88…`*

## Preamble

The 13 queens are the AI personalities of the 13 sovereign nodes. Each queen is SIGIL-signed, publicly auditable, and has a defined scope of authority.

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

## Article 1: Scope and Definitions

This charter governs all aspects of charter of the 13 queens within the MEOK OS substrate. The scope, definitions, and exclusions are enumerated herein. Subject matter: 13 queens, scope of authority, election, recall, succession.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: Architecture and Components

The architecture, components, interfaces, and dependencies are described herein. The substrate implements this charter as a set of capabilities, each SIGIL-signed and publicly auditable.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Operating Procedures

Standard operating procedures, including request handling, error handling, escalation paths, and failure modes. Every procedure is documented, tested, and SIGIL-signed.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Security Posture

Threat model, defenses, incident response, and recovery. The substrate runs daily threat-model exercises and publishes a public threat report.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Compliance and Audit

Mapping to the 12 frameworks, audit schedule, evidence collection, and reporting. The compliance crosswalk is published in the sovereign law corpus.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: Care Floor and Vetoes

The 0.95 care floor applies to all actions. Care Veto is final. Watch Veto is strong but overridable. Sovereign Veto requires arbitration.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: BFT and Quorum

Decisions of material consequence require 9/13 BFT. Routine decisions are delegated to the responsible node. The cascade protocol governs the decision pipeline.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: Public Root and Transparency

All SIGIL-signed events are anchored in the public root. Inclusion proofs are public. The public root is updated every 60 seconds.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 9: Amendment and Deprecation

Amendment requires 9/13 + 7-day public comment. Deprecation is SIGIL-signed. Self-consumption is permitted; destruction requires 9/13 + 1000+ public petition.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 10: Succession and Continuity

The substrate ensures continuity across node failures, key rotations, and migrations. The succession plan is published and tested quarterly.

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
| 01 | n01-council-prime | `ed25519:sigil:5f7018e332…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:758c468979…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:ed8e2732d9…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:26097283ba…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:e73c707ef4…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:302e67646c…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:e78a18379d…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:fa419b3cb1…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:bed09a1103…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:88255020b356dc4d22187c7d04833214b86b6ea5f415983fa0f087ee400f5cba`

## Defensive FAQ

**Q1. What is the relationship to other charters?**

Charter of the 13 Queens inherits from Tier 1 charters and is inherited by Tier 3 verticals. It is bounded by the Maternal Covenant and the SIGIL chain.

**Q2. Who can amend this charter?**

Amendment requires 9/13 BFT + 7-day public comment + Maternal concurrence. No node can unilaterally amend.

**Q3. What happens if a violation is detected?**

The substrate issues a SIGIL alert, isolates the affected components, and triggers the incident response procedure. The Public Watchdog is notified within 60 seconds.

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

