---
id: 18-charter-of-bred-algo
title: "Charter of the Bred Algorithm (Ashby's Law)"
sigil: "⥁"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:7a0843dbfe4cf79d81a1f4fb1ccbd6ef18a9c7bfe5328c937a012d201b0d09c6"
bft_quorum: "9/13"
---

# ⥁ Charter of the Bred Algorithm (Ashby's Law)

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:7a…`*

## Preamble

Ashby's Law: only variety can absorb variety. The Charter of the Bred Algorithm establishes the substrate's variety requirements: the substrate must have at least as much variety as the environment it operates in. The 'bred algorithm' is the algorithm that emerges from breeding many algorithms under selection pressure.

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

## Article 1: The Variety Requirement

The substrate must have at least as much variety as the environment. If the environment has 1000 attack types, the substrate must have at least 1000 defense types. Variety is measured by Shannon entropy.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: The Breeding Process

The substrate breeds algorithms via: (a) mutation (random changes); (b) crossover (combining parents); (c) selection (keeping the fittest). The breeding runs continuously in a sandbox.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: The Selection Pressure

The selection pressure is the care index, the BFT 9/13, the compliance crosswalk, and the public root. An algorithm that fails any of these is selected against.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: The Bred Algorithm Registry

Every bred algorithm is SIGIL-signed, versioned, and registered in the public root. The registry is open: anyone can inspect, audit, or fork a bred algorithm.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: The Breeding Budget

The substrate dedicates 1% of its compute to breeding. Above 1%, breeding is throttled to avoid runaway. Below 1%, breeding is starved and the substrate loses adaptive capacity.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Mutation Rate

The mutation rate is calibrated to balance exploration and exploitation. The rate is adjusted quarterly based on observed breeding outcomes.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Selection Pressure Calibration

The selection pressure is calibrated quarterly against a panel of human reviewers based on diversity and failure rate.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: The Bred Algorithm Deployment

A bred algorithm may be deployed only after it has passed the substrate's full test suite, been audited by the SigInt node, and been approved by 9/13 BFT.

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
| 01 | n01-council-prime | `ed25519:sigil:a3600cec32…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:f767119a9c…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:b74daf8e2f…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:11b9cfc6fd…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:2df16b3662…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:cc8eee6798…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:0e806dc5f0…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:e2d8540d26…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:ce70e9f3d7…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:7a0843dbfe4cf79d81a1f4fb1ccbd6ef18a9c7bfe5328c937a012d201b0d09c6`

## Defensive FAQ

**Q1. Is breeding the same as evolution?**

Yes, but in a controlled, observable, SIGIL-signed environment. The substrate's breeding is auditable in a way natural evolution is not.

**Q2. Can a bred algorithm escape the sandbox?**

No. The sandbox is enforced by the substrate's isolation layer. A bred algorithm that tries to escape is selected against.

**Q3. What is the success rate of breeding?**

Approximately 1 in 10,000 bred algorithms improves on its parents. The substrate runs millions of breedings per day.

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

