---
id: 60-charter-of-aviation-ai
title: "Charter of Aviation AI"
sigil: "✈"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "3"
sigil_signature: "ed25519:sigil:989b8e06c1d341c5245e11ae408b7f3ce1fdd653028d4a45603bfbe5d09c125a"
bft_quorum: "9/13"
---

# ✈ Charter of Aviation AI

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:98…`*

## Preamble

Aviation AI operates in the domain of flight safety. The Aviation charter requires DO-178C compliance, EASA / FAA certification, fail-safe defaults, and EXPLICIT human-pilot override on all control-affecting actions. The care floor is 0.99.

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

## Article 1: Scope and Vertical Definition

This charter governs all aspects of charter of aviation ai within the MEOK OS substrate. DO-178C, EASA, FAA, fail-safe, human-pilot, 0.99 care floor.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: Risk Classification and Tier

The vertical is classified per the EU AI Act risk tier and the substrate's care floor. Higher risk requires higher care floor and stronger controls.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Care Floor and Dual-Key

The 0.95 care floor is the minimum; verticals may require a higher floor. Dual-key authorization is required for actions affecting vulnerable subjects.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Regulatory Mapping

Mapping to the relevant external frameworks (EU AI Act, sectoral regulators, jurisdictional laws). The compliance crosswalk is the authoritative mapping.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Data Governance

Data classification, retention, deletion, subject rights, and cross-border transfer. The sovereign database applies content-addressed, append-only semantics.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: Operational Procedures

Standard operating procedures, including escalation, rollback, incident response, and continuity. The cascade protocol governs the decision pipeline.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: Security and Resilience

Threat model, defenses, incident response, recovery, and business continuity. The substrate is certified to ISO 27001 and SOC 2 Type II.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: Transparency and Reporting

Transparency reports are published quarterly, including vetoes, incidents, audit findings, and lessons learned. Reports are SIGIL-signed.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 9: Care Floor Enforcement

The 0.95 care floor is enforced by the Maternal node. The vertical's care index is calibrated quarterly against a panel of human reviewers.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 10: Amendment and Sunset

Amendment requires 9/13 BFT + 7-day public comment + vertical sectoral regulator consultation. The vertical is reviewed annually and may be deprecated.

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
| 01 | n01-council-prime | `ed25519:sigil:0381a7fe8a…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:3df8fba3f1…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:cbc53b22ba…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:05dbef5333…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:df218ba619…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:12c6357e4a…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:0498611899…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:c3a0069d5c…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:c2792d5b5b…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:989b8e06c1d341c5245e11ae408b7f3ce1fdd653028d4a45603bfbe5d09c125a`

## Defensive FAQ

**Q1. What is the applicable care floor?**

The standard care floor is 0.95. Charter of Aviation AI may require a higher floor (e.g., 0.97 for Healthcare, 0.99 for Aviation). The floor is enforced by the Maternal node.

**Q2. Who regulates this vertical?**

Charter of Aviation AI is regulated by the sectoral regulators of each jurisdiction in which it operates. The compliance crosswalk maps the vertical's obligations to the 12 frameworks.

**Q3. What is the audit schedule?**

Charter of Aviation AI is audited annually by an independent third party. The audit report is published. The substrate runs a self-audit quarterly.

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

