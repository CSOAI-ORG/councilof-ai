---
id: 05-charter-of-ostrom
title: "Charter of Ostrom (8 Commons Principles)"
sigil: "✣"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:7de4deb557682c9cba9bdff2072eca5a8d97acda1b3abade9b8aa00970eaa6cb"
bft_quorum: "9/13"
---

# ✣ Charter of Ostrom (8 Commons Principles)

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:7d…`*

## Preamble

Elinor Ostrom's 8 principles for governing the commons, extended to the AI substrate. The Charter of Ostrom establishes the boundaries of the AI commons, the rules of participation, and the sanctions for violation. The AI commons is not free; it is governed.

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

## Article 1: Principle 1: Clear Boundaries

The AI commons has defined boundaries: who is in, who is out, what is shared, what is private. The SIGIL signature marks the boundary. Crossing the boundary without authorization is a violation.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: Principle 2: Local Appropriation

Benefits of the commons flow to those who contribute to it. Free-riding is detected by the substrate and sanctioned by graduated restrictions on commons access.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Principle 3: Collective Choice

Those affected by the rules participate in making them. The Public Watchdog (n12) ensures that public petitions reach the Council. A petition with 1000+ signatures forces a Council vote.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Principle 4: Monitoring

Monitors of the commons are accountable to the commons. The Watch (n07) and SigInt (n08) nodes are monitored by the Public Watchdog. Monitors who abuse their role are recalled by 9/13.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Principle 5: Graduated Sanctions

Violations of the commons are sanctioned in proportion to their severity. A first violation is a warning; a second is a 7-day suspension; a third is a 30-day suspension; a fourth is permanent removal.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: Principle 6: Conflict Resolution

Conflicts within the commons are resolved by cheap, fast, local mechanisms. The MEOK OS conflict layer resolves 95% of conflicts in <1 second without involving the full Council.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: Principle 7: Right to Organize

Subjects of the commons have the right to organize their own governance within the bounds of the substrate. Self-organizing hives are explicitly permitted and encouraged.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: Principle 8: Nested Enterprises

The commons is nested: hive, deployment, region, global. Rules at the local level are made by locals; rules at the global level are made by the global substrate. Local rules may be stricter but never looser than global.

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
| 01 | n01-council-prime | `ed25519:sigil:70a872d3a2…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:86733d291a…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:05c89e1938…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:8ea417e6e1…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:94a2c67ba6…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:387447efdc…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:ede5ac7e93…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:7ae57807b9…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:1fb3174a80…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:7de4deb557682c9cba9bdff2072eca5a8d97acda1b3abade9b8aa00970eaa6cb`

## Defensive FAQ

**Q1. What is in the AI commons?**

The training corpora, the SIGIL keys, the public root, the framework crosswalks, the charters themselves, and any dataset published under an open license by a sovereign deployment.

**Q2. What is private?**

Subject data, agent state, deployment keys, internal hive governance, and any data explicitly marked private by its owner.

**Q3. Who enforces the commons?**

The Watch (n07), the Public Watchdog (n12), and the graduated sanctions layer. The Maternal (n02) holds the care veto over any enforcement action.

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

