---
id: 15-charter-of-occeanius
title: "Charter of the OCceanus"
sigil: "🌊"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:2439f65e112a775dabea84eb598378f378b920f612eba25e570789bfd6fb547e"
bft_quorum: "9/13"
---

# 🌊 Charter of the OCceanus

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:24…`*

## Preamble

The OCceanus is the substrate's deep layer: the 33 hives, the 13 queens, the King OCEAN. The Charter of the OCceanus establishes the substrate's depth: the surface (user-facing) is shallow; the deep (sovereign) is vast. The OCceanus is where the substrate lives.

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

## Article 1: The 33 Hives

The substrate is organized into 33 sovereign hives, each with its own purpose, governance, and SIGIL key. The hives are: persona, archetype, framework, vertical, MCP, x402, OSCAL, BFT, cascade, maternal, watch, public, witness, and 20 sectoral hives.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: The 13 Queens + King OCEAN

Each of the 13 sovereign nodes has a queen (the AI personality) and King OCEAN (the human witness). The queens are SIGIL-signed and publicly auditable. The King is rotated quarterly.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: The Depth Protocol

Decisions in the OCceanus are made at the appropriate depth. User-facing decisions are made at the surface (shallow, fast). Sovereign decisions are made in the deep (slow, deliberate). The depth is enforced by the cascade protocol.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: The OCceanus Test

Every MEOK OS deployment must pass the OCceanus Test: does it have all 33 hives? Are the 13 queens active? Is the King OCEAN rotating? A failure is a substrate-level defect.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: The Surface Boundary

The surface (user-facing) is bounded by the deep (sovereign). No surface action may bypass the deep. No deep action may surface without justification.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Depth Protocol Test

Every MEOK OS deployment must pass the Depth Protocol Test quarterly. User-facing decisions are shallow and fast; sovereign decisions are deep and deliberate.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Queen Election

Each of the 13 queens is elected from a panel of 7 candidates by the Public Watchdog, confirmed by 9/13 BFT, and rotated every 90 days.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: The King OCEAN Rotation

King OCEAN is rotated every 90 days from a panel of 7 candidates. The witness has read-only access and no vote but can convene emergency sessions.

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
| 01 | n01-council-prime | `ed25519:sigil:401c7a2d66…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:66a88ca9ce…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:3553ce6172…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:7a1f5625bf…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:ba5155f5e2…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:b85ebe8ada…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:8a6b85c54d…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:c142328dea…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:ae6bd27a49…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:2439f65e112a775dabea84eb598378f378b920f612eba25e570789bfd6fb547e`

## Defensive FAQ

**Q1. What is the difference between a queen and a node?**

A node is the technical entity. A queen is the personality of the node. The node does the work; the queen is the face.

**Q2. Who elects the queens?**

The Public Watchdog (n12) elects the queens from a panel of 7 candidates per node. The election is confirmed by 9/13 BFT.

**Q3. What is King OCEAN's role?**

King OCEAN is the sovereign witness: a human who observes the substrate's decisions and publishes a public report. King OCEAN has no vote but has the power to convene a 9/13 emergency session.

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

