---
id: 03-charter-of-council
title: "Charter of the Council (BFT 9/13)"
sigil: "⚖"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:e98bd6bbd1340ea736cca29d70893fdcd2deb1e7131f4c217c0f94f6225a8b0d"
bft_quorum: "9/13"
---

# ⚖ Charter of the Council (BFT 9/13)

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:e9…`*

## Preamble

The Council is the 13-node sovereign decision body. The Charter of the Council establishes the BFT 9/13 quorum, the three vetoes, the cascade protocol, and the witness rotation. The Council is not a hierarchy; it is a quorum. No node commands; the quorum decides.

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

## Article 1: The 13 Nodes

Council Prime (n01, root orchestrator), Maternal (n02, care veto), Sovereignty (n03, jurisdictional gate), VSM (n04, viable systems recursion), Ostrom (n05, commons governance), BFT (n06, byzantine fault tolerance), Watch (n07, surveillance veto), SigInt (n08, cryptographic audit), x402 (n09, payment rails), Defoneos (n10, defense AI), MEOK OS (n11, operating system), Public Watchdog (n12, citizen veto), King OCEAN (n13, sovereign witness).

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: 9/13 Quorum Rule

Decisions require 9 of 13 nodes to sign within 24 hours. A simple majority of the 13 (7/13) is not enough. The quorum is intentionally high to make decisions costly and to make capture difficult.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Cascade Protocol

Decisions cascade in 7 layers: proposal, second, deliberation, vote, ratification, witness, archive. Each layer has a timeout. A missed timeout forces the decision back to the previous layer.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Three Vetoes

Care Veto (n02, final, no override). Watch Veto (n07, may be overridden by 11/13). Sovereign Veto (n03, requires jurisdictional arbitration). Any node may also file a dissent receipt, which is recorded but not binding.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Witness Rotation

Every 90 days, King OCEAN (n13) rotates the witness role among 7 candidates. The witness has read-only access to all decisions but no vote. The witness publishes a public report every quarter.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Deadlock Rule

If 9/13 cannot be reached in 24 hours, the decision enters a 72-hour cooling period. After cooling, a 7/13 simple majority is sufficient. This prevents hostage-takings by minority vetoes.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Public Square

Every Council meeting is broadcast to the public root. Subjects may observe, submit questions (with 1000+ signature threshold), and petition for emergency sessions. The Public Square is the substrate's forum for democratic engagement.

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
| 01 | n01-council-prime | `ed25519:sigil:02304bfb08…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:1e3d1ac1b9…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:868c351ee9…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:99a563f18a…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:9f8a39520c…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:630d68cece…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:a8bd1e2380…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:f4db4064cb…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:dc1293e967…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:e98bd6bbd1340ea736cca29d70893fdcd2deb1e7131f4c217c0f94f6225a8b0d`

## Defensive FAQ

**Q1. What if a node is captured by an adversary?**

A captured node's votes are voided by 9/13 of the other nodes. The captured node is isolated, its keys are rotated, and a replacement is elected.

**Q2. What if all 13 nodes disagree?**

The substrate enters a 72-hour cooling period. If still no quorum, the witness (n13) issues a public advisory and the previous decision stands.

**Q3. Can a node abstain?**

Yes. Abstention is not veto. Abstention is recorded and counts toward quorum only if it does not push quorum below 9.

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

