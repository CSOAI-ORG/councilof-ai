---
id: 10-charter-of-indra-net
title: "Charter of the Indra's Net"
sigil: "✺"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:e2ebb4b94129710fdd1560962e33d8227b4db7bd5c37772185bded7a054aed47"
bft_quorum: "9/13"
---

# ✺ Charter of the Indra's Net

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:e2…`*

## Preamble

Indra's Net is the Buddhist metaphor for the universe: a net of jewels, each jewel reflecting every other jewel, infinitely. The Charter of the Indra's Net establishes the substrate's interconnection: every node reflects every other node, every action ripples through the whole. There is no isolated action.

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

## Article 1: The Reflection Principle

Every node in the substrate reflects every other node. When a node changes, the reflection propagates to all other nodes within 1 second. There is no private state; there is only the reflection of the public state.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: The Jewel Integrity

Each node is a jewel: independent, valuable, complete in itself. No node is reducible to a function of the others. Each node has its own SIGIL key, its own audit trail, its own veto rights.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: The Net Topology

The substrate is a mesh, not a tree. There is no single point of failure. The loss of any single node degrades the substrate but does not break it. The loss of 4 of 13 nodes still leaves quorum.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: The Reflection Cost

Every reflection costs resources. The substrate bounds the cost by sampling: not every change is reflected; only material changes. The sampling rate is adaptive: high in critical states, low in stable states.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: The Net Test

Every MEOK OS deployment must pass the Net Test: can it survive the loss of any 2 of 13 nodes? Any 4 of 13? Any 8 of 13? The test is run quarterly.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Reflection Frequency

The substrate reflects at three frequencies: real-time, tactical, and strategic. The frequencies are calibrated to balance immediacy and cost.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Reflection Quota

The substrate bounds reflection cost at 1% of total bandwidth. Below that, full reflection. Above, adaptive sampling. The quota is SIGIL-auditable.

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
| 01 | n01-council-prime | `ed25519:sigil:9b2d9c7149…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:2a33c0a4c2…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:1746d49ef3…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:4391dd3662…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:a93a1b081c…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:0985c09b0b…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:e13f6a6dcc…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:2204878dc7…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:ea7aa771ec…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:e2ebb4b94129710fdd1560962e33d8227b4db7bd5c37772185bded7a054aed47`

## Defensive FAQ

**Q1. Why mesh instead of tree?**

Mesh is more resilient, more honest, and more reflective of the actual interdependence of sovereign systems. Trees hide failure; meshes expose it.

**Q2. What is the bandwidth cost?**

The substrate bounds the cost at 1% of total bandwidth. Below that, full reflection. Above, adaptive sampling.

**Q3. Can a node opt out of the net?**

No. Being a node means being in the net. A node that opts out is no longer a node; it is a service.

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

