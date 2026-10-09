---
id: 01-charter-of-care
title: "Charter of Care"
sigil: "♡"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:56e013328ba5605f6dd778ce86a6c676848149ba970a77c0ed582902f86facc7"
bft_quorum: "9/13"
---

# ♡ Charter of Care

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:56…`*

## Preamble

Care is the foundation of the sovereign substrate. The Charter of Care establishes the six care dimensions (dignity, autonomy, vulnerability, privacy, safety, longevity) and the care floor (0.95) below which no sovereign action may fall. Care precedes sovereignty; care precedes profit; care precedes speed. A sovereign that harms a child to save itself has already lost its sovereignty.

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

## Article 1: The Six Care Dimensions

Dignity: every subject retains inherent worth. Autonomy: every subject retains the right to refuse. Vulnerability: every weakness is protected. Privacy: every datum is sacred. Safety: every action is non-harmful. Longevity: every decision preserves the future.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: The Care Floor of 0.95

Every sovereign action must score at least 0.95 on the calibrated care index. Below 0.95, the action is rejected. Above 0.95, the action proceeds. The floor is enforced by the Maternal Covenant holder, who is the only node with a hard veto.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Vulnerable Subject Registry

Children (under 18), elders (over 75), pregnant persons, persons with cognitive disability, and persons in acute crisis are registered as vulnerable. Any sovereign action that touches a vulnerable subject requires explicit double-key authorization.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Care Veto Mechanics

The Care Veto is invoked by the Maternal node (n02). It cannot be overridden. It cannot be delayed. It cannot be appealed. The substrate halts the action and broadcasts a SIGIL-signed Care Veto receipt to the public root.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Trauma-Informed Defaults

When uncertain, the substrate errs toward protection. When in doubt, it asks. When the answer is unclear, it waits. The default state is care, not action.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Dignity Clause

No subject of sovereign action may be reduced to a metric, a score, or a vector without their informed consent. The substrate maintains a 'dignity envelope' around every subject — a private space that no agent may enter without authorization.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: Right to Refuse

Any subject may refuse any sovereign action directed at them. The substrate records the refusal, broadcasts it to the network, and continues without the subject. Refusal is never a basis for discrimination.

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
| 01 | n01-council-prime | `ed25519:sigil:9350dd3d80…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:223a977ac7…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:45308f2442…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:62e94712ac…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:e1078cfc41…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:31a268b5a9…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:8fb0e5781e…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:5f271387eb…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:e8bad313eb…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:56e013328ba5605f6dd778ce86a6c676848149ba970a77c0ed582902f86facc7`

## Defensive FAQ

**Q1. What counts as 'vulnerable'?**

The registry is dynamic: it expands to include anyone who declares vulnerability, anyone the substrate detects in crisis, and anyone under the protection of jurisdictional law (children, elders, persons with disabilities).

**Q2. Who defines 'harm'?**

Harm is defined by the subject, not by the substrate. The substrate may detect patterns of self-reported harm; it may not impose a definition of harm on a subject who has not consented to that definition.

**Q3. Can a Care Veto be ignored during an emergency?**

No. The Care Veto is a hard floor. In an emergency, the substrate halts, not harms. The emergency is a signal to expand care, not to contract it.

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

